import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { Inject, forwardRef } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { UsersService } from "../users/users.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";

interface OnlineUser {
    odId: string;
    socketId: string;
    connectedAt: Date;
}

@WebSocketGateway({
    namespace: "/chat",
    cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private onlineUsers: Map<string, string[]> = new Map(); // odId -> socketIds[]

    constructor(
        private readonly chatService: ChatService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @Inject(forwardRef(() => NotificationsGateway))
        private readonly notificationsGateway: NotificationsGateway,
    ) {}

    private getUserIdFromSocket(client: Socket): string | null {
        try {
            const token = client.handshake.auth?.token;
            if (!token) return null;
            
            const payload = this.jwtService.verify(token);
            return payload.sub || payload.userId || null;
        } catch {
            return null;
        }
    }

    async handleConnection(client: Socket) {
        const userId = this.getUserIdFromSocket(client);
        if (userId) {
            // Store userId on the socket for later use
            (client as any).userId = userId;
            client.join(`user:${userId}`);
            
            // Track online status
            const sockets = this.onlineUsers.get(userId) || [];
            sockets.push(client.id);
            this.onlineUsers.set(userId, sockets);

            // Update user online status
            await this.usersService.updateOnlineStatus(userId, true);

            // Broadcast online status to followers/contacts
            this.server.emit("user:online", { userId });
            
            console.log(`User ${userId} connected via WebSocket`);
        } else {
            console.log("WebSocket connection without valid token");
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = (client as any).userId;
        if (userId) {
            client.leave(`user:${userId}`);
            
            // Remove socket from tracking
            const sockets = this.onlineUsers.get(userId) || [];
            const filtered = sockets.filter(id => id !== client.id);
            
            if (filtered.length === 0) {
                this.onlineUsers.delete(userId);
                // Update user offline status only if no more connections
                await this.usersService.updateOnlineStatus(userId, false);
                this.server.emit("user:offline", { userId });
            } else {
                this.onlineUsers.set(userId, filtered);
            }
            
            console.log(`User ${userId} disconnected from WebSocket`);
        }
    }

    @SubscribeMessage("chat:send")
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; content: string },
    ) {
        const senderId = (client as any).userId;
        if (!senderId) return { error: "Unauthorized" };

        try {
            const message = await this.chatService.sendMessage(
                senderId,
                data.receiverId,
                data.content,
            );

            // Emit to receiver
            this.server.to(`user:${data.receiverId}`).emit("chat:message", message);
            
            // Also emit back to sender (for other tabs/devices)
            this.server.to(`user:${senderId}`).emit("chat:message", message);
            
            // Create notification for new message
            const sender = await this.usersService.findById(senderId);
            if (sender) {
                await this.notificationsService.create(
                    data.receiverId,
                    senderId,
                    "message",
                    `New message from ${sender.displayName || sender.username}`,
                );
            }
            
            // Send updated messages unread count to receiver
            const msgUnreadCount = await this.chatService.getUnreadCount(data.receiverId);
            this.notificationsGateway.sendMessagesUnreadCount(data.receiverId, msgUnreadCount);
            
            // Confirm to sender
            return { success: true, message };
        } catch (error) {
            return { error: error.message };
        }
    }

    @SubscribeMessage("chat:typing")
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; conversationId?: string },
    ) {
        const senderId = (client as any).userId;
        if (!senderId) return;

        this.server.to(`user:${data.receiverId}`).emit("chat:typing", {
            userId: senderId,
            conversationId: data.conversationId,
        });
    }

    @SubscribeMessage("chat:stopTyping")
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; conversationId?: string },
    ) {
        const senderId = (client as any).userId;
        if (!senderId) return;

        this.server.to(`user:${data.receiverId}`).emit("chat:stopTyping", {
            userId: senderId,
            conversationId: data.conversationId,
        });
    }

    @SubscribeMessage("chat:read")
    async handleRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId?: string; conversationId?: string },
    ) {
        const userId = (client as any).userId;
        if (!userId) return;

        try {
            if (data.conversationId) {
                await this.chatService.markConversationAsRead(data.conversationId, userId);
            } else if (data.messageId) {
                await this.chatService.markAsRead(data.messageId, userId);
            }
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    // Helper method to emit to a specific user
    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }
}
