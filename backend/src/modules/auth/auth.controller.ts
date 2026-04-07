import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, GoogleOAuthDto } from "./auth.dto";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth(@Req() req: any) {}

  @Post("google/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate via Google OAuth" })
  @ApiBody({ type: GoogleOAuthDto })
  async googleCallback(@Body() dto: GoogleOAuthDto) {
    return this.authService.googleOAuth(dto.code);
  }

  @Post("2fa/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify 2FA TOTP code" })
  async verify2fa(@Body() body: { userId: string; code: string }) {
    return this.authService.verify2fa(body.userId, body.code);
  }
}
