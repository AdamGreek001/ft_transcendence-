import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  BadGatewayException,
  Post,
  BadRequestException,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage, memoryStorage } from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";
import { AuthService } from "../auth/auth.service";

// Allowed image types for avatars
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum avatar file size: 5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// File filter for avatar uploads
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

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.usersService.findById(req.user.id || req.user.sub);
  }

  @Get("search")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Search users by username/display name" })
  async searchUsers(@Req() req: any, @Query("q") q: string) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.searchUsers(q || "", userId);
  }

  @Get("find")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Find users with pattern matching" })
  async findUsers(@Req() req: any, @Query("q") q: string) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.searchUsers(q || "", userId);
  }

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Follow a user" })
  async followUser(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.followUser(userId, id);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Unfollow a user" })
  async unfollowUser(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.unfollowUser(userId, id);
  }

  @Get(":username")
  @ApiOperation({ summary: "Get user profile by username" })
  async getProfile(@Param("username") username: string) {
    return this.usersService.findByUsername(username);
  }

  @Patch("settings/update")
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub || req.user.id;
    if (!userId) {
      throw new BadGatewayException("User ID (sub) is missing from token");
    }
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Post("avatar/upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = "./uploads/avatars";
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext =
            file.mimetype === "image/jpeg"
              ? ".jpg"
              : file.mimetype === "image/png"
                ? ".png"
                : file.mimetype === "image/webp"
                  ? ".webp"
                  : file.mimetype === "image/gif"
                    ? ".gif"
                    : ".jpg";
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: MAX_AVATAR_SIZE,
      },
    }),
  )
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      console.error("No file received in the controller!");
      throw new BadRequestException(
        "File not found in the request. Check if the field name is 'file'",
      );
    }

    // Validate file size client-side as well (in case limits are bypassed)
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 5MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const avatarUrl = `${process.env.NEXT_PUBLIC_MEDIA_URL}/avatars/${file.filename}`;
    await this.usersService.updateAvatar(
      req.user.sub || req.user.id,
      avatarUrl,
    );
    return { avatarUrl };
  }

  @Delete("avatar/remove")
  @UseGuards(JwtAuthGuard)
  async removeAvatar(@Req() req: any) {
    return this.usersService.removeAvatar(req.user.sub || req.user.id);
  }

  @Post("2fa/generate")
  @UseGuards(JwtAuthGuard)
  async generate2FA(@Req() req: any) {
    return this.authService.generateTwoFactorAuthenticationSecret(req.user);
  }

  @Post("2fa/turn-on")
  @UseGuards(JwtAuthGuard)
  async turnOn2FA(@Req() req: any, @Body("code") code: string) {
    return this.authService.turnOnTwoFactorAuthentication(
      req.user.sub || req.user.id,
      code,
    );
  }

  @Post("2fa/turn-off")
  @UseGuards(JwtAuthGuard)
  async turnOff2FA(@Req() req: any) {
    return this.authService.turnOffTwoFactorAuthentication(
      req.user.sub || req.user.id,
    );
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user profile" })
  async updateProfile(
    @Param("id") id: string,
    @Body() body: { displayName?: string; bio?: string },
  ) {
    return this.usersService.updateProfile(id, body);
  }

  @Get(":id/followers")
  @ApiOperation({ summary: "Get user followers" })
  async getFollowers(@Param("id") id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(":id/following")
  @ApiOperation({ summary: "Get users this user follows" })
  async getFollowing(@Param("id") id: string) {
    return this.usersService.getFollowing(id);
  }
}
