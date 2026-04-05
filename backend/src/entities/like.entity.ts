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
import { Post } from "./post.entity";

@Entity("likes")
@Unique(["userId", "postId"])
export class Like {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", name: "user_id" })
    userId: string;

    @Column({ type: "uuid", name: "post_id" })
    postId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.likes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Post, (post) => post.likes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post: Post;
}
