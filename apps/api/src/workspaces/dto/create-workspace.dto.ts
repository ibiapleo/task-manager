import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { WORKSPACE_NAME_MAX_LENGTH } from '../workspace.constants';

export class CreateWorkspaceDto {
  @ApiProperty({
    description:
      'Workspace display name. Trimmed server-side; unique per user.',
    example: 'Trabalho',
    maxLength: WORKSPACE_NAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  name: string;
}
