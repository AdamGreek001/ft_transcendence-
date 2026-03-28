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
import { ChatService } from "./chat.service";

@WebSocketGateway({
    namespace: "/chat",
    cors: { origin: "*" },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) { }

    handleConnection(client: Socket) {
        const userId = client.handshake.auth?.userId;
        if (userId) {
            client.join(`user:${userId}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.auth?.userId;
        if (userId) {
            client.leave(`user:${userId}`);
        }
    }

    @SubscribeMessage("chat:send")
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; content: string },
    ) {
        const senderId = client.handshake.auth?.userId;
        if (!senderId) return;

        const message = await this.chatService.sendMessage(
            senderId,
            data.receiverId,
            data.content,
        );

        this.server.to(`user:${data.receiverId}`).emit("chat:message", message);
        client.emit("chat:message", message);
    }

    @SubscribeMessage("chat:typing")
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string },
    ) {
        const senderId = client.handshake.auth?.userId;
        if (!senderId) return;

        this.server
            .to(`user:${data.receiverId}`)
            .emit("chat:typing", { userId: senderId });
    }
}
