import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { appConfig, jwtConfig, dbConfig, uploadConfig, googleConfig, vaultConfig } from "./config/configuration";
import { HealthController } from "./common/health.controller";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PostsModule } from "./modules/posts/posts.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MediaModule } from "./modules/media/media.module";
import { SearchModule } from "./modules/search/search.module";
import { PublicApiModule } from "./modules/public-api/public-api.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, jwtConfig, dbConfig, uploadConfig, googleConfig, vaultConfig],
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres" as const,
                url: config.get<string>("DATABASE_URL"),
                entities: [__dirname + "/entities/*.entity{.ts,.js}"],
                migrations: [__dirname + "/migrations/*{.ts,.js}"],
                synchronize: true, // Creates tables from entities
                logging: config.get<string>("NODE_ENV") === "development",
            }),
        }),

        ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

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
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
})
export class AppModule { }
