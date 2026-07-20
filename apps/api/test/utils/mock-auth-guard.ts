import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Profile } from '@prisma/client';

// Access tokens are signed by Supabase against a per-project JWKS (see
// SupabaseJwtStrategy), so e2e tests can't forge a real one without hitting
// the network. This simulates SupabaseAuthGuard having already validated a
// real Supabase access token and resolved the matching Profile, keeping
// e2e tests hermetic while still covering routing, validation and the
// business logic wired in the controllers/services.
export function buildMockAuthGuard(profile: Profile): CanActivate {
  return {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = profile;
      return true;
    },
  };
}
