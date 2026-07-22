import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const ATTACHMENT_URL_EXAMPLE =
  'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/tasks/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/dddddddd-dddd-dddd-dddd-dddddddddddd.pdf';

export class AttachmentInputDto {
  @ApiProperty({
    description: 'Public URL of the file in Supabase Storage (bucket: tasks).',
    example: ATTACHMENT_URL_EXAMPLE,
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description:
      'Original filename as sent by the user (for display/download).',
    example: 'especificacao.pdf',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName: string;
}

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title.',
    example: 'Escrever a documentação do projeto',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed task description.',
    example: 'Cobrir instalação, configuração e uso.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Deadline in ISO 8601 format.',
    example: '2026-08-01T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Current task status.',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
    example: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority.',
    enum: Priority,
    default: Priority.MEDIUM,
    example: Priority.HIGH,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description:
      'Attachments already uploaded to Supabase Storage (URL + original filename). ' +
      'Object keys use {profileId}/{uuid}.ext.',
    type: [AttachmentInputDto],
    example: [
      {
        url: ATTACHMENT_URL_EXAMPLE,
        originalName: 'especificacao.pdf',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];
}
