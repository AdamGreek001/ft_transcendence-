import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import {
  appConfig,
  jwtConfig,
  dbConfig,
  uploadConfig,
  googleConfig,
  vaultConfig,
} from "./config/configuration";
import { HealthController } from "./common/health.controller";
import { VaultModule } from "./modules/vault/vault.module";

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
      envFilePath: ".env",
      load: [
        appConfig,
        jwtConfig,
        dbConfig,
        uploadConfig,
        googleConfig,
        vaultConfig,
      ],
    }),

    VaultModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("POSTGRES_HOST", "127.0.0.1"), // Default l'localhost
        port: config.get<number>("POSTGRES_PORT", 5432),
        username: config.get<string>("POSTGRES_USER"),
        password: config.get<string>("POSTGRES_PASSWORD"),
        database: config.get<string>("POSTGRES_DB"),
        autoLoadEntities: true,
        // entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: true,
        logging: false,
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
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
