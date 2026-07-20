import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtErrorInfo {
  name?: string;
  message?: string;
}

// Wraps the 'jwt' passport strategy so every failure mode (missing header,
// malformed token, invalid signature, expired token) consistently resolves
// to a 401, instead of passport's default behaviour of surfacing raw errors.
@Injectable()
export class SupabaseAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    info: JwtErrorInfo | Error | undefined,
  ): TUser {
    if (err) {
      throw new UnauthorizedException('Unable to validate access token.');
    }

    const errorName = (info as JwtErrorInfo | undefined)?.name;

    if (errorName === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token has expired.');
    }

    if (
      errorName === 'JsonWebTokenError' ||
      errorName === 'NotBeforeError' ||
      // Thrown by jwks-rsa when the token's `kid` isn't in the project's JWKS.
      errorName === 'SigningKeyNotFoundError'
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (!user) {
      throw new UnauthorizedException('Missing or invalid access token.');
    }

    return user;
  }
}
