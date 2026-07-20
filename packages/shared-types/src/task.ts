import { z } from 'zod';
import { PrioritySchema, TaskStatusSchema } from './enums';

export const AttachmentResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  fileType: z.string(),
  createdAt: z.string(),
});
export type AttachmentResponse = z.infer<typeof AttachmentResponseSchema>;

export const TaskUserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type TaskUserResponse = z.infer<typeof TaskUserResponseSchema>;

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  profileId: z.string().uuid(),
  user: TaskUserResponseSchema,
  attachments: z.array(AttachmentResponseSchema),
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const TaskStatusSummarySchema = z.object({
  PENDING: z.number(),
  IN_PROGRESS: z.number(),
  COMPLETED: z.number(),
});
export type TaskStatusSummary = z.infer<typeof TaskStatusSummarySchema>;

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  dueDate: z.string().min(1).optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  attachments: z.array(z.string().url()).max(20).optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

export const DeleteTasksBatchInputSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'ids must be unique',
    }),
});
export type DeleteTasksBatchInput = z.infer<typeof DeleteTasksBatchInputSchema>;

export const DeleteTasksBatchResponseSchema = z.object({
  deletedIds: z.array(z.string().uuid()),
});
export type DeleteTasksBatchResponse = z.infer<
  typeof DeleteTasksBatchResponseSchema
>;

export const UpdateTasksBatchInputSchema = z
  .object({
    ids: z
      .array(z.string().uuid())
      .min(1)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: 'ids must be unique',
      }),
    status: TaskStatusSchema.optional(),
    priority: PrioritySchema.optional(),
    dueDate: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.dueDate !== undefined,
    { message: 'At least one of status, priority, or dueDate must be provided' },
  );
export type UpdateTasksBatchInput = z.infer<typeof UpdateTasksBatchInputSchema>;

export const UpdateTasksBatchResponseSchema = z.object({
  updatedIds: z.array(z.string().uuid()),
});
export type UpdateTasksBatchResponse = z.infer<
  typeof UpdateTasksBatchResponseSchema
>;

export const TaskFilterInputSchema = z.object({
  scope: z.enum(['personal', 'all']).optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  search: z.string().max(120).optional(),
  dueAfter: z.string().min(1).optional(),
  dueBefore: z.string().min(1).optional(),
  unscheduled: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'priority', 'dueDate']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type TaskFilterInput = z.infer<typeof TaskFilterInputSchema>;
