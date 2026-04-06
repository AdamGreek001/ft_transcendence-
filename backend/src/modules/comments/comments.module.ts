import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { Comment } from "../../entities/comment.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [TypeOrmModule.forFeature([Comment])
                , AuthModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule { }
