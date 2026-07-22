import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneBatchField', async: false })
export class AtLeastOneBatchFieldConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateTasksBatchDto;
    return (
      dto.status !== undefined ||
      dto.priority !== undefined ||
      dto.dueDate !== undefined
    );
  }

  defaultMessage(): string {
    return 'At least one of status, priority, or dueDate must be provided';
  }
}

export class UpdateTasksBatchDto {
  @ApiProperty({
    description:
      'Task UUIDs to update (1–100). At least one of status, priority, or ' +
      'dueDate must also be provided on the body.',
    type: [String],
    minItems: 1,
    maxItems: 100,
    example: ['b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @Validate(AtLeastOneBatchFieldConstraint)
  ids: string[];

  @ApiPropertyOptional({
    description: 'Status applied to every selected task.',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Priority applied to every selected task.',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Due date applied to every selected task (ISO 8601).',
    example: '2026-08-01T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
