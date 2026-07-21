export interface RegisterSessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  requiresEmailConfirmation: boolean;
  session: RegisterSessionTokens | null;
}
