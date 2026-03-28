import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>("JWT_SECRET"),
                signOptions: { expiresIn: config.get<string>("JWT_EXPIRATION", "15m") },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
