'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AccessibilityEffects } from '@/components/accessibility-effects'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { createQueryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (not a module-level singleton) so each request/hydration on the
  // client gets its own cache, per TanStack Query's Next.js guidance.
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AccessibilityEffects />
          {children}
          <Toaster richColors position="bottom-right" closeButton />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
