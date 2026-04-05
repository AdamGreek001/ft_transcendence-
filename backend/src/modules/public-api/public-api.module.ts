import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { PublicApiController } from "./public-api.controller";
import { PublicApiService } from "./public-api.service";
import { User } from "../../entities/user.entity";
import { Post } from "../../entities/post.entity";
import { Comment } from "../../entities/comment.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Post, Comment]),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    ],
    controllers: [PublicApiController],
    providers: [PublicApiService],
})
export class PublicApiModule { }
