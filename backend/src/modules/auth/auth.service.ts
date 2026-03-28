import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import { PrismaService } from "../../common/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const exists = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }] },
        });
        if (exists) {
            throw new ConflictException("Username or email already taken");
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash,
            },
        });

        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return {
            accessToken: token,
            user: { id: user.id, username: user.username, email: user.email },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (user.twoFactorEnabled) {
            return { requires2fa: true, userId: user.id };
        }

        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return {
            accessToken: token,
            user: { id: user.id, username: user.username, email: user.email },
        };
    }

    async googleOAuth(code: string) {
        // Exchange authorization code for tokens
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

        // Fetch user info from Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            throw new UnauthorizedException("Failed to fetch Google user info");
        }

        // Find or create user
        let user = await this.prisma.user.findFirst({
            where: { OR: [{ email: googleUser.email }, { oauthId: googleUser.id }] },
        });

        if (!user) {
            const username = googleUser.email.split("@")[0] + "_" + Date.now().toString(36);
            user = await this.prisma.user.create({
                data: {
                    username,
                    email: googleUser.email,
                    displayName: googleUser.name || null,
                    avatarUrl: googleUser.picture || null,
                    oauthProvider: "google",
                    oauthId: googleUser.id,
                },
            });
        }

        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return {
            accessToken: token,
            user: { id: user.id, username: user.username, email: user.email },
        };
    }

    async verify2fa(userId: string, code: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            throw new UnauthorizedException("2FA not configured");
        }

        const valid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!valid) {
            throw new UnauthorizedException("Invalid 2FA code");
        }

        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return {
            accessToken: token,
            user: { id: user.id, username: user.username, email: user.email },
        };
    }
}
