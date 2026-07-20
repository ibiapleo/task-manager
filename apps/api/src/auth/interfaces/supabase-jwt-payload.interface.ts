export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string | string[];
  role?: string;
  iat: number;
  exp: number;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [claim: string]: unknown;
}
