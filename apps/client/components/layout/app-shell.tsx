'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/layout/navbar'
import { useProfile } from '@/hooks/use-profile'

/** Unauthenticated-only: authenticated users are sent to /tasks. */
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

/**
 * Auth recovery flow: accessible with or without a session.
 * Must NOT redirect authenticated recovery sessions to /tasks.
 */
const AUTH_FLOW_ROUTES = ['/reset-password']

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, ready, session } = useAuth()
  const { data: profile, isPending: isProfilePending } = useProfile()

  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const isAuthFlow = AUTH_FLOW_ROUTES.includes(pathname)
  const allowsUnauthenticated = isPublic || isAuthFlow
  const sessionUserId = session?.user?.id
  const profileReady =
    !!profile &&
    !!sessionUserId &&
    profile.id === sessionUserId &&
    !isProfilePending

  useEffect(() => {
    if (!ready) return
    if (!isAuthenticated && !allowsUnauthenticated) {
      router.replace('/login')
    } else if (isAuthenticated && isPublic) {
      router.replace('/tasks')
    }
  }, [ready, isAuthenticated, isPublic, allowsUnauthenticated, router])

  if (!ready) {
    return <FullScreenLoader />
  }

  if (
    (!isAuthenticated && !allowsUnauthenticated) ||
    (isAuthenticated && isPublic)
  ) {
    return <FullScreenLoader />
  }

  if (isPublic || isAuthFlow) {
    return <main className="min-h-dvh">{children}</main>
  }

  if (!profileReady) {
    return <FullScreenLoader />
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6">
        {children}
      </main>
    </>
  )
}
