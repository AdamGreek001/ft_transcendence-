export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    FEED: "/feed",
    EXPLORE: "/explore",
    MESSAGES: "/messages",
    NOTIFICATIONS: "/notifications",
    PROFILE: (username: string) => `/profile/${username}`,
    PRIVACY: "/privacy-policy",
    TERMS: "/terms-of-service",
} as const;

export const WS_EVENTS = {
    // Chat
    SEND_MESSAGE: "chat:send",
    NEW_MESSAGE: "chat:message",
    TYPING: "chat:typing",
    // Notifications
    NEW_NOTIFICATION: "notification:new",
    // Presence
    USER_ONLINE: "presence:online",
    USER_OFFLINE: "presence:offline",
} as const;

export const MEDIA_LIMITS = {
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5 MB
    MAX_POST_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;
