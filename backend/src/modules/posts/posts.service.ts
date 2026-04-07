import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Post } from "../../entities/post.entity";
import { Like } from "../../entities/like.entity";
import { Follow } from "../../entities/follow.entity";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
        @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
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

        const [data, total] = await this.postRepo.findAndCount({
            where: { authorId: In(followingIds) },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
            relations: ["author"],
        });

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

        // Send notification to post author
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (post && post.authorId !== userId) {
            await this.notificationsService.notifyLike(post.authorId, userId, postId);
        }

        return { liked: true };
    }
}
