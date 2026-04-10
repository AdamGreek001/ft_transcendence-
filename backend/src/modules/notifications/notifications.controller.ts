import { Controller, Get, Patch, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

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
            req.user.sub,
            page || 1,
            limit || 50,
        );
    }

    @Get("unread-count")
    @ApiOperation({ summary: "Get unread notification count" })
    async getUnreadCount(@Req() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.sub);
        return { count };
    }

    @Patch("read-all")
    @ApiOperation({ summary: "Mark all notifications as read" })
    async markAllRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.sub);
    }

    @Patch(":id/read")
    @ApiOperation({ summary: "Mark notification as read" })
    async markRead(@Param("id") id: string, @Req() req: any) {
        return this.notificationsService.markAsRead(id, req.user.sub);
    }
}
