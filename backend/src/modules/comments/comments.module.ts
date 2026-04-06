import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { Comment } from "../../entities/comment.entity";
import { Post } from "../../entities/post.entity";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment, Post]),
        AuthModule,
        forwardRef(() => NotificationsModule),
    ],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
