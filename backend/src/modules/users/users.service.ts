import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Follow } from "../../entities/follow.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
    ) { }

    async findByUsername(username: string) {
        const user = await this.userRepo.findOne({
            where: { username },
            select: ["id", "username", "displayName", "bio", "avatarUrl", "createdAt"],
        });
        if (!user) throw new NotFoundException("User not found");

        const [postCount, followerCount, followingCount] = await Promise.all([
            this.userRepo.manager.count("posts", { where: { authorId: user.id } }),
            this.followRepo.count({ where: { followingId: user.id } }),
            this.followRepo.count({ where: { followerId: user.id } }),
        ]);

        return { ...user, _count: { posts: postCount, followers: followerCount, following: followingCount } };
    }

    async updateProfile(id: string, data: { displayName?: string; bio?: string }) {
        await this.userRepo.update(id, data);
        return this.userRepo.findOne({ where: { id } });
    }

    async getFollowers(userId: string) {
        return this.followRepo.find({
            where: { followingId: userId },
            relations: ["follower"],
        });
    }

    async getFollowing(userId: string) {
        return this.followRepo.find({
            where: { followerId: userId },
            relations: ["following"],
        });
    }
}
