'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWorkspaceInput,
  DeleteWorkspaceResponse,
  UpdateWorkspaceInput,
  WorkspaceResponse,
} from '@task-manager/shared-types'
import { apiClient } from '@/services/http/api-client'
import { queryKeys } from '@/services/query/keys'

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: () => apiClient.get<WorkspaceResponse[]>('/workspaces'),
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      apiClient.post<WorkspaceResponse>('/workspaces', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.all(),
      })
    },
  })
}

export function useRenameWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateWorkspaceInput }) =>
      apiClient.patch<WorkspaceResponse>(`/workspaces/${id}`, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.all(),
      })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<DeleteWorkspaceResponse>(`/workspaces/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.all(),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() })
    },
  })
}
