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
import { Post } from "./post.entity";

@Entity("comments")
export class Comment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 1000 })
    content: string;

    @Column({ type: "uuid", name: "author_id" })
    authorId: string;

    @Column({ type: "uuid", name: "post_id" })
    @Index()
    postId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "author_id" })
    author: User;

    @ManyToOne(() => Post, (post) => post.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post: Post;
}
