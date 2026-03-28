import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Comments")
@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Get()
    @ApiOperation({ summary: "Get comments for a post" })
    async findAll(
        @Param("postId") postId: string,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
    ) {
        return this.commentsService.findByPost(postId, +page, +limit);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Add a comment to a post" })
    async create(
        @Req() req: any,
        @Param("postId") postId: string,
        @Body() body: { content: string },
    ) {
        return this.commentsService.create(req.user.sub, postId, body.content);
    }
}
