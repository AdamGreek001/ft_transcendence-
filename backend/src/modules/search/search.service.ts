import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) { }

    async search(query: string, type?: "users" | "posts") {
        const results: { users?: any[]; posts?: any[] } = {};

        if (!type || type === "users") {
            results.users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: query, mode: "insensitive" } },
                        { displayName: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: { id: true, username: true, displayName: true, avatarUrl: true },
                take: 20,
            });
        }

        if (!type || type === "posts") {
            results.posts = await this.prisma.post.findMany({
                where: { content: { contains: query, mode: "insensitive" } },
                include: {
                    author: { select: { id: true, username: true, avatarUrl: true } },
                    _count: { select: { likes: true, comments: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            });
        }

        return results;
    }
}
