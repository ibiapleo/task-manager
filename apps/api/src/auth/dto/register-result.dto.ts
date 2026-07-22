import { ApiProperty } from '@nestjs/swagger';

export class RegisterSessionTokensDto {
  @ApiProperty({
    description: 'Supabase access token (JWT).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Supabase refresh token.',
    example: 'v1.MzE0OjE3MjA...',
  })
  refreshToken: string;
}

export class RegisterResultDto {
  @ApiProperty({
    description:
      'True when Supabase requires e-mail confirmation before a session is issued.',
    example: false,
  })
  requiresEmailConfirmation: boolean;

  @ApiProperty({
    description:
      'Session tokens when confirmation is disabled; null when confirmation is required.',
    type: RegisterSessionTokensDto,
    nullable: true,
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'v1.MzE0OjE3MjA...',
    },
  })
  session: RegisterSessionTokensDto | null;
}
