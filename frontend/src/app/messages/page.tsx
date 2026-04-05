"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { ChatConversation, Message } from "@/types";

interface MessageGroup {
    date: string;
    messages: Message[];
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>("1");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"direct" | "groups">("direct");
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock data
    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setConversations([
                {
                    id: "1",
                    name: "Design Team",
                    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=DT&backgroundColor=22c55e",
                    lastMessage: "Meeting starts in 5 minutes...",
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0,
                },
                {
                    id: "2",
                    name: "Jordan Smith",
                    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
                    lastMessage: "Check out these new assets",
                    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
                    unreadCount: 2,
                },
                {
                    id: "3",
                    name: "Sarah Connor",
                    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
                    lastMessage: "Thanks for the feedback!",
                    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
                    unreadCount: 0,
                },
            ]);
            setIsLoading(false);
        }, 500);
    }, []);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            const mockMessages: Message[] = [
                {
                    id: "m1",
                    content: "Hey team! I've uploaded the final prototypes for the chat interface. Take a look when you can.",
                    senderId: "user1",
                    conversationId: selectedConversationId,
                    isMine: false,
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: "m3",
                    content: "They look great, Jordan! Love the new notification badges. We should sync for 5 mins before the meeting.",
                    senderId: "me",
                    conversationId: selectedConversationId,
                    isMine: true,
                    createdAt: new Date(Date.now() - 2400000).toISOString(),
                },
                {
                    id: "m4",
                    content: "Meeting starts in 5 minutes. I'll open the room now.",
                    senderId: "user1",
                    conversationId: selectedConversationId,
                    isMine: false,
                    createdAt: new Date(Date.now() - 300000).toISOString(),
                },
            ];
            setMessages(mockMessages);
            setIsLoading(false);
        }, 300);
    }, [selectedConversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedConversationId) return;

        const newMessage: Message = {
            id: `m${Date.now()}`,
            content: input,
            senderId: "me",
            conversationId: selectedConversationId,
            isMine: true,
            createdAt: new Date().toISOString(),
        };

        setMessages([...messages, newMessage]);
        setInput("");

        setConversations((prevConversations) =>
            prevConversations.map((conv) =>
                conv.id === selectedConversationId
                    ? { ...conv, lastMessage: input, lastMessageAt: new Date().toISOString() }
                    : conv
            )
        );

        setTimeout(() => {
            const response: Message = {
                id: `m${Date.now() + 1}`,
                content: "That sounds great!",
                senderId: "user1",
                conversationId: selectedConversationId,
                isMine: false,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, response]);
        }, 1500);
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
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                selectedConversationId === conv.id
                                    ? "bg-gray-800/50"
                                    : "hover:bg-gray-800/30"
                            }`}
                        >
                            <div className="relative">
                                <Avatar src={conv.avatarUrl} alt={conv.name} size={48} />
                                {conv.id === "1" && (
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
                                    <p className="text-xs text-violet-400">4 members active</p>
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
                                                        className={`px-4 py-2.5 rounded-2xl ${
                                                            msg.isMine
                                                                ? "bg-violet-600 text-white rounded-br-md"
                                                                : "bg-[#1a1a1f] text-gray-200 rounded-bl-md"
                                                        }`}
                                                    >
                                                        <p className="text-sm leading-relaxed">{msg.content}</p>
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
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-full transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[#1a1a1f] text-white placeholder-gray-500 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                                />
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-full transition">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3.5 6c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                                    </svg>
                                </button>
                                <button
                                    type="submit"
                                    className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition"
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
        </div>
    );
}
