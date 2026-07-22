'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AccessibilityEffects } from '@/components/accessibility-effects'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createQueryClient } from '@/services/query/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider delay={350}>
            <AccessibilityEffects />
            {children}
            <Toaster richColors position="bottom-right" closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
