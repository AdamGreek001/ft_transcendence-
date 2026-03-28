import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) { }

    async sendMessage(senderId: string, receiverId: string, content: string) {
        return this.prisma.directMessage.create({
            data: { content, senderId, receiverId },
        });
    }

    async getConversation(userId1: string, userId2: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });
    }

    async getConversations(userId: string) {
        const messages = await this.prisma.directMessage.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: "desc" },
            distinct: ["senderId", "receiverId"],
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, avatarUrl: true } },
            },
        });
        return messages;
    }
}
