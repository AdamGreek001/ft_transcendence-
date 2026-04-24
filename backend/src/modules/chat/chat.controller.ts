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
    BadRequestException,
    UnauthorizedException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { MediaService } from "../media/media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { SkipThrottle } from "@nestjs/throttler";
import { SendMessageDto, GetMessagesQueryDto } from "./dto";

// File size limit for chat uploads
const MAX_CHAT_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// File filter for chat uploads (allow any file type)
const chatFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
    callback(null, true);
};

@ApiTags("Chat")
@Controller("chat")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly mediaService: MediaService,
    ) {}

    private getAuthUserId(req: any): string {
        const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;
        if (!userId) {
            throw new UnauthorizedException("Invalid authentication payload");
        }
        return userId;
    }

    @Get("conversations")
    @SkipThrottle()
    @ApiOperation({ summary: "Get all conversations for current user" })
    async getConversations(@Req() req: any) {
        return this.chatService.getConversations(this.getAuthUserId(req));
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
            this.getAuthUserId(req),
            query.page || 1,
            query.limit || 50,
        );
    }

    @Post("messages")
    @ApiOperation({ summary: "Send a direct message" })
    async sendMessage(@Body() dto: SendMessageDto, @Req() req: any) {
        return this.chatService.sendMessage(this.getAuthUserId(req), dto.receiverId, dto.content);
    }

    @Post("conversations/start")
    @ApiOperation({ summary: "Get or create a direct conversation with a user" })
    async startConversation(@Body("userId") userId: string, @Req() req: any) {
        return this.chatService.startConversation(this.getAuthUserId(req), userId);
    }

    @Patch("messages/:id/read")
    @ApiOperation({ summary: "Mark a message as read" })
    async markAsRead(@Param("id") messageId: string, @Req() req: any) {
        return this.chatService.markAsRead(messageId, this.getAuthUserId(req));
    }

    @Patch("conversations/:id/read")
    @ApiOperation({ summary: "Mark all messages in conversation as read" })
    async markConversationAsRead(@Param("id") conversationId: string, @Req() req: any) {
        return this.chatService.markConversationAsRead(conversationId, this.getAuthUserId(req));
    }

    @Get("unread-count")
    @SkipThrottle()
    @ApiOperation({ summary: "Get total unread message count" })
    async getUnreadCount(@Req() req: any) {
        const count = await this.chatService.getUnreadCount(this.getAuthUserId(req));
        return { count };
    }

    @Post("upload")
    @ApiOperation({ summary: "Upload file for chat" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(
        FileInterceptor("file", {
            fileFilter: chatFileFilter,
            limits: { fileSize: MAX_CHAT_FILE_SIZE },
        })
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException("No file provided");
        }
        if (file.size > MAX_CHAT_FILE_SIZE) {
            throw new BadRequestException(
                `File size exceeds maximum limit of 50MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
            );
        }
        return this.mediaService.upload("chat", file);
    }
}
