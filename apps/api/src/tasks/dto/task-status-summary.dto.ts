import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusSummaryDto {
  @ApiProperty({ example: 12 })
  PENDING: number;

  @ApiProperty({ example: 5 })
  IN_PROGRESS: number;

  @ApiProperty({ example: 20 })
  COMPLETED: number;
}
