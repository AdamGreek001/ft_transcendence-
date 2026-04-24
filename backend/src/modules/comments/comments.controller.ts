import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, UnauthorizedException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Comments")
@Controller("posts/:postId/comments")
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    private getAuthUserId(req: any): string {
        const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;
        if (!userId) {
            throw new UnauthorizedException("Invalid authentication payload");
        }
        return userId;
    }

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
async create(
    @Req() req: any,
    @Param("postId") postId: string,
    @Body() body: { content: string; parentId?: string },
) {
    return this.commentsService.create(this.getAuthUserId(req), postId, body.content, body.parentId);
}
}
