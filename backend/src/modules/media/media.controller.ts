import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Media")
@Controller("media")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post("upload/avatar")
    @ApiOperation({ summary: "Upload user avatar" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        return this.mediaService.upload("avatars", file);
    }

    @Post("upload/post")
    @ApiOperation({ summary: "Upload post image" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
        return this.mediaService.upload("posts", file);
    }
}
