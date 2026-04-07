"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FileUploadModal } from "@/components/chat/FileUploadModal";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useNotificationsStore } from "@/store/notifications";
import { useMessagesStore } from "@/store/messages";
import type { ChatConversation, Message } from "@/types";

interface MessageGroup {
    date: string;
    messages: Message[];
}

interface ConversationResponse {
    id: string;
    name: string;
    avatarUrl: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
    otherUser: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isOnline: boolean;
    };
}

interface MessagesResponse {
    messages: Array<{
        id: string;
        content: string;
        senderId: string;
        receiverId: string;
        conversationId: string;
        read: boolean;
        createdAt: string;
        sender: { id: string; username: string; avatarUrl: string | null };
    }>;
    total: number;
    hasMore: boolean;
}

export default function MessagesPage() {
    const { user, isAuthenticated, isHydrated } = useAuth();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"direct" | "groups">("direct");
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    
    // Notification stores
    const { setUnreadCount: setNotificationUnreadCount } = useNotificationsStore();
    const { setUnreadCount: setMessagesUnreadCount } = useMessagesStore();

    // Handle incoming WebSocket messages
    const handleIncomingMessage = useCallback((message: Message) => {
        // Skip messages we sent ourselves (we handle those via optimistic updates)
        if (message.isMine) {
            // Still update conversation list for our own messages from other devices
            setConversations(prev => prev.map(conv => {
                if (conv.id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: message.content,
                        lastMessageAt: message.createdAt,
                    };
                }
                return conv;
            }));
            return;
        }

        // Add message if it's for the current conversation
        setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
                return prev;
            }
            // Only add to current conversation
            if (message.conversationId === selectedConversationId) {
                return [...prev, message];
            }
            return prev;
        });

        // Update conversation list with new message preview
        setConversations(prev => prev.map(conv => {
            if (conv.id === message.conversationId) {
                return {
                    ...conv,
                    lastMessage: message.content,
                    lastMessageAt: message.createdAt,
                    unreadCount: conv.id !== selectedConversationId ? conv.unreadCount + 1 : conv.unreadCount,
                };
            }
            return conv;
        }));
    }, [selectedConversationId]);

    // Handle typing indicators
    const handleTyping = useCallback((data: { userId: string; conversationId?: string }) => {
        // Show typing indicator if:
        // 1. The conversationId matches, OR
        // 2. The userId matches the other user in the selected conversation
        const selectedConv = conversations.find(c => c.id === selectedConversationId);
        const isFromCurrentChat = data.conversationId === selectedConversationId || 
            (selectedConv && selectedConv.otherUserId === data.userId);
        
        if (isFromCurrentChat) {
            setTypingUsers(prev => new Set(prev).add(data.userId));
        }
    }, [selectedConversationId, conversations]);

    const handleStopTyping = useCallback((data: { userId: string; conversationId?: string }) => {
        setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
        });
    }, []);

    // Handle user online/offline status
    const handleUserOnline = useCallback((data: { userId: string }) => {
        setConversations(prev => prev.map(conv => {
            if (conv.otherUserId === data.userId) {
                return { ...conv, isOnline: true };
            }
            return conv;
        }));
    }, []);

    const handleUserOffline = useCallback((data: { userId: string }) => {
        setConversations(prev => prev.map(conv => {
            if (conv.otherUserId === data.userId) {
                return { ...conv, isOnline: false };
            }
            return conv;
        }));
    }, []);

    // Connect to WebSocket for real-time messaging
    const { isConnected, sendMessage: sendWsMessage, sendTyping, sendStopTyping, markAsRead } = useChatSocket({
        onMessage: handleIncomingMessage,
        onTyping: handleTyping,
        onStopTyping: handleStopTyping,
        onUserOnline: handleUserOnline,
        onUserOffline: handleUserOffline,
    });

    // Fetch conversations from backend
    useEffect(() => {
        if (!isHydrated || !isAuthenticated) return;

        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.get<ConversationResponse[]>("/chat/conversations");
                setConversations(data.map(conv => ({
                    id: conv.id,
                    name: conv.otherUser?.displayName || conv.otherUser?.username || conv.name,
                    avatarUrl: conv.otherUser?.avatarUrl || conv.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.name}`,
                    lastMessage: conv.lastMessage || "",
                    lastMessageAt: conv.lastMessageAt || new Date().toISOString(),
                    unreadCount: conv.unreadCount,
                    otherUserId: conv.otherUser?.id,
                    isOnline: conv.otherUser?.isOnline || false,
                })));
                // Select first conversation by default
                if (data.length > 0 && !selectedConversationId) {
                    setSelectedConversationId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [isHydrated, isAuthenticated]);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedConversationId || !isAuthenticated) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                const data = await apiClient.get<MessagesResponse>(`/chat/conversations/${selectedConversationId}/messages`);
                setMessages(data.messages.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    senderId: msg.senderId,
                    conversationId: msg.conversationId,
                    isMine: msg.senderId === user?.id,
                    createdAt: msg.createdAt,
                    senderName: msg.sender?.username,
                    senderAvatar: msg.sender?.avatarUrl,
                })));
                
                // Mark conversation as read
                await apiClient.patch(`/chat/conversations/${selectedConversationId}/read`);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchMessages();
    }, [selectedConversationId, isAuthenticated, user?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedConversationId || isSending) return;

        const selectedConv = conversations.find(c => c.id === selectedConversationId);
        const receiverId = (selectedConv as ChatConversation & { otherUserId?: string })?.otherUserId;
        
        if (!receiverId) {
            console.error("No receiver ID found");
            return;
        }

        setIsSending(true);
        const messageContent = input;
        setInput("");

        // Optimistically add message
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            senderId: user?.id || "",
            conversationId: selectedConversationId,
            isMine: true,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        // Stop typing indicator
        sendStopTyping(receiverId, selectedConversationId);

        try {
            // Send via WebSocket for real-time delivery
            if (isConnected) {
                const result = await sendWsMessage(receiverId, messageContent);
                if (result.success && result.message) {
                    // Update with real message from server
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempMessage.id 
                            ? { ...msg, id: result.message!.id }
                            : msg
                    ));
                } else {
                    throw new Error(result.error || "Failed to send message");
                }
            } else {
                // Fallback to REST API if WebSocket not connected
                const response = await apiClient.post<{ id: string; content: string; createdAt: string }>("/chat/messages", {
                    receiverId,
                    content: messageContent,
                });

                // Update with real message
                setMessages(prev => prev.map(msg => 
                    msg.id === tempMessage.id 
                        ? { ...msg, id: response.id }
                        : msg
                ));
            }

            // Update conversation last message
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversationId
                    ? { ...conv, lastMessage: messageContent, lastMessageAt: new Date().toISOString() }
                    : conv
            ));
        } catch (error) {
            console.error("Failed to send message:", error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            setInput(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    // Handle input change with typing indicator
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleInputChange = (value: string) => {
        setInput(value);
        
        const selectedConv = conversations.find(c => c.id === selectedConversationId);
        const receiverId = (selectedConv as ChatConversation & { otherUserId?: string })?.otherUserId;
        
        if (!receiverId || !isConnected) return;

        // Send typing indicator
        if (value.trim()) {
            sendTyping(receiverId, selectedConversationId);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                sendStopTyping(receiverId, selectedConversationId);
            }, 2000);
        } else {
            sendStopTyping(receiverId, selectedConversationId);
        }
    };

    // Handle file uploads
    const handleFileUpload = async (files: File[]) => {
        if (!selectedConversationId) return;

        const selectedConv = conversations.find(c => c.id === selectedConversationId);
        const receiverId = (selectedConv as ChatConversation & { otherUserId?: string })?.otherUserId;
        
        if (!receiverId) return;

        setIsUploading(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                const response = await apiClient.post<{ url: string }>(
                    "/chat/upload",
                    formData
                );

                // Send message with file URL
                const fileMessage = `📎 ${file.name}: ${response.url}`;
                
                // Optimistically add message
                const tempMessage: Message = {
                    id: `temp-${Date.now()}`,
                    content: fileMessage,
                    senderId: user?.id || "",
                    conversationId: selectedConversationId,
                    isMine: true,
                    createdAt: new Date().toISOString(),
                };
                setMessages(prev => [...prev, tempMessage]);

                try {
                    // Send via WebSocket for real-time delivery
                    if (isConnected) {
                        const result = await sendWsMessage(receiverId, fileMessage);
                        if (result.success && result.message) {
                            // Update with real message from server
                            setMessages(prev => prev.map(msg => 
                                msg.id === tempMessage.id 
                                    ? { ...msg, id: result.message!.id }
                                    : msg
                            ));
                        }
                    } else {
                        // Fallback to REST API
                        const msgResponse = await apiClient.post<{ id: string }>(
                            "/chat/messages",
                            { receiverId, content: fileMessage }
                        );
                        setMessages(prev => prev.map(msg => 
                            msg.id === tempMessage.id 
                                ? { ...msg, id: msgResponse.id }
                                : msg
                        ));
                    }
                } catch (error) {
                    console.error("Failed to send file message:", error);
                }
            }

            // Update conversation last message
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversationId
                    ? { ...conv, lastMessage: "📎 File shared", lastMessageAt: new Date().toISOString() }
                    : conv
            ));
        } catch (error) {
            console.error("Failed to upload files:", error);
        } finally {
            setIsUploading(false);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji: string) => {
        setInput(prev => prev + emoji);
    };

    // Handle conversation selection
    const handleSelectConversation = async (convId: string) => {
        setSelectedConversationId(convId);
        setTypingUsers(new Set()); // Clear typing indicators when switching conversations
        
        // Mark as read via WebSocket
        if (isConnected) {
            markAsRead(convId);
        }
        
        // Update unread count locally
        setConversations(prev => prev.map(conv =>
            conv.id === convId ? { ...conv, unreadCount: 0 } : conv
        ));
        
        // Update sidebar badge counts
        try {
            const [notifCount, msgCount] = await Promise.all([
                apiClient.get<{ count: number }>("/notifications/unread-count"),
                apiClient.get<{ count: number }>("/chat/unread-count"),
            ]);
            setNotificationUnreadCount(notifCount.count);
            setMessagesUnreadCount(msgCount.count);
        } catch (error) {
            console.error("Failed to update unread counts:", error);
        }
    };

    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

    const groupMessagesByDate = (msgs: Message[]): MessageGroup[] => {
        const groups: { [key: string]: Message[] } = {};
        msgs.forEach((msg) => {
            const date = new Date(msg.createdAt);
            const today = new Date();
            const dateLabel = date.toDateString() === today.toDateString() ? "TODAY" : 
                date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (!groups[dateLabel]) {
                groups[dateLabel] = [];
            }
            groups[dateLabel].push(msg);
        });
        return Object.entries(groups).map(([date, messages]) => ({ date, messages }));
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatLastMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        } else if (diffHours < 24) {
            return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
    };

    // Check if message content is a file URL
    const isFileMessage = (content: string): boolean => {
        return content.includes("📎") && content.includes("/uploads/");
    };

    // Check if it's an image file
    const isImageMessage = (content: string): boolean => {
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
        return imageExtensions.some(ext => content.toLowerCase().includes(ext)) && content.includes("/uploads/");
    };

    // Extract URL from message format "📎 filename: /path/to/file"
    const extractFileUrl = (content: string): string | null => {
        const urlMatch = content.match(/:\s*(\/uploads\/\S+)/);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }
        return null;
    };

    // Get full media URL
    const getFullMediaUrl = (relativePath: string): string => {
        const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:3001/uploads";
        // If path starts with /uploads/, replace it with the full base URL
        if (relativePath.startsWith("/uploads/")) {
            return relativePath.replace("/uploads/", mediaBaseUrl.replace(/\/+$/, "") + "/");
        }
        // Otherwise append the path to base URL
        return `${mediaBaseUrl.replace(/\/+$/, "")}/${relativePath.replace(/^\/+/, "")}`;
    };

    // Extract filename from message content
    const extractFileName = (content: string): string => {
        const match = content.match(/📎\s*([^:]+):/);
        return match ? match[1].trim() : "File";
    };

    // Render message content (text, image, or file)
    const renderMessageContent = (content: string) => {
        if (isImageMessage(content)) {
            const fileUrl = extractFileUrl(content);
            if (fileUrl) {
                const fullUrl = getFullMediaUrl(fileUrl);
                const fileName = extractFileName(content);
                return (
                    <img
                        src={fullUrl}
                        alt={fileName}
                        className="max-w-xs max-h-96 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
                        loading="lazy"
                        onClick={() => window.open(fullUrl, "_blank")}
                        onError={(e) => {
                            // Fallback to link if image fails to load
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                const link = document.createElement("a");
                                link.href = fullUrl;
                                link.target = "_blank";
                                link.rel = "noopener noreferrer";
                                link.textContent = `📎 ${fileName}`;
                                link.className = "text-blue-400 hover:text-blue-300 underline text-sm";
                                parent.innerHTML = "";
                                parent.appendChild(link);
                            }
                        }}
                    />
                );
            }
        } else if (isFileMessage(content)) {
            // Handle non-image files
            const fileUrl = extractFileUrl(content);
            if (fileUrl) {
                const fullUrl = getFullMediaUrl(fileUrl);
                const fileName = extractFileName(content);
                return (
                    <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition"
                    >
                        <svg className="w-5 h-5 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{fileName}</p>
                            <p className="text-xs text-gray-400">Click to download</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                );
            }
        }
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex h-screen bg-[#0d0d0f]">
            {/* Left Sidebar */}
            <AppSidebar />

            {/* Conversations List */}
            <div className="w-80 border-r border-gray-800/50 flex flex-col bg-[#0d0d0f]">
                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search messages, people..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1f] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 flex gap-2 mb-2">
                    <button
                        onClick={() => setActiveTab("direct")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            activeTab === "direct"
                                ? "bg-violet-600 text-white"
                                : "text-gray-400 hover:bg-gray-800/50"
                        }`}
                    >
                        Direct
                    </button>
                    <button
                        onClick={() => setActiveTab("groups")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            activeTab === "groups"
                                ? "bg-violet-600 text-white"
                                : "text-gray-400 hover:bg-gray-800/50"
                        }`}
                    >
                        Groups
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                selectedConversationId === conv.id
                                    ? "bg-gray-800/50"
                                    : "hover:bg-gray-800/30"
                            }`}
                        >
                            <div className="relative">
                                <Avatar src={conv.avatarUrl} alt={conv.name} size={48} />
                                {conv.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0d0d0f] rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-white truncate">{conv.name}</span>
                                    <span className="text-xs text-gray-500">{formatLastMessageTime(conv.lastMessageAt)}</span>
                                </div>
                                <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                            </div>
                            {conv.unreadCount > 0 && (
                                <span className="bg-violet-500 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                                    {conv.unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0d0d0f]">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar src={selectedConversation.avatarUrl} alt={selectedConversation.name} size={40} />
                                <div>
                                    <h2 className="font-semibold text-white">{selectedConversation.name}</h2>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        {selectedConversation.isOnline ? (
                                            <>
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                <span className="text-green-400">Online</span>
                                            </>
                                        ) : (
                                            <span>Offline</span>
                                        )}
                                        {isConnected && <span className="ml-2 text-violet-400">• Connected</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                                <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {messageGroups.map((group) => (
                                <div key={group.date}>
                                    <div className="flex items-center justify-center my-4">
                                        <span className="text-xs text-gray-500 bg-[#1a1a1f] px-3 py-1 rounded-full">{group.date}</span>
                                    </div>
                                    {group.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex mb-4 ${msg.isMine ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`flex items-end gap-2 max-w-[70%] ${msg.isMine ? "flex-row-reverse" : ""}`}>
                                                {!msg.isMine && (
                                                    <Avatar
                                                        src={selectedConversation.avatarUrl}
                                                        alt={selectedConversation.name}
                                                        size={32}
                                                    />
                                                )}
                                                <div>
                                                    <div
                                                        className={`rounded-2xl ${
                                                            isFileMessage(msg.content)
                                                                ? "p-0 bg-transparent"
                                                                : `px-4 py-2.5 ${
                                                                    msg.isMine
                                                                        ? "bg-violet-600 text-white rounded-br-md"
                                                                        : "bg-[#1a1a1f] text-gray-200 rounded-bl-md"
                                                                  }`
                                                        }`}
                                                    >
                                                        {renderMessageContent(msg.content)}
                                                    </div>
                                                    <p className={`text-xs text-gray-500 mt-1 ${msg.isMine ? "text-right" : ""}`}>
                                                        {formatTime(msg.createdAt)}
                                                        {msg.isMine && (
                                                            <span className="ml-1 text-violet-400">✓✓</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-800/50">
                            {/* Typing indicator */}
                            {typingUsers.size > 0 && (
                                <div className="text-xs text-gray-400 mb-2 pl-2">
                                    Someone is typing...
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-full transition"
                                    title="Upload file"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[#1a1a1f] text-white placeholder-gray-500 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                                />
                                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                <button
                                    type="submit"
                                    className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSending}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>

            {/* File Upload Modal */}
            <FileUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleFileUpload}
                isLoading={isUploading}
            />
        </div>
    );
}
