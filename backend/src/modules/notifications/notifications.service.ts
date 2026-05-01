// notifications.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "../../entities/notification.entity";
import { NotificationsGateway } from "./notifications.gateway";

export enum NotificationType {
    LIKE    = "like",
    FOLLOW  = "follow",
    COMMENT = "comment",
    MENTION = "mention",
    REPOST  = "repost",
    MESSAGE = "message",
    SYSTEM  = "system",
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notifRepo: Repository<Notification>,
        private readonly gateway: NotificationsGateway,
    ) {}

    async create(
        recipientId: string,
        actorId: string,
        type: NotificationType | string,
        message: string,
        referenceId?: string | null,
        metadata?: Record<string, any> | null,
    ) {
        if (recipientId === actorId) return null;

        if (referenceId) {
            await this.notifRepo.delete({ recipientId, actorId, type, referenceId });
        }

        const notif = this.notifRepo.create({
            recipientId,
            actorId,
            type,
            message,
            referenceId: referenceId ?? null,
            metadata: metadata ?? null,
            read: false,
        });
        const saved = await this.notifRepo.save(notif);

        const fullNotif = await this.notifRepo.findOne({
            where: { id: saved.id },
            relations: ["actor"],
        });

        this.gateway.sendToUser(recipientId, fullNotif);

        const count = await this.getUnreadCount(recipientId);
        this.gateway.sendUnreadCount(recipientId, count);

        return fullNotif;
    }

    async removeLikeNotification(recipientId: string, actorId: string, postId: string) {
        await this.notifRepo.delete({
            recipientId,
            actorId,
            type: NotificationType.LIKE,
            referenceId: postId,
        });

        const count = await this.getUnreadCount(recipientId);
        this.gateway.sendUnreadCount(recipientId, count);
    }

    async removeShareNotification(recipientId: string, actorId: string, postId: string) {
        await this.notifRepo.delete({
            recipientId,
            actorId,
            type: NotificationType.REPOST,
            referenceId: postId,
        });

        const count = await this.getUnreadCount(recipientId);
        this.gateway.sendUnreadCount(recipientId, count);
    }

    async removeFollowNotification(recipientId: string, actorId: string) {
        await this.notifRepo.delete({
            recipientId,
            actorId,
            type: NotificationType.FOLLOW,
        });

        const count = await this.getUnreadCount(recipientId);
        this.gateway.sendUnreadCount(recipientId, count);
    }


    async notifyLike(recipientId: string, actorId: string, postId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.LIKE,
            "liked your post",
            postId,
        );
    }

    async notifyFollow(recipientId: string, actorId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.FOLLOW,
            "started following you",
            null,
        );
    }

    async notifyComment(
        recipientId: string,
        actorId: string,
        postId: string,
        commentContent: string,
    ) {
        const preview =
            commentContent.length > 50
                ? commentContent.substring(0, 50) + "…"
                : commentContent;

        return this.create(
            recipientId,
            actorId,
            NotificationType.COMMENT,
            `commented: "${preview}"`,
            postId,
        );
    }

    async notifyShare(recipientId: string, actorId: string, postId: string) {
        return this.create(
            recipientId,
            actorId,
            NotificationType.REPOST,
            "shared your post",
            postId,
        );
    }

    async notifyMention(recipientId: string, actorId: string, referenceId: string, context: "post" | "comment") {
        return this.create(
            recipientId,
            actorId,
            NotificationType.MENTION,
            `mentioned you in a ${context}`,
            referenceId,
        );
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
        return { notifications, total, page, limit, hasMore: skip + notifications.length < total };
    }

    async markAsRead(id: string, userId: string) {
        await this.notifRepo.update({ id, recipientId: userId }, { read: true });
        const count = await this.getUnreadCount(userId);
        this.gateway.sendUnreadCount(userId, count);
        return this.notifRepo.findOne({ where: { id, recipientId: userId } });
    }

    async markAllAsRead(userId: string) {
        await this.notifRepo.update({ recipientId: userId, read: false }, { read: true });
        this.gateway.sendUnreadCount(userId, 0);
        return { success: true };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notifRepo.count({ where: { recipientId: userId, read: false } });
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
}