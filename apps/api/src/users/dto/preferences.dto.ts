import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { AccessibilityPreferencesDto } from './accessibility-preferences.dto';
import { LocalizationPreferencesDto } from './localization-preferences.dto';
import { Theme } from './theme.enum';

export class PreferencesDto {
  @ApiPropertyOptional({
    description: 'UI theme. Only these literal values are accepted.',
    enum: Theme,
    example: Theme.DARK,
  })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({
    description: 'Accessibility-related preferences.',
    type: AccessibilityPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilityPreferencesDto)
  accessibility?: AccessibilityPreferencesDto;

  @ApiPropertyOptional({
    description: 'Localization-related preferences.',
    type: LocalizationPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizationPreferencesDto)
  localization?: LocalizationPreferencesDto;
}
