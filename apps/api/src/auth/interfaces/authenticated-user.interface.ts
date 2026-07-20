import { Profile } from '@prisma/client';

// The Profile entity IS the authenticated user - SupabaseJwtStrategy always
// resolves and returns the full row (see supabase-jwt.strategy.ts), so
// @CurrentUser() never exposes a stale or partial view of it.
export type AuthenticatedUser = Profile;
