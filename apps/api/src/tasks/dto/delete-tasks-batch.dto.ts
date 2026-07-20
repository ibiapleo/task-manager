import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class DeleteTasksBatchDto {
  @ApiProperty({
    description: 'Task UUIDs to delete (1–100).',
    type: [String],
    minItems: 1,
    maxItems: 100,
    example: ['b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids: string[];
}
