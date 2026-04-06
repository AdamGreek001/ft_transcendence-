import { Module } from "@nestjs/common";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { AuthModule } from "../auth/auth.module"; // 👈 add this

@Module({
    imports: [AuthModule], // 👈 FIX
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule {}