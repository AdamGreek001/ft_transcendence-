import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(authorId: string, content: string, imageUrl?: string) {
        return this.prisma.post.create({
            data: { content, imageUrl, authorId },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } },
            },
        });
    }

    async findById(id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } },
            },
        });
        if (!post) throw new NotFoundException("Post not found");
        return post;
    }

    async getFeed(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        followingIds.push(userId); // include own posts

        const [data, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { authorId: { in: followingIds } },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    _count: { select: { likes: true, comments: true } },
                },
            }),
            this.prisma.post.count({ where: { authorId: { in: followingIds } } }),
        ]);

        return { data, total, page, limit, hasMore: skip + data.length < total };
    }

    async toggleLike(userId: string, postId: string) {
        const existing = await this.prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            await this.prisma.like.delete({ where: { id: existing.id } });
            return { liked: false };
        }

        await this.prisma.like.create({ data: { userId, postId } });
        return { liked: true };
    }
}
