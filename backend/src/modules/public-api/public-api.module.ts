import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { PublicApiController } from "./public-api.controller";
import { PublicApiService } from "./public-api.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 30, // stricter rate limit for public API
            },
        ]),
    ],
    controllers: [PublicApiController],
    providers: [PublicApiService, PrismaService],
})
export class PublicApiModule { }
