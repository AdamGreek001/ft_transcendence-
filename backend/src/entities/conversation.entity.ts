import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./user.entity";
import { DirectMessage } from "./direct-message.entity";

@Entity("conversations")
export class Conversation {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    name: string | null;

    @Column({ type: "boolean", default: false, name: "is_group" })
    isGroup: boolean;

    @Column({ type: "uuid", name: "user1_id" })
    @Index()
    user1Id: string;

    @Column({ type: "uuid", name: "user2_id", nullable: true })
    @Index()
    user2Id: string | null;

    @Column({ type: "varchar", length: 2000, nullable: true, name: "last_message" })
    lastMessage: string | null;

    @Column({ type: "timestamp", nullable: true, name: "last_message_at" })
    lastMessageAt: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user1_id" })
    user1: User;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user2_id" })
    user2: User;

    @OneToMany(() => DirectMessage, (msg) => msg.conversation)
    messages: DirectMessage[];
}
