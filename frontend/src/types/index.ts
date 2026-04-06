/* ─── User ────────────────────────────────────────────────── */
export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    displayName: string | null;
    createdAt: string;
}

export interface UserProfile extends User {
    bio: string | null;
    postsCount: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isBlocked: boolean;
}

/* ─── Post ────────────────────────────────────────────────── */
export interface Post {
    id: string;
    content: string;
    imageUrl: string | null;
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
}

/* ─── Comment ─────────────────────────────────────────────── */
export interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    postId: string;
    createdAt: string;
}

/* ─── Chat ────────────────────────────────────────────────── */
export interface Message {
    id: string;
    content: string;
    senderId: string;
    conversationId: string;
    isMine: boolean;
    createdAt: string;
    senderName?: string;
    senderAvatar?: string | null;
}

export interface ChatConversation {
    id: string;
    name: string;
    avatarUrl: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    otherUserId?: string;
    isOnline?: boolean;
}

/* ─── Notification ────────────────────────────────────────── */
export interface Notification {
    id: string;
    type: "like" | "comment" | "follow" | "message";
    message: string;
    fromUser: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    read: boolean;
    createdAt: string;
}

/* ─── API Responses ──────────────────────────────────────── */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
