import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { DirectMessage } from "../../entities/direct-message.entity";
import { Conversation } from "../../entities/conversation.entity";
import { User } from "../../entities/user.entity";
import { Block } from "../../entities/block.entity";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MediaModule } from "../media/media.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([DirectMessage, Conversation, User, Block]),
        forwardRef(() => UsersModule),
        forwardRef(() => NotificationsModule),
        AuthModule,
        MediaModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatService, ChatGateway],
})
export class ChatModule {}
