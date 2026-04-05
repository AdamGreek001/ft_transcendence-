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

    @Column({ type: "boolean", default: false })
    read: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sender_id" })
    sender: User;

    @ManyToOne(() => User, (user) => user.receivedMessages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "receiver_id" })
    receiver: User;
}
