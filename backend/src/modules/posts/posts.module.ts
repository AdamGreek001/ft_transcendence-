import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { Post } from "../../entities/post.entity";
import { Like } from "../../entities/like.entity";
import { Follow } from "../../entities/follow.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Post, Like, Follow])],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }
