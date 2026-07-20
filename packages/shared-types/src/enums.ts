import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'COMMON']);
export type Role = z.infer<typeof RoleSchema>;

export const TaskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type Priority = z.infer<typeof PrioritySchema>;

export const ThemeSchema = z.enum(['light', 'dark', 'seal', 'retro']);
export type Theme = z.infer<typeof ThemeSchema>;
