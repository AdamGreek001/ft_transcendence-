import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { LoginDto, RegisterDto } from "./auth.dto";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) {
      throw new ConflictException("Username or email already taken");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });
    await this.userRepo.save(user);

    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // if (user.twoFactorEnabled) {
    //   return {
    //     requires2fa: true,
    //     userId: user.id,
    //     message: "Please provide your 2FA code to complete login",
    //   };
    // }

    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async googleOAuth(code: string) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: this.config.get("GOOGLE_CLIENT_ID"),
        client_secret: this.config.get("GOOGLE_CLIENT_SECRET"),
        redirect_uri: this.config.get("GOOGLE_CALLBACK_URL"),
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new UnauthorizedException("Failed to exchange Google auth code");
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      throw new UnauthorizedException("Failed to fetch Google user info");
    }

    let user = await this.userRepo.findOne({
      where: [{ email: googleUser.email }, { oauthId: googleUser.id }],
    });

    if (!user) {
      const username =
        googleUser.email.split("@")[0] + "_" + Date.now().toString(36);
      user = this.userRepo.create({
        username,
        email: googleUser.email,
        displayName: googleUser.name || null,
        avatarUrl: googleUser.picture || null,
        oauthProvider: "google",
        oauthId: googleUser.id,
      });
      await this.userRepo.save(user);
    }

    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async handleGoogleCallback(googleUser: any) {
    if (!googleUser?.email) {
      throw new UnauthorizedException("Failed to retrieve Google user email");
    }

    let user = await this.userRepo.findOne({
      where: { email: googleUser.email },
    });

    if (!user) {
      const username =
        googleUser.email.split("@")[0] + "_" + Date.now().toString(36);
      user = this.userRepo.create({
        username,
        email: googleUser.email,
        displayName: googleUser.firstName
          ? `${googleUser.firstName} ${googleUser.lastName}`.trim()
          : null,
        avatarUrl: googleUser.picture || null,
        oauthProvider: "google",
      });
      await this.userRepo.save(user);
    }

    const token = this.jwt.sign({ sub: user.id, username: user.username });
    return {
      accessToken: token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async generateTwoFactorAuthenticationSecret(user: any) {
    console.log("🟢 JWT User Payload:", user);

    const userId = user?.id || user?.sub || user?.userId;
    const accountName = user?.email || user?.username || "StitchSocial_User";
    if (!userId) {
      throw new BadRequestException(
        "User ID is missing from the token payload!",
      );
    }

    try {
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(
        accountName,
        "StitchSocial",
        secret,
      );
      await this.userRepo.update(userId, { twoFactorSecret: secret });

      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      return { qrCodeDataUrl };
    } catch (error) {
      console.error("🔴 Error f DB wla QR Generation:", error);
      throw new InternalServerErrorException("Failed to generate 2FA QR code");
    }
  }

  async turnOnTwoFactorAuthentication(userId: string, authCode: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException("2FA secret not initialized");
    }

    const isCodeValid = authenticator.verify({
      token: authCode,
      secret: user.twoFactorSecret,
    });

    if (!isCodeValid) {
      throw new BadRequestException("Wrong authentication code");
    }

    await this.userRepo.update(userId, { twoFactorEnabled: true });
    return { success: true };
  }

  async turnOffTwoFactorAuthentication(userId: string) {
    await this.userRepo.update(userId, {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    });
    return { success: true };
  }
}
