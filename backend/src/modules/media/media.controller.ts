import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// File size limits
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_POST_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CHAT_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// File filters
const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: any,
) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      ),
      false,
    );
  }
  callback(null, true);
};

const anyFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  // Allow any file type for chat uploads
  callback(null, true);
};

@ApiTags("Media")
@Controller("media")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload/avatar")
  @ApiOperation({ summary: "Upload user avatar (image only)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_AVATAR_SIZE },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    return this.mediaService.upload("avatars", file);
  }

  @Post("upload/post")
  @ApiOperation({ summary: "Upload post image (image only)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_POST_IMAGE_SIZE },
    }),
  )
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    return this.mediaService.upload("posts", file);
  }
}
