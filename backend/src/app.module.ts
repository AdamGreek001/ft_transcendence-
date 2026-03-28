import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PostsModule } from "./modules/posts/posts.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MediaModule } from "./modules/media/media.module";
import { SearchModule } from "./modules/search/search.module";
import { PublicApiModule } from "./modules/public-api/public-api.module";
import { PrismaService } from "./common/prisma.service";
import { HealthController } from "./common/health.controller";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
        AuthModule,
        UsersModule,
        PostsModule,
        CommentsModule,
        ChatModule,
        NotificationsModule,
        MediaModule,
        SearchModule,
        PublicApiModule,
    ],
    controllers: [HealthController],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class AppModule { }
