import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { ProfileResponseDto } from './profile-response.dto';

export class PaginatedProfilesDto {
  @ApiProperty({ type: [ProfileResponseDto] })
  data: ProfileResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
