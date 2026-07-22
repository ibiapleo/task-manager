import { ApiProperty } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';

export class AttachmentResponseDto {
  @ApiProperty({ example: 'cccccccc-cccc-cccc-cccc-cccccccccccc' })
  id: string;

  @ApiProperty({
    example:
      'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/tasks/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/dddddddd-dddd-dddd-dddd-dddddddddddd.pdf',
  })
  url: string;

  @ApiProperty({ example: 'especificacao.pdf' })
  originalName: string;

  @ApiProperty({
    description: 'MIME type resolved server-side from the file extension.',
    example: 'application/pdf',
  })
  fileType: string;

  @ApiProperty({ example: '2026-07-10T14:00:00.000Z' })
  createdAt: Date;
}

export class TaskUserResponseDto {
  @ApiProperty({ example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
  id: string;

  @ApiProperty({ example: 'Ada Lovelace', nullable: true })
  name: string | null;

  @ApiProperty({
    example:
      'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/profile-avatars/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png',
    nullable: true,
  })
  avatarUrl: string | null;
}

export class TaskResponseDto {
  @ApiProperty({ example: 'b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11' })
  id: string;

  @ApiProperty({ example: 'Escrever a documentação do projeto' })
  title: string;

  @ApiProperty({
    example: 'Cobrir instalação, configuração e uso.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '2026-08-01T18:00:00.000Z', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status: TaskStatus;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  priority: Priority;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-15T18:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
  profileId: string;

  @ApiProperty({ type: TaskUserResponseDto })
  user: TaskUserResponseDto;

  @ApiProperty({ type: [AttachmentResponseDto] })
  attachments: AttachmentResponseDto[];
}
