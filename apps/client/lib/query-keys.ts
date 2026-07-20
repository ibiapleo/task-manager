import type { TaskFilterInput, UserFilterInput } from '@task-manager/shared-types'

/**
 * Centralized queryKey factory. Every hook that reads or invalidates cache
 * entries goes through these helpers so keys never drift between a query
 * and the mutation that should invalidate it.
 */
export const queryKeys = {
  profile: {
    /** Scoped by auth user id so a previous session's /me never flashes. */
    me: (userId: string) => ['profile', 'me', userId] as const,
  },
  tasks: {
    all: () => ['tasks'] as const,
    list: (filters: TaskFilterInput = {}) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    summary: () => ['tasks', 'summary'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (filters: UserFilterInput = {}) => ['users', 'list', filters] as const,
  },
}
