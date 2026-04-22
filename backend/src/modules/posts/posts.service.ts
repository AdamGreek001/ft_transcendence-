import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Post } from "../../entities/post.entity";
import { Like } from "../../entities/like.entity";
import { Share } from "../../entities/share.entity";
import { Follow } from "../../entities/follow.entity";
import { NotificationsService } from "../notifications/notifications.service";


@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
        @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
        @InjectRepository(Share) private readonly shareRepo: Repository<Share>,
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
            this.postRepo.manager.count("comments", { where: { postId: id } }),
        ]);

        return { ...post, _count: { likes: likesCount, comments: commentsCount } };
    }

    async getFeed(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const follows = await this.followRepo.find({
        where: { followerId: userId },
        select: ["followingId"],
    });
    const followingIds = follows.map((f) => f.followingId);
    followingIds.push(userId);

    // get posts AND shared posts from following
    const sharedByFollowing = await this.shareRepo.find({
        where: { userId: In(followingIds) },
        relations: ["user"],
    });
    const sharedPostIds = sharedByFollowing.map((s) => s.postId);

    const [posts, total] = await this.postRepo.findAndCount({
        where: [
            { authorId: In(followingIds) },
            { id: In(sharedPostIds.length > 0 ? sharedPostIds : [""]) },
        ],
        order: { createdAt: "DESC" },
        skip,
        take: limit,
        relations: ["author"],
    });

    const data = await Promise.all(
        posts.map(async (post) => {
            const [likesCount, commentsCount, userLike, sharesCount, userShare] = await Promise.all([
                this.likeRepo.count({ where: { postId: post.id } }),
                this.postRepo.manager.count("comments", { where: { postId: post.id } }),
                this.likeRepo.findOne({ where: { postId: post.id, userId } }),
                this.shareRepo.count({ where: { postId: post.id } }),
                this.shareRepo.findOne({ where: { postId: post.id, userId } }),
            ]);

            // find who shared this post among following
            const sharedBy = sharedByFollowing.find((s) => s.postId === post.id && s.userId !== post.authorId);

            return {
                ...post,
                _count: { likes: likesCount, comments: commentsCount, shares: sharesCount },
                isLikedByMe: !!userLike,
                isSharedByMe: !!userShare,
                sharedBy: sharedBy ? {
                    username: sharedBy.user.username,
                    avatarUrl: sharedBy.user.avatarUrl,
                } : null,
            };
        })
    );

    return { data, total, page, limit, hasMore: skip + data.length < total };
}


    async toggleLike(userId: string, postId: string) {
        const existing = await this.likeRepo.findOne({ where: { userId, postId } });

        if (existing) {
            await this.likeRepo.remove(existing);
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
        await this.shareRepo.remove(existing);
        return { shared: false };
    }

    const share = this.shareRepo.create({ userId, postId });
    await this.shareRepo.save(share);
    return { shared: true };
    }
}