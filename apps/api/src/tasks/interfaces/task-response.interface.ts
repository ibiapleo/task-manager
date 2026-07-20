import { Priority, TaskStatus } from '@prisma/client';

// Explicit, hand-picked shape returned to clients - never spread a raw
// Prisma model, so nothing beyond these fields can leak accidentally.
export interface AttachmentResponse {
  id: string;
  url: string;
  fileType: string;
  createdAt: Date;
}

export interface TaskUserResponse {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  profileId: string;
  user: TaskUserResponse;
  attachments: AttachmentResponse[];
}
