import { ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type TaskSortBy = 'createdAt' | 'priority' | 'dueDate';
export type SortOrder = 'asc' | 'desc';
export type TaskScope = 'personal' | 'all';

export class TaskFilterDto {
  @ApiPropertyOptional({
    description:
      'personal (default): only the caller\'s tasks. all: every task ' +
      '(ADMIN only; COMMON receives 403).',
    enum: ['personal', 'all'],
    default: 'personal',
    example: 'personal',
  })
  @IsOptional()
  @IsIn(['personal', 'all'])
  scope?: TaskScope = 'personal';

  @ApiPropertyOptional({
    description: 'Filter by task status.',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter by task priority.',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Free-text search over title and description.',
    example: 'documentation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by task owner profile id. Only applied for ADMIN with scope=all.',
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  })
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive lower bound for dueDate (ISO date or datetime). Ignored when unscheduled=true.',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive upper bound for dueDate (ISO date or datetime). Ignored when unscheduled=true.',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @ApiPropertyOptional({
    description:
      'When true, only returns tasks with no dueDate. Takes precedence over dueAfter/dueBefore.',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  unscheduled?: boolean;

  @ApiPropertyOptional({
    description: 'Field used to sort the results.',
    enum: ['createdAt', 'priority', 'dueDate'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'priority', 'dueDate'])
  sortBy?: TaskSortBy = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction.',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: SortOrder = 'desc';

  @ApiPropertyOptional({
    description: 'Page number (1-based).',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page.',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
