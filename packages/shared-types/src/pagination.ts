import { z } from 'zod';

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function paginatedResultSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: PaginationMetaSchema,
  });
}
