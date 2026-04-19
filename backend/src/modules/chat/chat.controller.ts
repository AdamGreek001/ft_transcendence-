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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { MediaService } from "../media/media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
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

    @Post("conversations/start")
    @ApiOperation({ summary: "Get or create a direct conversation with a user" })
    async startConversation(@Body("userId") userId: string, @Req() req: any) {
        return this.chatService.startConversation(req.user.sub, userId);
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
