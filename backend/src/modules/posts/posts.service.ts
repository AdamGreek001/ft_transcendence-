import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Post } from "../../entities/post.entity";
import { Like } from "../../entities/like.entity";
import { Share } from "../../entities/share.entity";
import { Save } from "../../entities/save.entity";
import { Follow } from "../../entities/follow.entity";
import { Comment } from "../../entities/comment.entity"; // ← ADD THIS IMPORT
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
        @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
        @InjectRepository(Share) private readonly shareRepo: Repository<Share>,
        @InjectRepository(Save) private readonly saveRepo: Repository<Save>,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(authorId: string, content: string, imageUrl?: string) {
        const post = this.postRepo.create({ content, imageUrl, authorId });
        const saved = await this.postRepo.save(post);
        return this.findById(saved.id);
    }

    async findById(id: string) {
        const post = await this.postRepo.findOne({
            where: { id },
            relations: ["author"],
        });
        if (!post) throw new NotFoundException("Post not found");

        const [likesCount, commentsCount] = await Promise.all([
            this.likeRepo.count({ where: { postId: id } }),
            this.postRepo.manager.count(Comment, { where: { postId: id } }),
        ]);

        return { ...post, _count: { likes: likesCount, comments: commentsCount } };
    }

    async getFeed(userId: string, page: number, limit: number) {
        try { // ← try opens here
            const skip = (page - 1) * limit;
            const follows = await this.followRepo.find({
                where: { followerId: userId },
                select: ["followingId"],
            });
            const followingIds = follows
                .map((f) => f.followingId)
                .filter(Boolean);

            if (userId) {
                followingIds.push(userId);
            }

            const sharedByFollowing = await this.shareRepo.find({
                where: { userId: In(followingIds) },
                relations: ["user"],
            });
            const sharedPostIds = sharedByFollowing.map((s) => s.postId);

            const [posts, total] = await this.postRepo.findAndCount({
                where: [
                    { authorId: In(followingIds.length ? followingIds : [userId]) },
                    ...(sharedPostIds.length ? [{ id: In(sharedPostIds) }] : []),
                ],
                order: { createdAt: "DESC" },
                skip,
                take: limit,
                relations: ["author"],
            });

            const data = await Promise.all(
                posts.map(async (post) => {
                    const [likesCount, commentsCount, userLike, sharesCount, userShare, userSave] = await Promise.all([
                        this.likeRepo.count({ where: { postId: post.id } }),
                        this.postRepo.manager.count(Comment, { where: { postId: post.id } }),
                        this.likeRepo.findOne({ where: { postId: post.id, userId } }),
                        this.shareRepo.count({ where: { postId: post.id } }),
                        this.shareRepo.findOne({ where: { postId: post.id, userId } }),
                        this.saveRepo.findOne({ where: { postId: post.id, userId } }),
                    ]);

                    const sharedBy = sharedByFollowing.find((s) => s.postId === post.id && s.userId !== post.authorId);

                    return {
                        ...post,
                        _count: { likes: likesCount, comments: commentsCount, shares: sharesCount },
                        isLikedByMe: !!userLike,
                        isSharedByMe: !!userShare,
                        isSavedByMe: !!userSave,
                        sharedBy: sharedBy ? {
                            username: sharedBy.user.username,
                            avatarUrl: sharedBy.user.avatarUrl,
                        } : null,
                    };
                })
            );

            return { data, total, page, limit, hasMore: skip + data.length < total };
        } catch (err) { // ← catch closes the try block properly, INSIDE the class
            console.error('🔴 FEED ERROR:', err);
            throw err;
        }
    } // ← getFeed method closes here

    async toggleLike(userId: string, postId: string) {
        const existing = await this.likeRepo.findOne({ where: { userId, postId } });

        if (existing) {
            await this.likeRepo.remove(existing); // now safe, existing is not null
            return { liked: false };
        }

        const like = this.likeRepo.create({ userId, postId });
        await this.likeRepo.save(like);

        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (post && post.authorId !== userId) {
            await this.notificationsService.notifyLike(post.authorId, userId, postId);
        }

        return { liked: true };
    }

    async toggleShare(userId: string, postId: string) {
        const existing = await this.shareRepo.findOne({ where: { userId, postId } });

        if (existing) {
            await this.shareRepo.remove(existing); // now safe, existing is not null
            return { shared: false };
        }

        const share = this.shareRepo.create({ userId, postId });
        await this.shareRepo.save(share);
        return { shared: true };
    }

    async toggleSave(userId: string, postId: string) {
    const existing = await this.saveRepo.findOne({ where: { userId, postId } });
    if (existing) {
        await this.saveRepo.remove(existing);
        return { saved: false };
    }
    const save = this.saveRepo.create({ userId, postId });
    await this.saveRepo.save(save);
    return { saved: true };
}

async getUserPosts(username: string, viewerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepo.findAndCount({
        where: { author: { username } },
        order: { createdAt: "DESC" },
        skip,
        take: limit,
        relations: ["author"],
    });

    const data = await Promise.all(
        posts.map(async (post) => {
            const [likesCount, commentsCount, userLike, userSave] = await Promise.all([
                this.likeRepo.count({ where: { postId: post.id } }),
                this.postRepo.manager.count("comments", { where: { postId: post.id } }),
                viewerId ? this.likeRepo.findOne({ where: { postId: post.id, userId: viewerId } }) : null,
                viewerId ? this.saveRepo.findOne({ where: { postId: post.id, userId: viewerId } }) : null,
            ]);
            return {
                ...post,
                _count: { likes: likesCount, comments: commentsCount },
                isLikedByMe: !!userLike,
                isSavedByMe: !!userSave,
            };
        })
    );

    return { data, total, page, limit, hasMore: skip + data.length < total };
}

async getSavedPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [saves, total] = await this.saveRepo.findAndCount({
        where: { userId },
        order: { createdAt: "DESC" },
        skip,
        take: limit,
        relations: ["post", "post.author"],
    });

    const data = await Promise.all(
        saves.map(async (save) => {
            const post = save.post;
            const [likesCount, commentsCount, userLike] = await Promise.all([
                this.likeRepo.count({ where: { postId: post.id } }),
                this.postRepo.manager.count("comments", { where: { postId: post.id } }),
                this.likeRepo.findOne({ where: { postId: post.id, userId } }),
            ]);
            return {
                ...post,
                _count: { likes: likesCount, comments: commentsCount },
                isLikedByMe: !!userLike,
                isSavedByMe: true,
            };
        })
    );

    return { data, total, page, limit, hasMore: skip + data.length < total };
}
} 
