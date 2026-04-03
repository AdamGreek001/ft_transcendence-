import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from "typeorm";
import { User } from "./user.entity";

@Entity("blocks")
@Unique(["blockerId", "blockedId"])
export class Block {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", name: "blocker_id" })
    blockerId: string;

    @Column({ type: "uuid", name: "blocked_id" })
    blockedId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.blockedUsers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "blocker_id" })
    blocker: User;

    @ManyToOne(() => User, (user) => user.blockedBy, { onDelete: "CASCADE" })
    @JoinColumn({ name: "blocked_id" })
    blocked: User;
}
