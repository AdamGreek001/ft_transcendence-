import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "../../entities/notification.entity";

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    ) { }

    async create(recipientId: string, actorId: string, type: string, message: string) {
        const notif = this.notifRepo.create({ recipientId, actorId, type, message });
        return this.notifRepo.save(notif);
    }

    async findByUser(userId: string) {
        return this.notifRepo.find({
            where: { recipientId: userId },
            order: { createdAt: "DESC" },
            take: 50,
            relations: ["actor"],
        });
    }

    async markAsRead(id: string) {
        await this.notifRepo.update(id, { read: true });
        return this.notifRepo.findOne({ where: { id } });
    }

    async markAllAsRead(userId: string) {
        return this.notifRepo.update({ recipientId: userId, read: false }, { read: true });
    }
}
