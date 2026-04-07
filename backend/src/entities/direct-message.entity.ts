import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./user.entity";
import { Conversation } from "./conversation.entity";

@Entity("direct_messages")
export class DirectMessage {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 2000 })
    content: string;

    @Column({ type: "uuid", name: "sender_id" })
    @Index()
    senderId: string;

    @Column({ type: "uuid", name: "receiver_id" })
    @Index()
    receiverId: string;

    @Column({ type: "uuid", name: "conversation_id", nullable: true })
    @Index()
    conversationId: string | null;

    @Column({ type: "boolean", default: false })
    read: boolean;

    @Column({ type: "timestamp", nullable: true, name: "read_at" })
    readAt: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sender_id" })
    sender: User;

    @ManyToOne(() => User, (user) => user.receivedMessages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "receiver_id" })
    receiver: User;

    @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "conversation_id" })
    conversation: Conversation;
}
