"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { FileUploadModal } from "@/components/chat/FileUploadModal";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { apiClient, api } from "@/lib/api";
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

interface FollowingRelation {
    followingId: string;
    following: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isOnline?: boolean;
    };
}

interface FollowerRelation {
    followerId: string;
    follower: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isOnline?: boolean;
    };
}

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isHydrated } = useAuth();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
    const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
    const [peopleSearch, setPeopleSearch] = useState("");
    const [friendUsers, setFriendUsers] = useState<FollowingRelation[]>([]);
    const [isStartingChatUserId, setIsStartingChatUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    
    // Notification stores
    const { setUnreadCount: setNotificationUnreadCount } = useNotificationsStore();
    const { setUnreadCount: setMessagesUnreadCount } = useMessagesStore();

    const mapConversation = (conv: ConversationResponse): ChatConversation => ({
        id: conv.id,
        name: conv.otherUser?.displayName || conv.otherUser?.username || conv.name,
        avatarUrl: conv.otherUser?.avatarUrl || conv.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.name}`,
        lastMessage: conv.lastMessage || "",
        lastMessageAt: conv.lastMessageAt || new Date().toISOString(),
        unreadCount: conv.unreadCount,
        otherUserId: conv.otherUser?.id,
        otherUsername: conv.otherUser?.username,
        otherDisplayName: conv.otherUser?.displayName,
        isOnline: conv.otherUser?.isOnline || false,
    });

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

        try {
            const cachedConversations = sessionStorage.getItem("messages_conversations_cache");
            if (cachedConversations) {
                const parsed = JSON.parse(cachedConversations);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setConversations(parsed);
                }
            }
        } catch {
            // Ignore cache parse failures.
        }

        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.get<ConversationResponse[]>("/chat/conversations");
                const mapped = data.map(mapConversation);
                setConversations(mapped);
                sessionStorage.setItem("messages_conversations_cache", JSON.stringify(mapped));

                const preselectedConversationId = searchParams.get("conversationId");
                if (preselectedConversationId) {
                    const exists = mapped.some((c) => c.id === preselectedConversationId);
                    if (exists) {
                        setSelectedConversationId(preselectedConversationId);
                        return;
                    }
                }
                // Select first conversation by default
                if (data.length > 0 && !selectedConversationId) {
                    setSelectedConversationId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
                try {
                    const cachedConversations = sessionStorage.getItem("messages_conversations_cache");
                    if (cachedConversations) {
                        const parsed = JSON.parse(cachedConversations);
                        if (Array.isArray(parsed)) {
                            setConversations(parsed);
                        }
                    }
                } catch {
                    // Ignore cache parse failures.
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [isHydrated, isAuthenticated, searchParams]);

    useEffect(() => {
        if (isHydrated && !isAuthenticated) {
            setIsLoading(false);
        }
    }, [isHydrated, isAuthenticated]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !user?.id) return;

        const fetchFriends = async () => {
            try {
                const [followingData, followersData] = await Promise.all([
                    apiClient.get<FollowingRelation[]>(`/users/${user.id}/following`),
                    apiClient.get<FollowerRelation[]>(`/users/${user.id}/followers`),
                ]);

                const followerIds = new Set(
                    (followersData || [])
                        .map((item) => item.follower?.id || item.followerId)
                        .filter((id): id is string => !!id),
                );

                const friends = (followingData || []).filter((item) => {
                    const friendId = item.following?.id || item.followingId;
                    return !!friendId && followerIds.has(friendId);
                });

                setFriendUsers(friends);
            } catch (error) {
                console.error("Failed to fetch friends list:", error);
                setFriendUsers([]);
            }
        };

        fetchFriends();
    }, [isHydrated, isAuthenticated, user?.id]);

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchesPattern = (text: string, pattern: string) => {
        const normalizedText = text.toLowerCase();
        const normalizedPattern = pattern.toLowerCase().trim();
        if (!normalizedPattern) return true;

        const regexPattern = escapeRegex(normalizedPattern)
            .replace(/\\\*/g, ".*")
            .replace(/\\\?/g, ".");

        try {
            return new RegExp(regexPattern).test(normalizedText);
        } catch {
            return normalizedText.includes(normalizedPattern.replace(/[?*]/g, ""));
        }
    };

    const followingSearchResults = friendUsers
        .filter((item) => {
            const q = peopleSearch.trim();
            if (!q) return false;
            const username = item.following?.username || "";
            const displayName = item.following?.displayName || "";
            return matchesPattern(username, q) || matchesPattern(displayName, q);
        })
        .slice(0, 8);

    const handleStartChatWithFollowing = async (item: FollowingRelation) => {
        const targetId = item.following?.id;
        if (!targetId) return;

        const existing = conversations.find((c) => c.otherUserId === targetId);
        if (existing) {
            setSelectedConversationId(existing.id);
            setPeopleSearch("");
            return;
        }

        setIsStartingChatUserId(targetId);
        try {
            const conv = await apiClient.post<ConversationResponse>("/chat/conversations/start", {
                userId: targetId,
            });
            const mapped = mapConversation(conv);
            setConversations((prev) => [mapped, ...prev]);
            setSelectedConversationId(mapped.id);
            setPeopleSearch("");
        } catch (error) {
            console.error("Failed to start conversation:", error);
        } finally {
            setIsStartingChatUserId(null);
        }
    };

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
                const response = await api.chat.uploadFile(file);

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
        setIsNavSidebarOpen(false);
        setIsInfoSidebarOpen(false);
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
                        className="max-w-[min(72vw,20rem)] max-h-80 sm:max-h-96 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
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
        return <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap break-all">{content}</p>;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex min-h-screen md:h-[100dvh] bg-[#0d0d0f]">
            {isNavSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setIsNavSidebarOpen(false)}
                        className="absolute inset-0 bg-black/60"
                        aria-label="Close navigation sidebar"
                    />
                    <div className="relative h-full w-[min(82vw,18rem)]">
                        <button
                            type="button"
                            onClick={() => setIsNavSidebarOpen(false)}
                            className="absolute right-3 top-3 z-10 p-2 rounded-full bg-black/40 text-white"
                            aria-label="Close sidebar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <AppSidebar />
                    </div>
                </div>
            )}

            {/* Left Sidebar */}
            <div className="hidden lg:block">
                <AppSidebar />
            </div>

            {/* Conversations List */}
            <div className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-72 lg:w-80 border-r border-gray-800/50 flex-col bg-[#0d0d0f]`}>
                {/* Search */}
                <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsNavSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-800/50 rounded-full transition text-gray-300"
                            aria-label="Open navigation sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={peopleSearch}
                                onChange={(e) => setPeopleSearch(e.target.value)}
                                placeholder="Search your friends (* and ? supported)..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1f] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                            />

                            {peopleSearch.trim().length > 0 && (
                                <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-800/50 bg-[#121218] shadow-xl max-h-72 overflow-y-auto">
                                    {followingSearchResults.length === 0 ? (
                                        <p className="px-3 py-3 text-xs text-gray-500">No matching users in your friends list</p>
                                    ) : (
                                        followingSearchResults.map((item) => (
                                            <div
                                                key={item.followingId}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition text-left"
                                            >
                                                <Avatar
                                                    src={item.following.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.following.username}`}
                                                    alt={item.following.displayName || item.following.username}
                                                    size={34}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        href={`/profile/${item.following.username}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="block text-sm text-white truncate hover:text-violet-300 transition"
                                                    >
                                                        {item.following.displayName || item.following.username}
                                                    </Link>
                                                    <Link
                                                        href={`/profile/${item.following.username}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="block text-xs text-gray-500 truncate hover:text-gray-300 transition"
                                                    >
                                                        @{item.following.username}
                                                    </Link>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartChatWithFollowing(item)}
                                                    className="text-xs text-violet-400 hover:text-violet-300 transition"
                                                >
                                                    {isStartingChatUserId === item.following.id ? "..." : "Chat"}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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
            <div className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#0d0d0f]`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-800/50 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsNavSidebarOpen(true)}
                                    className="lg:hidden p-2 hover:bg-gray-800/50 rounded-full transition text-gray-300"
                                    aria-label="Open navigation sidebar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setSelectedConversationId(undefined)}
                                    className="md:hidden p-2 hover:bg-gray-800/50 rounded-full transition text-gray-300"
                                    aria-label="Back to conversations"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsInfoSidebarOpen((prev) => !prev)}
                                    className={`p-2 rounded-full transition ${isInfoSidebarOpen ? "bg-violet-600/20 text-violet-300" : "hover:bg-gray-800/50 text-gray-400"}`}
                                    aria-label="Toggle conversation profile sidebar"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
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
                                            <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] lg:max-w-[68%] ${msg.isMine ? "flex-row-reverse" : ""}`}>
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
                        <div className="p-3 sm:p-4 border-t border-gray-800/50">
                            {/* Typing indicator */}
                            {typingUsers.size > 0 && (
                                <div className="text-xs text-gray-400 mb-2 pl-2">
                                    {selectedConversation?.name || "Someone"} is typing...
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
                                <textarea
                                    value={input}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e as unknown as FormEvent);
                                        }
                                    }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height = Math.min(target.scrollHeight, 150) + "px";
                                    }}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="flex-1 min-w-0 bg-[#1a1a1f] text-white placeholder-gray-500 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50 resize-none overflow-y-auto"
                                    style={{ maxHeight: "150px" }}
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

            {selectedConversation && isInfoSidebarOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsInfoSidebarOpen(false)} />
                    <aside className="fixed right-0 top-0 z-50 h-full w-[min(88vw,22rem)] border-l border-gray-800/60 bg-[#121218] p-5 shadow-2xl lg:static lg:z-auto lg:w-80 lg:border-l lg:border-gray-800/50 lg:shadow-none">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">User Profile</h3>
                            <button
                                type="button"
                                onClick={() => setIsInfoSidebarOpen(false)}
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition"
                                aria-label="Close profile sidebar"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <Avatar src={selectedConversation.avatarUrl} alt={selectedConversation.name} size={88} />
                            <h4 className="mt-4 text-xl font-semibold text-white">{selectedConversation.otherDisplayName || selectedConversation.name}</h4>
                            <p className="mt-1 text-sm text-gray-400">@{selectedConversation.otherUsername || selectedConversation.name.toLowerCase().replace(/\s+/g, "")}</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-700/70 px-3 py-1 text-xs text-gray-300">
                                <span className={`h-2 w-2 rounded-full ${selectedConversation.isOnline ? "bg-green-500" : "bg-gray-500"}`} />
                                {selectedConversation.isOnline ? "Online" : "Offline"}
                            </div>
                        </div>

                        <div className="mt-8 space-y-3 rounded-xl border border-gray-800/70 bg-[#0d0d0f] p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Conversation</span>
                                <span className="max-w-[11rem] truncate text-gray-200">{selectedConversation.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Last message</span>
                                <span className="text-gray-300">{formatLastMessageTime(selectedConversation.lastMessageAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Unread</span>
                                <span className="text-violet-300">{selectedConversation.unreadCount}</span>
                            </div>
                        </div>
                    </aside>
                </>
            )}

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
