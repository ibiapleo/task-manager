'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ProfileResponse,
  UpdateProfileInput,
} from '@task-manager/shared-types'
import { useAuth } from '@/components/auth-provider'
import { apiClient } from '@/services/http/api-client'
import { queryKeys } from '@/services/query/keys'

export function useProfile() {
  const { isAuthenticated, session } = useAuth()
  const userId = session?.user?.id

  return useQuery({
    queryKey: queryKeys.profile.me(userId ?? 'anonymous'),
    queryFn: () => apiClient.get<ProfileResponse>('/auth/me'),
    enabled: isAuthenticated && !!userId,
  })
}

function mergeProfileOptimistic(
  previous: ProfileResponse,
  patch: UpdateProfileInput,
): ProfileResponse {
  return {
    ...previous,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
    preferences: {
      theme: patch.preferences?.theme ?? previous.preferences.theme,
      accessibility: {
        ...previous.preferences.accessibility,
        ...patch.preferences?.accessibility,
      },
      localization: {
        ...previous.preferences.localization,
        ...patch.preferences?.localization,
      },
    },
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: (patch: UpdateProfileInput) =>
      apiClient.patch<ProfileResponse>('/users/me', patch),
    onMutate: async (patch) => {
      if (!userId) return { previous: undefined }

      await queryClient.cancelQueries({ queryKey: queryKeys.profile.me(userId) })

      const previous = queryClient.getQueryData<ProfileResponse>(
        queryKeys.profile.me(userId),
      )
      if (previous) {
        queryClient.setQueryData(
          queryKeys.profile.me(userId),
          mergeProfileOptimistic(previous, patch),
        )
      }
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me(userId), context.previous)
      }
    },
    onSuccess: (profile) => {
      if (userId) {
        queryClient.setQueryData(queryKeys.profile.me(userId), profile)
      }
    },
  })
}
