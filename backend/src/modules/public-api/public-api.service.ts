import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PublicApiService {
    constructor(private readonly prisma: PrismaService) { }

    async getPublicProfile(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                createdAt: true,
                _count: { select: { posts: true, followers: true, following: true } },
            },
        });
        if (!user) throw new NotFoundException("User not found");
        return user;
    }

    async getUserPosts(username: string, page: number, limit: number) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) throw new NotFoundException("User not found");

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { authorId: user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    _count: { select: { likes: true, comments: true } },
                },
            }),
            this.prisma.post.count({ where: { authorId: user.id } }),
        ]);

        return { data, total, page, limit, hasMore: skip + data.length < total };
    }

    async getTrendingPosts(limit: number) {
        return this.prisma.post.findMany({
            orderBy: { likes: { _count: "desc" } },
            take: limit,
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } },
            },
        });
    }

    async getPlatformStats() {
        const [users, posts, comments] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.post.count(),
            this.prisma.comment.count(),
        ]);
        return { users, posts, comments };
    }

    async getPost(id: string) {
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
}
