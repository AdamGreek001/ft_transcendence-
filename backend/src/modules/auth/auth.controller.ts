import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, GoogleOAuthDto } from "./auth.dto";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Auth")
@Public()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) { }

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
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  googleAuth(@Req() req: any) {
    // Passport's AuthGuard handles the redirect to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback handler" })
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.handleGoogleCallback(req.user);
    const frontendUrl =
      this.config.get<string>("app.frontendUrl") || "http://localhost:8080";
    const redirectUrl = new URL("/callback", frontendUrl);
    if (result.requires2fa) {
      redirectUrl.searchParams.append("requires2fa", "true");
      redirectUrl.searchParams.append("userId", result.userId);
    } else {
      redirectUrl.searchParams.append("token", result.accessToken || "");
      // Only pass minimal identity fields in the URL - local file paths (avatarUrl)
      // in the JSON trigger ModSecurity path-traversal false positives (403).
      // The frontend will fetch the full profile via /api/users/me after login.
      const safeUser = {
        id: result.user?.id,
        username: result.user?.username,
        email: result.user?.email,
      };
      redirectUrl.searchParams.append("user", JSON.stringify(safeUser));
    }
    res.redirect(redirectUrl.toString());
  }

  @Post("2fa/verify-login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify 2FA code to complete login" })
  async verify2faLogin(@Body() body: { userId: string; code: string }) {
    if (!body.userId || !body.code) {
      throw new BadRequestException("userId and code are required");
    }
    return this.authService.verify2faLogin(body.userId, body.code);
  }

  @Post("google/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate via Google OAuth (frontend)" })
  @ApiBody({ type: GoogleOAuthDto })
  async googleCallbackFrontend(@Body() dto: GoogleOAuthDto) {
    return this.authService.googleOAuth(dto.code);
  }
}
