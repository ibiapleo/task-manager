import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LocalizationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Preferred date format.',
    example: 'DD/MM/YYYY',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;
}
