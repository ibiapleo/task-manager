'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PaginatedResult,
  ProfileResponse,
  Role,
  UserFilterInput,
} from '@task-manager/shared-types'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

/** Admin-only, paginated user list (see UsersController.findAll). */
export function useUsersQuery(
  filters: UserFilterInput = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () =>
      apiClient.get<PaginatedResult<ProfileResponse>>('/users', {
        query: filters,
      }),
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      apiClient.patch<ProfileResponse>(`/users/${id}/role`, { role }),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all() })

      const previousLists = queryClient.getQueriesData<
        PaginatedResult<ProfileResponse>
      >({ queryKey: queryKeys.users.all() })

      previousLists.forEach(([key, data]) => {
        if (!data || !Array.isArray(data.data)) return
        queryClient.setQueryData(key, {
          ...data,
          data: data.data.map((user) =>
            user.id === id ? { ...user, role } : user,
          ),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
    },
  })
}
