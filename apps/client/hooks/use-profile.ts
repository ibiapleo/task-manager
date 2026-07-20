'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ProfileResponse,
  UpdateProfileInput,
} from '@task-manager/shared-types'
import { useAuth } from '@/components/auth-provider'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

/** The authenticated user's Profile, sourced from GET /auth/me. */
export function useProfile() {
  const { isAuthenticated, session } = useAuth()
  const userId = session?.user?.id

  return useQuery({
    queryKey: queryKeys.profile.me(userId ?? 'anonymous'),
    queryFn: () => apiClient.get<ProfileResponse>('/auth/me'),
    enabled: isAuthenticated && !!userId,
  })
}

/** Mirrors the backend's partial-merge semantics (UsersService.mergePreferences) for the optimistic patch below. */
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

/** Partial profile update (name, avatarUrl, preferences) via PATCH /users/me. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: (patch: UpdateProfileInput) =>
      apiClient.patch<ProfileResponse>('/users/me', patch),
    onMutate: async (patch) => {
      if (!userId) return { previous: undefined }

      // Cancel any in-flight GET /auth/me for this key - otherwise a
      // background refetch that started before this mutation (e.g. from a
      // page navigation remounting a useProfile() consumer while the cache
      // was stale) can resolve *after* our optimistic/confirmed write and
      // silently overwrite it with the pre-mutation value.
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
