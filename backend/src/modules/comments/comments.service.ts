import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) { }

    async findByPost(postId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { postId },
                orderBy: { createdAt: "asc" },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                },
            }),
            this.prisma.comment.count({ where: { postId } }),
        ]);
        return { data, total, page, limit, hasMore: skip + data.length < total };
    }

    async create(authorId: string, postId: string, content: string) {
        return this.prisma.comment.create({
            data: { content, authorId, postId },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
            },
        });
    }
}
