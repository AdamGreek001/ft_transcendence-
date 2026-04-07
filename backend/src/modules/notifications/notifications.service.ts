import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "../../entities/notification.entity";
import { NotificationsGateway } from "./notifications.gateway";

export enum NotificationType {
    LIKE = "like",
    FOLLOW = "follow",
    COMMENT = "comment",
    MENTION = "mention",
    REPOST = "repost",
    MESSAGE = "message",
    SYSTEM = "system",
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
        private readonly gateway: NotificationsGateway,
    ) {}

    async create(
        recipientId: string,
        actorId: string,
        type: NotificationType | string,
        message: string,
        metadata?: Record<string, any>,
    ) {
        // Don't notify yourself
        if (recipientId === actorId) return null;

        const notif = this.notifRepo.create({
            recipientId,
            actorId,
            type,
            message,
        });
        const saved = await this.notifRepo.save(notif);

        // Load actor info for real-time notification
        const fullNotif = await this.notifRepo.findOne({
            where: { id: saved.id },
            relations: ["actor"],
        });

        // Send real-time notification
        this.gateway.sendToUser(recipientId, fullNotif);

        // Update unread count
        const count = await this.getUnreadCount(recipientId);
        this.gateway.sendUnreadCount(recipientId, count);

        return fullNotif;
    }

    async findByUser(userId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await this.notifRepo.findAndCount({
            where: { recipientId: userId },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
            relations: ["actor"],
        });

        return {
            notifications,
            total,
            page,
            limit,
            hasMore: skip + notifications.length < total,
        };
    }

    async markAsRead(id: string, userId: string) {
        const notif = await this.notifRepo.findOne({ where: { id, recipientId: userId } });
        if (!notif) return null;

        await this.notifRepo.update({ id, recipientId: userId }, { read: true });
        
        // Update unread count
        const count = await this.getUnreadCount(userId);
        this.gateway.sendUnreadCount(userId, count);

        return this.notifRepo.findOne({ where: { id, recipientId: userId } });
    }

    async markAllAsRead(userId: string) {
        await this.notifRepo.update({ recipientId: userId, read: false }, { read: true });
        
        // Update unread count
        this.gateway.sendUnreadCount(userId, 0);

        return { success: true };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifRepo.count({
            where: { recipientId: userId, read: false },
        });
    }

    async deleteOldNotifications(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.notifRepo
            .createQueryBuilder()
            .delete()
            .where("created_at < :cutoffDate AND read = true", { cutoffDate })
            .execute();
    }

    // Helper methods for creating specific notification types
    async notifyLike(recipientId: string, actorId: string, postId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.LIKE,
            "liked your post",
        );
    }

    async notifyFollow(recipientId: string, actorId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.FOLLOW,
            "started following you",
        );
    }

    async notifyComment(recipientId: string, actorId: string, postId: string, commentPreview: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.COMMENT,
            `commented on your post: "${commentPreview.substring(0, 50)}..."`,
        );
    }

    async notifyMention(recipientId: string, actorId: string, context: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.MENTION,
            `mentioned you in a ${context}`,
        );
    }

    async notifyRepost(recipientId: string, actorId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.REPOST,
            "reposted your post",
        );
    }
}
