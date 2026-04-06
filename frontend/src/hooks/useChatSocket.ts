"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import type { Message } from "@/types";

interface ChatSocketEvents {
    onMessage?: (message: Message) => void;
    onTyping?: (data: { userId: string; conversationId?: string }) => void;
    onStopTyping?: (data: { userId: string; conversationId?: string }) => void;
    onUserOnline?: (data: { userId: string }) => void;
    onUserOffline?: (data: { userId: string }) => void;
}

export function useChatSocket(events?: ChatSocketEvents) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const token = useAuthStore((s) => s.accessToken);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
        const socket = io(`${wsUrl}/chat`, {
            auth: { token },
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("Chat WebSocket connected");
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Chat WebSocket disconnected");
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("Chat WebSocket connection error:", error);
        });

        // Handle incoming messages
        socket.on("chat:message", (message: any) => {
            console.log("Received message:", message);
            if (events?.onMessage) {
                const formattedMessage: Message = {
                    id: message.id,
                    content: message.content,
                    senderId: message.senderId,
                    conversationId: message.conversationId,
                    isMine: message.senderId === user?.id,
                    createdAt: message.createdAt,
                    senderName: message.sender?.username,
                    senderAvatar: message.sender?.avatarUrl,
                };
                events.onMessage(formattedMessage);
            }
        });

        // Handle typing indicators
        socket.on("chat:typing", (data: { userId: string; conversationId?: string }) => {
            if (events?.onTyping) {
                events.onTyping(data);
            }
        });

        socket.on("chat:stopTyping", (data: { userId: string; conversationId?: string }) => {
            if (events?.onStopTyping) {
                events.onStopTyping(data);
            }
        });

        // Handle online status
        socket.on("user:online", (data: { userId: string }) => {
            if (events?.onUserOnline) {
                events.onUserOnline(data);
            }
        });

        socket.on("user:offline", (data: { userId: string }) => {
            if (events?.onUserOffline) {
                events.onUserOffline(data);
            }
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [token, user?.id]); // Note: events intentionally excluded to avoid reconnection on callback changes

    // Update event handlers without reconnecting
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Remove old handlers and add new ones when events change
        const messageHandler = (message: any) => {
            if (events?.onMessage) {
                const formattedMessage: Message = {
                    id: message.id,
                    content: message.content,
                    senderId: message.senderId,
                    conversationId: message.conversationId,
                    isMine: message.senderId === user?.id,
                    createdAt: message.createdAt,
                    senderName: message.sender?.username,
                    senderAvatar: message.sender?.avatarUrl,
                };
                events.onMessage(formattedMessage);
            }
        };

        socket.off("chat:message");
        socket.on("chat:message", messageHandler);

        return () => {
            socket.off("chat:message", messageHandler);
        };
    }, [events?.onMessage, user?.id]);

    // Update typing event handlers
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const typingHandler = (data: { userId: string; conversationId?: string }) => {
            if (events?.onTyping) {
                events.onTyping(data);
            }
        };

        const stopTypingHandler = (data: { userId: string; conversationId?: string }) => {
            if (events?.onStopTyping) {
                events.onStopTyping(data);
            }
        };

        socket.off("chat:typing");
        socket.off("chat:stopTyping");
        socket.on("chat:typing", typingHandler);
        socket.on("chat:stopTyping", stopTypingHandler);

        return () => {
            socket.off("chat:typing", typingHandler);
            socket.off("chat:stopTyping", stopTypingHandler);
        };
    }, [events?.onTyping, events?.onStopTyping]);

    const sendMessage = useCallback(
        (receiverId: string, content: string): Promise<{ success: boolean; message?: Message; error?: string }> => {
            return new Promise((resolve) => {
                if (!socketRef.current?.connected) {
                    resolve({ success: false, error: "Not connected" });
                    return;
                }

                socketRef.current.emit("chat:send", { receiverId, content }, (response: any) => {
                    if (response.success) {
                        resolve({
                            success: true,
                            message: {
                                id: response.message.id,
                                content: response.message.content,
                                senderId: response.message.senderId,
                                conversationId: response.message.conversationId,
                                isMine: true,
                                createdAt: response.message.createdAt,
                            },
                        });
                    } else {
                        resolve({ success: false, error: response.error });
                    }
                });
            });
        },
        [],
    );

    const sendTyping = useCallback((receiverId: string, conversationId?: string) => {
        socketRef.current?.emit("chat:typing", { receiverId, conversationId });
    }, []);

    const sendStopTyping = useCallback((receiverId: string, conversationId?: string) => {
        socketRef.current?.emit("chat:stopTyping", { receiverId, conversationId });
    }, []);

    const markAsRead = useCallback((conversationId: string) => {
        socketRef.current?.emit("chat:read", { conversationId });
    }, []);

    return {
        isConnected,
        sendMessage,
        sendTyping,
        sendStopTyping,
        markAsRead,
    };
}
