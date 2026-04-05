import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { User } from "../../entities/user.entity";
import { Post } from "../../entities/post.entity";

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    ) { }

    async search(query: string, type?: "users" | "posts") {
        const results: { users?: User[]; posts?: Post[] } = {};

        if (!type || type === "users") {
            results.users = await this.userRepo.find({
                where: [
                    { username: ILike(`%${query}%`) },
                    { displayName: ILike(`%${query}%`) },
                ],
                select: ["id", "username", "displayName", "avatarUrl"],
                take: 20,
            });
        }

        if (!type || type === "posts") {
            results.posts = await this.postRepo.find({
                where: { content: ILike(`%${query}%`) },
                relations: ["author"],
                order: { createdAt: "DESC" },
                take: 20,
            });
        }

        return results;
    }
}
