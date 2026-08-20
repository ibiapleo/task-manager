import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserResultDto {
  @ApiProperty({ example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
  id: string;
}
