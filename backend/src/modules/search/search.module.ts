import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { User } from "../../entities/user.entity";
import { Post } from "../../entities/post.entity";
import { AuthModule } from "../auth/auth.module";
@Module({
    imports: [TypeOrmModule.forFeature([User, Post]),
                AuthModule],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule { }
