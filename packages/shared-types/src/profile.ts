import { z } from 'zod';
import { RoleSchema } from './enums';
import { PreferencesInputSchema, PreferencesSchema } from './preferences';

export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: RoleSchema,
  preferences: PreferencesSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().max(120).optional(),
  avatarUrl: z.string().url().optional(),
  preferences: PreferencesInputSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const UpdateRoleInputSchema = z.object({
  role: RoleSchema,
});
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

export const UserFilterInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type UserFilterInput = z.infer<typeof UserFilterInputSchema>;
