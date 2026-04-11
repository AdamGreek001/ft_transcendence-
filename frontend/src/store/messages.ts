import { create } from "zustand";

interface MessagesState {
    unreadCount: number;
    setUnreadCount: (count: number | ((prev: number) => number)) => void;
    incrementUnread: () => void;
    decrementUnread: (amount?: number) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
    unreadCount: 0,

    setUnreadCount: (countOrFn) => set((state) => ({
        unreadCount: typeof countOrFn === 'function' ? countOrFn(state.unreadCount) : countOrFn
    })),

    incrementUnread: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 })),

    decrementUnread: (amount = 1) =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),
}));
