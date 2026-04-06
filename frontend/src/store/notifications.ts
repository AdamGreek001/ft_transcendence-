import { create } from "zustand";

export interface Notification {
    id: string;
    type: "like" | "follow" | "comment" | "mention" | "repost" | "message" | "system";
    message: string;
    read: boolean;
    createdAt: string;
    actor?: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    setUnreadCount: (count: number) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    setConnected: (connected: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    notifications: [],
    unreadCount: 0,
    isConnected: false,

    setNotifications: (notifications) => set({ notifications }),

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        })),

    setUnreadCount: (count) => set({ unreadCount: count }),

    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),

    setConnected: (connected) => set({ isConnected: connected }),
}));
