import { z } from 'zod';

export const WorkspaceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  taskCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const UpdateWorkspaceInputSchema = CreateWorkspaceInputSchema.partial();
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInputSchema>;

export const DeleteWorkspaceResponseSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteWorkspaceResponse = z.infer<
  typeof DeleteWorkspaceResponseSchema
>;
