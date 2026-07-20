import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Role } from '@prisma/client';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseJwtPayload } from '../interfaces/supabase-jwt-payload.interface';

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['ES256', 'RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  // Silent upsert: on a user's very first authenticated request, transparently
  // provision their Profile row (role COMMON) inside the same transaction that
  // looks it up, so no separate "register profile" endpoint is ever needed.
  // Returning the full Profile entity guarantees @CurrentUser() always
  // injects up-to-date data (name, avatarUrl, preferences, role, ...).
  async validate(payload: SupabaseJwtPayload): Promise<Profile> {
    const userId = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException('Access token is missing a subject.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existingProfile = await tx.profile.findUnique({
        where: { id: userId },
      });

      if (existingProfile) {
        return existingProfile;
      }

      return tx.profile.create({
        data: {
          id: userId,
          email: payload.email ?? `${userId}@unknown.local`,
          role: Role.COMMON,
        },
      });
    });
  }
}
