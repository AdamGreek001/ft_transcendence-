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
import { Comment } from "./comment.entity";
import { Like } from "./like.entity";

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 2000 })
    content: string;

    @Column({ type: "varchar", nullable: true, name: "image_url" })
    imageUrl: string | null;

    @Column({ type: "uuid", name: "author_id" })
    @Index()
    authorId: string;

    @CreateDateColumn({ name: "created_at" })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.posts, { onDelete: "CASCADE" })
    @JoinColumn({ name: "author_id" })
    author: User;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.post)
    likes: Like[];
}
