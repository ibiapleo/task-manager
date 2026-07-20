import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class AccessibilityPreferencesDto {
  @ApiPropertyOptional({
    description: 'Whether high-contrast mode is enabled.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @ApiPropertyOptional({
    description: 'Font size multiplier applied on top of the base size.',
    minimum: 0.5,
    maximum: 3,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  fontSizeMultiplier?: number;
}
