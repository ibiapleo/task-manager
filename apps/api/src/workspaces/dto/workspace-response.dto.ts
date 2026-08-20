import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({ example: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' })
  id: string;

  @ApiProperty({ example: 'Trabalho', maxLength: 40 })
  name: string;

  @ApiProperty({ example: 12 })
  taskCount: number;

  @ApiProperty({ example: '2026-08-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-15T18:30:00.000Z' })
  updatedAt: Date;
}
