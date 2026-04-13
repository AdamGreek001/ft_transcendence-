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
} from "@nestjs/common";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, GoogleOAuthDto } from "./auth.dto";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

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
    redirectUrl.searchParams.append("token", result.accessToken);
    redirectUrl.searchParams.append("user", JSON.stringify(result.user));
    res.redirect(redirectUrl.toString());
  }

  @Post("google/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate via Google OAuth (frontend)" })
  @ApiBody({ type: GoogleOAuthDto })
  async googleCallbackFrontend(@Body() dto: GoogleOAuthDto) {
    return this.authService.googleOAuth(dto.code);
  }
}
