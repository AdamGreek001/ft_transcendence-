import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DirectMessage } from "../../entities/direct-message.entity";
import { Conversation } from "../../entities/conversation.entity";
import { User } from "../../entities/user.entity";
import { Block } from "../../entities/block.entity";

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(DirectMessage) private readonly msgRepo: Repository<DirectMessage>,
        @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Block) private readonly blockRepo: Repository<Block>,
    ) {}

    async getOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation> {
        // Check if conversation exists (in either direction)
        let conversation = await this.convRepo.findOne({
            where: [
                { user1Id, user2Id, isGroup: false },
                { user1Id: user2Id, user2Id: user1Id, isGroup: false },
            ],
        });

        if (!conversation) {
            conversation = this.convRepo.create({
                user1Id,
                user2Id,
                isGroup: false,
            });
            await this.convRepo.save(conversation);
        }

        return conversation;
    }

    async sendMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
        // Check if blocked
        const isBlocked = await this.blockRepo.findOne({
            where: [
                { blockerId: receiverId, blockedId: senderId },
                { blockerId: senderId, blockedId: receiverId },
            ],
        });

        if (isBlocked) {
            throw new ForbiddenException("Cannot send message to this user");
        }

        // Get or create conversation
        const conversation = await this.getOrCreateConversation(senderId, receiverId);

        // Create message
        const msg = this.msgRepo.create({
            content,
            senderId,
            receiverId,
            conversationId: conversation.id,
        });
        const savedMsg = await this.msgRepo.save(msg);

        // Update conversation with last message
        await this.convRepo.update(conversation.id, {
            lastMessage: content.substring(0, 100),
            lastMessageAt: new Date(),
        });

        // Return with sender info
        const fullMsg = await this.msgRepo.findOne({
            where: { id: savedMsg.id },
            relations: ["sender"],
        });

        return fullMsg!;
    }

    async getConversations(userId: string) {
        const conversations = await this.convRepo
            .createQueryBuilder("conv")
            .leftJoinAndSelect("conv.user1", "user1")
            .leftJoinAndSelect("conv.user2", "user2")
            .where("conv.user1Id = :userId OR conv.user2Id = :userId", { userId })
            .orderBy("conv.lastMessageAt", "DESC", "NULLS LAST")
            .getMany();

        // Add unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await this.msgRepo.count({
                    where: {
                        conversationId: conv.id,
                        receiverId: userId,
                        read: false,
                    },
                });

                // Get the other user in the conversation
                const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

                return {
                    id: conv.id,
                    name: conv.name || otherUser?.displayName || otherUser?.username,
                    avatarUrl: otherUser?.avatarUrl,
                    lastMessage: conv.lastMessage,
                    lastMessageAt: conv.lastMessageAt,
                    unreadCount,
                    otherUser: otherUser ? {
                        id: otherUser.id,
                        username: otherUser.username,
                        displayName: otherUser.displayName,
                        avatarUrl: otherUser.avatarUrl,
                        isOnline: otherUser.isOnline,
                    } : null,
                };
            })
        );

        return conversationsWithUnread;
    }

    async getMessages(conversationId: string, userId: string, page: number, limit: number) {
        // Verify user is part of conversation
        const conversation = await this.convRepo.findOne({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException("Conversation not found");
        }

        if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
            throw new ForbiddenException("Not a member of this conversation");
        }

        const skip = (page - 1) * limit;
        const [messages, total] = await this.msgRepo.findAndCount({
            where: { conversationId },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
            relations: ["sender"],
        });

        return {
            messages: messages.reverse(),
            total,
            page,
            limit,
            hasMore: skip + messages.length < total,
        };
    }

    async markAsRead(messageId: string, userId: string) {
        const message = await this.msgRepo.findOne({ where: { id: messageId } });
        
        if (!message) {
            throw new NotFoundException("Message not found");
        }

        if (message.receiverId !== userId) {
            throw new ForbiddenException("Cannot mark this message as read");
        }

        await this.msgRepo.update(messageId, { read: true, readAt: new Date() });
        return { success: true };
    }

    async markConversationAsRead(conversationId: string, userId: string) {
        await this.msgRepo.update(
            { conversationId, receiverId: userId, read: false },
            { read: true, readAt: new Date() }
        );
        return { success: true };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.msgRepo.count({
            where: { receiverId: userId, read: false },
        });
    }
}
