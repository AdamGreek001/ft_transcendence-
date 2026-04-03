import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DirectMessage } from "../../entities/direct-message.entity";

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(DirectMessage) private readonly msgRepo: Repository<DirectMessage>,
    ) { }

    async sendMessage(senderId: string, receiverId: string, content: string) {
        const msg = this.msgRepo.create({ content, senderId, receiverId });
        return this.msgRepo.save(msg);
    }

    async getConversation(userId1: string, userId2: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        return this.msgRepo.find({
            where: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 },
            ],
            order: { createdAt: "DESC" },
            skip,
            take: limit,
        });
    }

    async getConversations(userId: string) {
        return this.msgRepo
            .createQueryBuilder("dm")
            .leftJoinAndSelect("dm.sender", "sender")
            .leftJoinAndSelect("dm.receiver", "receiver")
            .where("dm.senderId = :userId OR dm.receiverId = :userId", { userId })
            .orderBy("dm.createdAt", "DESC")
            .distinctOn(["dm.senderId", "dm.receiverId"])
            .getMany();
    }
}
