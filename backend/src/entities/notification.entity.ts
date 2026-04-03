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

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 50 })
    type: string;

    @Column({ type: "varchar", length: 500 })
    message: string;

    @Column({ type: "boolean", default: false })
    read: boolean;

    @Column({ type: "uuid", name: "recipient_id" })
    @Index()
    recipientId: string;

    @Column({ type: "uuid", name: "actor_id" })
    actorId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipient_id" })
    recipient: User;

    @ManyToOne(() => User, (user) => user.triggeredNotifications, { onDelete: "CASCADE" })
    @JoinColumn({ name: "actor_id" })
    actor: User;
}
