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

@Entity("follows")
@Unique(["followerId", "followingId"])
export class Follow {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", name: "follower_id" })
    followerId: string;

    @Column({ type: "uuid", name: "following_id" })
    followingId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.following, { onDelete: "CASCADE" })
    @JoinColumn({ name: "follower_id" })
    follower: User;

    @ManyToOne(() => User, (user) => user.followers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "following_id" })
    following: User;
}
