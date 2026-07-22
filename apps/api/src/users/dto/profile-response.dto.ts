import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Theme } from './theme.enum';

export class AccessibilityPreferencesResponseDto {
  @ApiProperty({ example: false })
  highContrast: boolean;

  @ApiProperty({ example: 1 })
  fontSizeMultiplier: number;
}

export class LocalizationPreferencesResponseDto {
  @ApiProperty({ example: 'DD/MM/YYYY' })
  dateFormat: string;
}

export class PreferencesResponseDto {
  @ApiProperty({ enum: Theme, example: Theme.LIGHT })
  theme: Theme;

  @ApiProperty({ type: AccessibilityPreferencesResponseDto })
  accessibility: AccessibilityPreferencesResponseDto;

  @ApiProperty({ type: LocalizationPreferencesResponseDto })
  localization: LocalizationPreferencesResponseDto;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
  id: string;

  @ApiProperty({ example: 'voce@seuemail.com' })
  email: string;

  @ApiProperty({ example: 'Ada Lovelace', nullable: true })
  name: string | null;

  @ApiProperty({
    example:
      'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/profile-avatars/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ enum: Role, example: Role.COMMON })
  role: Role;

  @ApiProperty({ type: PreferencesResponseDto })
  preferences: PreferencesResponseDto;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-15T18:30:00.000Z' })
  updatedAt: Date;
}
