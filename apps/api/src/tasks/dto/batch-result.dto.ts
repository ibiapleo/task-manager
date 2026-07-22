import { ApiProperty } from '@nestjs/swagger';

export class BatchUpdateResultDto {
  @ApiProperty({
    type: [String],
    example: ['b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11'],
  })
  updatedIds: string[];
}

export class BatchDeleteResultDto {
  @ApiProperty({
    type: [String],
    example: ['b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11'],
  })
  deletedIds: string[];
}

export class DeleteTaskResultDto {
  @ApiProperty({ example: 'b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11' })
  id: string;
}
