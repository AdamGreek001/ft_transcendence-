import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { MediaService } from "../media/media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SendMessageDto, GetMessagesQueryDto } from "./dto";

@ApiTags("Chat")
@Controller("chat")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly mediaService: MediaService,
    ) {}

    @Get("conversations")
    @ApiOperation({ summary: "Get all conversations for current user" })
    async getConversations(@Req() req: any) {
        return this.chatService.getConversations(req.user.sub);
    }

    @Get("conversations/:id/messages")
    @ApiOperation({ summary: "Get messages in a conversation" })
    @ApiQuery({ name: "page", required: false, type: Number })
    @ApiQuery({ name: "limit", required: false, type: Number })
    async getMessages(
        @Param("id") conversationId: string,
        @Query() query: GetMessagesQueryDto,
        @Req() req: any,
    ) {
        return this.chatService.getMessages(
            conversationId,
            req.user.sub,
            query.page || 1,
            query.limit || 50,
        );
    }

    @Post("messages")
    @ApiOperation({ summary: "Send a direct message" })
    async sendMessage(@Body() dto: SendMessageDto, @Req() req: any) {
        return this.chatService.sendMessage(req.user.sub, dto.receiverId, dto.content);
    }

    @Patch("messages/:id/read")
    @ApiOperation({ summary: "Mark a message as read" })
    async markAsRead(@Param("id") messageId: string, @Req() req: any) {
        return this.chatService.markAsRead(messageId, req.user.sub);
    }

    @Patch("conversations/:id/read")
    @ApiOperation({ summary: "Mark all messages in conversation as read" })
    async markConversationAsRead(@Param("id") conversationId: string, @Req() req: any) {
        return this.chatService.markConversationAsRead(conversationId, req.user.sub);
    }

    @Get("unread-count")
    @ApiOperation({ summary: "Get total unread message count" })
    async getUnreadCount(@Req() req: any) {
        const count = await this.chatService.getUnreadCount(req.user.sub);
        return { count };
    }

    @Post("upload")
    @ApiOperation({ summary: "Upload file for chat" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.mediaService.upload("chat", file);
    }
}
