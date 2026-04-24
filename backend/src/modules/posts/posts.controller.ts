import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { Comment } from "../../entities/comment.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get("feed")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get personalized feed" })
    async getFeed(
        @Req() req: any,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
    ) {
        try {
        return this.postsService.getFeed(req.user.sub, +page, +limit);
        } catch (err) {
            console.error('🔴 GET FEED ERROR:', err);
            throw err;
        }
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Create a new post" })
    async create(@Req() req: any, @Body() body: { content: string; imageUrl?: string }) {
        return this.postsService.create(req.user.sub, body.content, body.imageUrl);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get a post by ID" })
    async findOne(@Param("id") id: string) {
        return this.postsService.findById(id);
    }

    @Post(":id/like")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Like or unlike a post" })
    async toggleLike(@Req() req: any, @Param("id") postId: string) {
        return this.postsService.toggleLike(req.user.sub, postId);
    }

    @Post(":id/share")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Share or unshare a post" })
    async toggleShare(@Req() req: any, @Param("id") postId: string) {
        return this.postsService.toggleShare(req.user.sub, postId);
}
}
