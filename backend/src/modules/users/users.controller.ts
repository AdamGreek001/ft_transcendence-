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
  UnauthorizedException,
  RequestTimeoutException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "../auth/auth.service";

interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

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
const imageFileFilter = (req: any, file: FileUpload, callback: any) => {
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

  private getAuthUserId(req: any): string {
    const userId = req?.user?.sub || req?.user?.id || req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException("Invalid authentication payload");
    }
    return userId;
  }

  @Get("me")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.usersService.findById(this.getAuthUserId(req));
  }

  @Get("search")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Search users by username/display name" })
  async searchUsers(@Req() req: any, @Query("q") q: string) {
    const userId = this.getAuthUserId(req);
    return this.usersService.searchUsers(q || "", userId);
  }

  @Get("find")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Find users with pattern matching" })
  async findUsers(@Req() req: any, @Query("q") q: string) {
    const userId = this.getAuthUserId(req);
    return this.usersService.searchUsers(q || "", userId);
  }

  @Get("suggestions")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get suggested users to follow" })
  async getSuggestions(@Req() req: any, @Query("limit") limit?: number) {
    return this.usersService.getSuggestions(
      this.getAuthUserId(req),
      limit || 5,
    );
  }

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Follow a user" })
  async followUser(@Req() req: any, @Param("id") id: string) {
    const userId = this.getAuthUserId(req);
    return this.usersService.followUser(userId, id);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Unfollow a user" })
  async unfollowUser(@Req() req: any, @Param("id") id: string) {
    const userId = this.getAuthUserId(req);
    return this.usersService.unfollowUser(userId, id);
  }

  @Get(":username")
  async getProfile(
    @Param("username") username: string,
    @Query("currentUserId") currentUserId?: string,
  ) {
    return this.usersService.findByUsername(username, currentUserId);
  }
  @Patch("settings/update")
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = this.getAuthUserId(req);
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Post("avatar/upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: imageFileFilter,
      limits: {
        fileSize: MAX_AVATAR_SIZE,
      },
    }),
  )
  async uploadAvatar(@Req() req: any, @UploadedFile() file: FileUpload) {
    if (!file) {
      throw new BadRequestException(
        "File not found in the request. Check if the field name is 'file'",
      );
    }

    // Validate file size (double-check in case limits are bypassed)
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 5MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    try {
      const avatarUrl = await this.usersService.uploadAndSaveAvatar(
        this.getAuthUserId(req),
        file,
      );
      return { avatarUrl };
    } catch (error: any) {
      throw new BadRequestException(error.message || "Failed to upload avatar");
    }
  }

  @Delete("avatar/remove")
  @UseGuards(JwtAuthGuard)
  async removeAvatar(@Req() req: any) {
    return this.usersService.removeAvatar(this.getAuthUserId(req));
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
      this.getAuthUserId(req),
      code,
    );
  }

  @Post("2fa/turn-off")
  @UseGuards(JwtAuthGuard)
  async turnOff2FA(@Req() req: any) {
    return this.authService.turnOffTwoFactorAuthentication(
      this.getAuthUserId(req),
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
  @SkipThrottle()
  @ApiOperation({ summary: "Get user followers" })
  async getFollowers(
    @Param("id") id: string,
    @Query("currentUserId") currentUserId?: string,
  ) {
    return this.usersService.getFollowers(id, currentUserId);
  }

  @Get(":id/following")
  @SkipThrottle()
  @ApiOperation({ summary: "Get users this user follows" })
  async getFollowing(
    @Param("id") id: string,
    @Query("currentUserId") currentUserId?: string,
  ) {
    return this.usersService.getFollowing(id, currentUserId);
  }
}
