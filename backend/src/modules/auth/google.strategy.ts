import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const firstName = name?.givenName ?? '';
    const lastName = name?.familyName ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;

    const user = {
      email: emails?.[0]?.value,
      firstName,
      lastName,
      displayName,
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
