import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Post } from "../../entities/post.entity";
import { Comment } from "../../entities/comment.entity";

@Injectable()
export class PublicApiService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
    ) { }

    async getPublicProfile(username: string) {
        const user = await this.userRepo.findOne({
            where: { username },
            select: ["id", "username", "displayName", "bio", "avatarUrl", "createdAt"],
        });
        if (!user) throw new NotFoundException("User not found");
        return user;
    }

    async getUserPosts(username: string, page: number, limit: number) {
        const user = await this.userRepo.findOne({ where: { username } });
        if (!user) throw new NotFoundException("User not found");

        const skip = (page - 1) * limit;
        const [data, total] = await this.postRepo.findAndCount({
            where: { authorId: user.id },
            order: { createdAt: "DESC" },
            skip,
            take: limit,
            relations: ["author"],
        });

        return { data, total, page, limit, hasMore: skip + data.length < total };
    }

    async getTrendingPosts(limit: number) {
        return this.postRepo
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .loadRelationCountAndMap("post.likesCount", "post.likes")
            .orderBy("post.likesCount", "DESC")
            .take(limit)
            .getMany();
    }

    async getPlatformStats() {
        const [users, posts, comments] = await Promise.all([
            this.userRepo.count(),
            this.postRepo.count(),
            this.commentRepo.count(),
        ]);
        return { users, posts, comments };
    }

    async getPost(id: string) {
        const post = await this.postRepo.findOne({
            where: { id },
            relations: ["author"],
        });
        if (!post) throw new NotFoundException("Post not found");
        return post;
    }
}
