import { TaskStatus } from '@prisma/client';

// Number of tasks per status, across every user - only meaningful for ADMIN.
export type TaskStatusSummary = Record<TaskStatus, number>;
