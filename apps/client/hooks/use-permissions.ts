'use client'

import type { Role, TaskResponse } from '@task-manager/shared-types'
import { useProfile } from './use-profile'

export function usePermissions() {
  const { data: profile, isLoading } = useProfile()
  const role: Role | undefined = profile?.role
  const isAdmin = role === 'ADMIN'

  return {
    role,
    isAdmin,
    isLoading,
    canManageUsers: isAdmin,
    canViewTaskSummary: isAdmin,
    canAccessAnyTask: isAdmin,
    isOwner: (task: Pick<TaskResponse, 'profileId'>) =>
      !!profile && task.profileId === profile.id,
  }
}
