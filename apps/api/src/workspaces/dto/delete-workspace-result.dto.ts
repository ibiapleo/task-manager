import { ApiProperty } from '@nestjs/swagger';

export class DeleteWorkspaceResultDto {
  @ApiProperty({ example: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' })
  id: string;
}
