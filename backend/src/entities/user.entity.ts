import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Post } from "./post.entity";
import { Comment } from "./comment.entity";
import { Like } from "./like.entity";
import { Follow } from "./follow.entity";
import { Block } from "./block.entity";
import { DirectMessage } from "./direct-message.entity";
import { Notification } from "./notification.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 30, unique: true })
    username!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Exclude()
    @Column({ type: "varchar", nullable: true, name: "password_hash" })
    passwordHash!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true, name: "displayName" })
    displayName!: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    bio!: string | null;

    @Column({ type: "varchar", nullable: true, name: "avatarUrl" })
    avatarUrl!: string | null;

    @Exclude()
    @Column({ type: "varchar", length: 20, nullable: true, name: "oauth_provider" })
    oauthProvider!: string | null;

    @Exclude()
    @Column({ type: "varchar", length: 100, nullable: true, name: "oauth_id" })
    oauthId!: string | null;

    @Exclude()
    @Column({ type: "varchar", length: 255, nullable: true, name: "two_factor_secret" })
    twoFactorSecret!: string | null;

    @Column({ type: "boolean", default: false, name: "two_factor_enabled" })
    twoFactorEnabled!: boolean;

    @Column({ type: "boolean", default: false, name: "is_online" })
    isOnline!: boolean;

    @Column({ type: "timestamp", nullable: true, name: "last_seen_at" })
    lastSeenAt!: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => Post, (post) => post.author)
    posts!: Post[];

    @OneToMany(() => Comment, (comment) => comment.author)
    comments!: Comment[];

    @OneToMany(() => Like, (like) => like.user)
    likes!: Like[];

    @OneToMany(() => Follow, (follow) => follow.following)
    followers!: Follow[];

    @OneToMany(() => Follow, (follow) => follow.follower)
    following!: Follow[];

    @OneToMany(() => Block, (block) => block.blocker)
    blockedUsers!: Block[];

    @OneToMany(() => Block, (block) => block.blocked)
    blockedBy!: Block[];

    @OneToMany(() => DirectMessage, (msg) => msg.sender)
    sentMessages!: DirectMessage[];

    @OneToMany(() => DirectMessage, (msg) => msg.receiver)
    receivedMessages!: DirectMessage[];

    @OneToMany(() => Notification, (n) => n.recipient)
    notifications!: Notification[];

    @OneToMany(() => Notification, (n) => n.actor)
    triggeredNotifications!: Notification[];
}
