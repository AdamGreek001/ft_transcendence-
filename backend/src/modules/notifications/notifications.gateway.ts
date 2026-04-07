import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
    namespace: "/notifications",
    cors: { origin: "*" },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly jwtService: JwtService) {}

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

    handleConnection(client: Socket) {
        const userId = this.getUserIdFromSocket(client);
        if (userId) {
            (client as any).userId = userId;
            client.join(`user:${userId}`);
            console.log(`User ${userId} connected to notifications`);
        } else {
            console.log("Notifications connection without valid token");
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client as any).userId;
        if (userId) {
            client.leave(`user:${userId}`);
            console.log(`User ${userId} disconnected from notifications`);
        }
    }

    // Send notification to specific user
    sendToUser(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit("notification", notification);
    }

    // Send notification to multiple users
    sendToUsers(userIds: string[], notification: any) {
        userIds.forEach(userId => {
            this.server.to(`user:${userId}`).emit("notification", notification);
        });
    }

    // Broadcast unread count update
    sendUnreadCount(userId: string, count: number) {
        this.server.to(`user:${userId}`).emit("notification:count", { count });
    }
    
    // Broadcast messages unread count update
    sendMessagesUnreadCount(userId: string, count: number) {
        this.server.to(`user:${userId}`).emit("messages:count", { count });                 
    }
}
