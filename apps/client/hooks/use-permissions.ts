'use client'

import type { Role, TaskResponse } from '@task-manager/shared-types'
import { useProfile } from './use-profile'

/**
 * Client-side mirror of the RBAC rules enforced by RolesGuard/TasksService
 * on the backend (see apps/api/src/auth/guards/roles.guard.ts and
 * tasks.service.ts). This never replaces server-side checks - it only
 * drives what the UI shows, the API is the actual authority.
 */
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
