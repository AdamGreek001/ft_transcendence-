import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findByUsername(username: string) {
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

    async updateProfile(id: string, data: { displayName?: string; bio?: string }) {
        return this.prisma.user.update({ where: { id }, data });
    }

    async getFollowers(userId: string) {
        return this.prisma.follow.findMany({
            where: { followingId: userId },
            include: { follower: { select: { id: true, username: true, avatarUrl: true } } },
        });
    }

    async getFollowing(userId: string) {
        return this.prisma.follow.findMany({
            where: { followerId: userId },
            include: { following: { select: { id: true, username: true, avatarUrl: true } } },
        });
    }
}
