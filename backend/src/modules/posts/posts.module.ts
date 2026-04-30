import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { Post } from "../../entities/post.entity";
import { Like } from "../../entities/like.entity";
import { Follow } from "../../entities/follow.entity";
import { Share } from "../../entities/share.entity";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { Save } from "../../entities/save.entity";
import { HiddenPost } from "../../entities/hidden-post.entity";


@Module({
    imports: [
            TypeOrmModule.forFeature([Post, Like, Follow, Share, Save, HiddenPost]),
        AuthModule,
        forwardRef(() => NotificationsModule),
    ],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule {}
