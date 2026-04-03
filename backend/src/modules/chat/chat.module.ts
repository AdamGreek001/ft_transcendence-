import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { DirectMessage } from "../../entities/direct-message.entity";

@Module({
    imports: [TypeOrmModule.forFeature([DirectMessage])],
    providers: [ChatGateway, ChatService],
})
export class ChatModule { }
