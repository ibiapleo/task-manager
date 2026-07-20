'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateTaskInput,
  DeleteTasksBatchResponse,
  PaginatedResult,
  TaskFilterInput,
  TaskResponse,
  TaskStatusSummary,
  UpdateTaskInput,
} from '@task-manager/shared-types'
import { apiClient } from '@/lib/api-client'
import { useProfile } from '@/hooks/use-profile'
import { queryKeys } from '@/lib/query-keys'

/** Listing scope is enforced server-side (scope=all requires ADMIN). */
export function useTasksQuery(filters: TaskFilterInput = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () =>
      apiClient.get<PaginatedResult<TaskResponse>>('/tasks', {
        query: filters,
      }),
  })
}

export function useTaskStatusSummary(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tasks.summary(),
    queryFn: () => apiClient.get<TaskStatusSummary>('/tasks/admin/summary'),
    enabled,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiClient.post<TaskResponse>('/tasks', input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all() })

      const previousLists = queryClient.getQueriesData<
        PaginatedResult<TaskResponse>
      >({ queryKey: queryKeys.tasks.all() })

      // Placeholder row shown instantly while the real POST is in flight -
      // replaced by the server's version once onSuccess invalidates the
      // list (or rolled back entirely on error).
      const now = new Date().toISOString()
      const optimisticTask: TaskResponse = {
        id: `optimistic-${crypto.randomUUID()}`,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ?? null,
        status: input.status ?? 'PENDING',
        priority: input.priority ?? 'MEDIUM',
        createdAt: now,
        updatedAt: now,
        profileId: profile?.id ?? '',
        user: {
          id: profile?.id ?? '',
          name: profile?.name ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        },
        attachments: (input.attachments ?? []).map((url) => ({
          id: `optimistic-${crypto.randomUUID()}`,
          url,
          fileType: 'unknown',
          createdAt: now,
        })),
      }

      previousLists.forEach(([key, data]) => {
        if (!data || !Array.isArray(data.data)) return
        queryClient.setQueryData(key, {
          ...data,
          data: [optimisticTask, ...data.data],
        })
      })

      return { previousLists }
    },
    onError: (_error, _input, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      apiClient.patch<TaskResponse>(`/tasks/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      // Cancel in-flight task list fetches so a stale response can't land
      // after this optimistic write and undo it (same class of race fixed
      // in useUpdateProfile).
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all() })

      const previousLists = queryClient.getQueriesData<
        PaginatedResult<TaskResponse>
      >({ queryKey: queryKeys.tasks.all() })

      previousLists.forEach(([key, data]) => {
        if (!data || !Array.isArray(data.data)) return
        queryClient.setQueryData(key, {
          ...data,
          data: data.data.map((task) => {
            if (task.id !== id) return task
            const { attachments: nextUrls, ...scalarPatch } = patch
            const next: TaskResponse = {
              ...task,
              ...scalarPatch,
              // Prefer explicit nullish clears from the patch over stale values.
              description:
                scalarPatch.description !== undefined
                  ? scalarPatch.description || null
                  : task.description,
              dueDate:
                scalarPatch.dueDate !== undefined
                  ? scalarPatch.dueDate || null
                  : task.dueDate,
            }
            if (nextUrls) {
              next.attachments = nextUrls.map((url) => ({
                id: `optimistic-${crypto.randomUUID()}`,
                url,
                fileType: 'unknown',
                createdAt: new Date().toISOString(),
              }))
            }
            return next
          }),
        })
      })

      return { previousLists }
    },
    onError: (_error, _vars, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ id: string }>(`/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all() })

      const previousLists = queryClient.getQueriesData<
        PaginatedResult<TaskResponse>
      >({ queryKey: queryKeys.tasks.all() })

      previousLists.forEach(([key, data]) => {
        if (!data || !Array.isArray(data.data)) return
        const nextData = data.data.filter((task) => task.id !== id)
        const removed = data.data.length - nextData.length
        const total = Math.max(0, data.meta.total - removed)
        queryClient.setQueryData(key, {
          ...data,
          data: nextData,
          meta: {
            ...data.meta,
            total,
            totalPages:
              data.meta.limit <= 0
                ? 0
                : total === 0
                  ? 0
                  : Math.ceil(total / data.meta.limit),
          },
        })
      })

      return { previousLists }
    },
    onError: (_error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
    },
  })
}

export function useDeleteTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.delete<DeleteTasksBatchResponse>('/tasks/batch', { ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all() })

      const idSet = new Set(ids)
      const previousLists = queryClient.getQueriesData<
        PaginatedResult<TaskResponse>
      >({ queryKey: queryKeys.tasks.all() })

      previousLists.forEach(([key, data]) => {
        if (!data || !Array.isArray(data.data)) return
        const nextData = data.data.filter((task) => !idSet.has(task.id))
        const removed = data.data.length - nextData.length
        const total = Math.max(0, data.meta.total - removed)
        queryClient.setQueryData(key, {
          ...data,
          data: nextData,
          meta: {
            ...data.meta,
            total,
            totalPages:
              data.meta.limit <= 0
                ? 0
                : total === 0
                  ? 0
                  : Math.ceil(total / data.meta.limit),
          },
        })
      })

      return { previousLists }
    },
    onError: (_error, _ids, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
    },
  })
}
