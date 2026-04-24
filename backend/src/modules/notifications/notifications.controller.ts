import { Controller, Get, Patch, Param, Query, UseGuards, Req, UnauthorizedException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Notifications")
@Controller("notifications")
@SkipThrottle()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    private getAuthUserId(req: any): string {
        const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;
        if (!userId) {
            throw new UnauthorizedException("Invalid authentication payload");
        }
        return userId;
    }

    @Get()
    @ApiOperation({ summary: "Get user notifications" })
    @ApiQuery({ name: "page", required: false, type: Number })
    @ApiQuery({ name: "limit", required: false, type: Number })
    async findAll(
        @Req() req: any,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
    ) {
        return this.notificationsService.findByUser(
            this.getAuthUserId(req),
            page || 1,
            limit || 50,
        );
    }

    @Get("unread-count")
    @ApiOperation({ summary: "Get unread notification count" })
    async getUnreadCount(@Req() req: any) {
        const count = await this.notificationsService.getUnreadCount(this.getAuthUserId(req));
        return { count };
    }

    @Patch("read-all")
    @ApiOperation({ summary: "Mark all notifications as read" })
    async markAllRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(this.getAuthUserId(req));
    }

    @Patch(":id/read")
    @ApiOperation({ summary: "Mark notification as read" })
    async markRead(@Param("id") id: string, @Req() req: any) {
        return this.notificationsService.markAsRead(id, this.getAuthUserId(req));
    }
}
