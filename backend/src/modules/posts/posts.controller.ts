import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UnauthorizedException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { Comment } from "../../entities/comment.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    private getAuthUserId(req: any): string {
        const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;
        if (!userId) {
            throw new UnauthorizedException("Invalid authentication payload");
        }
        return userId;
    }

    @Get("feed")
    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get personalized feed" })
    async getFeed(
        @Req() req: any,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
    ) {
        try {
        return this.postsService.getFeed(this.getAuthUserId(req), +page, +limit);
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
        return this.postsService.create(this.getAuthUserId(req), body.content, body.imageUrl);
    }
    
    @Get("saved")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get saved posts" })
    async getSaved(
        @Req() req: any,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
    ) {
        return this.postsService.getSavedPosts(req.user.sub, +page, +limit);
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
        return this.postsService.toggleLike(this.getAuthUserId(req), postId);
    }

    @Post(":id/share")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Share or unshare a post" })
    async toggleShare(@Req() req: any, @Param("id") postId: string) {
        return this.postsService.toggleShare(this.getAuthUserId(req), postId);
}
    @Post(":id/save")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Save or unsave a post" })
    async toggleSave(@Req() req: any, @Param("id") postId: string) {
        return this.postsService.toggleSave(this.getAuthUserId(req), postId);
    }

    @Get("user/:username")
    @ApiOperation({ summary: "Get posts by username" })
    async getUserPosts(
        @Param("username") username: string,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
        @Req() req: any,
    ) {
        return this.postsService.getUserPosts(username, req.user?.sub, +page, +limit);
    }
    
}
