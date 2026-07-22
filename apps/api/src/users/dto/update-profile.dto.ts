import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PreferencesDto } from './preferences.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Display name.',
    example: 'Ada Lovelace',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description:
      'Public URL of the avatar image. The client uploads the file ' +
      'directly to Supabase Storage and only sends the resulting URL here.',
    example:
      'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/profile-avatars/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description:
      'Partial preferences update. Only the provided fields are changed; ' +
      'the rest of the stored preferences are preserved.',
    type: PreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}
