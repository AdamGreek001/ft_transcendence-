import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "../../entities/comment.entity";
import { Post } from "../../entities/post.entity";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
    ) { }

    async findByPost(postId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.commentRepo.findAndCount({
            where: { postId },
            order: { createdAt: "ASC" },
            skip,
            take: limit,
            relations: ["author"],
        });
        return { data, total, page, limit, hasMore: skip + data.length < total };
    }

    async create(authorId: string, postId: string, content: string) {
        const comment = this.commentRepo.create({ content, authorId, postId });
        const saved = await this.commentRepo.save(comment);
        
        // Send notification to post author
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (post && post.authorId !== authorId) {
            await this.notificationsService.notifyComment(
                post.authorId,
                authorId,
                postId,
                content,
            );
        }

        return this.commentRepo.findOne({ where: { id: saved.id }, relations: ["author"] });
    }
}
