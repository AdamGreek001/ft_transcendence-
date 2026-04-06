"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore, type Notification } from "@/store/notifications";
import { useMessagesStore } from "@/store/messages";

export function useNotificationSocket() {
    const socketRef = useRef<Socket | null>(null);
    const token = useAuthStore((s) => s.accessToken);
    const { addNotification, setUnreadCount, setConnected } = useNotificationsStore();
    const { setUnreadCount: setMessagesUnreadCount } = useMessagesStore();

    useEffect(() => {
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
        const socket = io(`${wsUrl}/notifications`, {
            auth: { token },
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("Notifications WebSocket connected");
            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Notifications WebSocket disconnected");
            setConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("Notifications WebSocket connection error:", error);
        });

        // Handle incoming notifications
        socket.on("notification", (data: any) => {
            console.log("Received notification:", data);
            const notification: Notification = {
                id: data.id,
                type: data.type,
                message: data.message,
                read: data.read || false,
                createdAt: data.createdAt,
                actor: data.actor
                    ? {
                          id: data.actor.id,
                          username: data.actor.username,
                          displayName: data.actor.displayName,
                          avatarUrl: data.actor.avatarUrl,
                      }
                    : undefined,
            };
            addNotification(notification);
            
            // If it's a message notification, also increment message unread count
            if (data.type === "message") {
                setMessagesUnreadCount((prev: number) => prev + 1);
            }
        });

        // Handle unread count updates
        socket.on("notification:count", (data: { count: number }) => {
            console.log("Unread count update:", data.count);
            setUnreadCount(data.count);
        });
        
        // Handle message unread count updates
        socket.on("messages:count", (data: { count: number }) => {
            console.log("Messages unread count update:", data.count);
            setMessagesUnreadCount(data.count);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [token, addNotification, setUnreadCount, setConnected, setMessagesUnreadCount]);

    return socketRef.current;
}
