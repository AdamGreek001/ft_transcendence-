import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(recipientId: string, actorId: string, type: string, message: string) {
        return this.prisma.notification.create({
            data: { recipientId, actorId, type, message },
        });
    }

    async findByUser(userId: string) {
        return this.prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                actor: { select: { id: true, username: true, avatarUrl: true } },
            },
        });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({ where: { id }, data: { read: true } });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { recipientId: userId, read: false },
            data: { read: true },
        });
    }
}
