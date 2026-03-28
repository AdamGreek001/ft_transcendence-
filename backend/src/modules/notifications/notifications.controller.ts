import { Controller, Get, Patch, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: "Get user notifications" })
    async findAll(@Req() req: any) {
        return this.notificationsService.findByUser(req.user.sub);
    }

    @Patch(":id/read")
    @ApiOperation({ summary: "Mark notification as read" })
    async markRead(@Param("id") id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch("read-all")
    @ApiOperation({ summary: "Mark all notifications as read" })
    async markAllRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.sub);
    }
}
