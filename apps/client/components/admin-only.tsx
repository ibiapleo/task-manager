'use client'

import { usePermissions } from '@/hooks/use-permissions'
import type { Role } from '@/lib/types'

/** Renders children only if the current profile has the required role (default: ADMIN). */
export function AdminOnly({
  children,
  role = 'ADMIN',
  fallback = null,
}: {
  children: React.ReactNode
  role?: Role
  fallback?: React.ReactNode
}) {
  const { role: currentRole } = usePermissions()
  if (currentRole !== role) return <>{fallback}</>
  return <>{children}</>
}
