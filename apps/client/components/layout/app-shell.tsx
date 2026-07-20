'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/layout/navbar'
import { useProfile } from '@/hooks/use-profile'

const PUBLIC_ROUTES = ['/login', '/register']

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
  const sessionUserId = session?.user?.id
  // Wait for /auth/me so navbar / greeting / preferences never flash the
  // previous account while the new session's profile is still in flight.
  const profileReady =
    !!profile &&
    !!sessionUserId &&
    profile.id === sessionUserId &&
    !isProfilePending

  useEffect(() => {
    if (!ready) return
    if (!isAuthenticated && !isPublic) {
      router.replace('/login')
    } else if (isAuthenticated && isPublic) {
      router.replace('/tasks')
    }
  }, [ready, isAuthenticated, isPublic, router])

  if (!ready) {
    return <FullScreenLoader />
  }

  // Enquanto o redirecionamento acontece, evita piscar conteúdo protegido/público.
  if ((!isAuthenticated && !isPublic) || (isAuthenticated && isPublic)) {
    return <FullScreenLoader />
  }

  if (isPublic) {
    return <main className="min-h-dvh">{children}</main>
  }

  // Do not paint navbar/tasks until GET /auth/me matches this session —
  // otherwise a previous account can flash for the duration of the refetch.
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
