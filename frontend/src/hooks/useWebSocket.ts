"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

export function useWebSocket(namespace = "/") {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const token = useAuthStore((s) => s.accessToken);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://localhost";
        const socket = io(`${wsUrl}${namespace}`, {
            auth: { token },
            transports: ["websocket"],
            autoConnect: true,
        });

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [namespace, token]);

    const emit = useCallback(
        (event: string, data?: unknown) => {
            socketRef.current?.emit(event, data);
        },
        [],
    );

    const on = useCallback(
        (event: string, handler: (...args: unknown[]) => void) => {
            socketRef.current?.on(event, handler);
            return () => {
                socketRef.current?.off(event, handler);
            };
        },
        [],
    );

    return { socket: socketRef.current, isConnected, emit, on };
}
