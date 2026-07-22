'use client'

import { usePermissions } from '@/hooks/use-permissions'
import type { Role } from '@/domain/types'

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
