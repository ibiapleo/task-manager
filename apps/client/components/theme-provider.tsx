'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { applyThemePreview } from '@/lib/preview-preferences'
import type { ThemeName } from '@/lib/types'
import { useProfile } from '@/hooks/use-profile'

interface ThemeContextValue {
  theme: ThemeName
  /**
   * Persists a theme to the DOM + localStorage. Meant to be invoked once by
   * the Settings form's onSubmit, right after the `preferences` PATCH has
   * already succeeded (see app/settings/page.tsx). Picking a theme in the
   * UI before that point only live-previews it (see lib/preview-preferences.ts)
   * - it isn't written to localStorage/backend until "Salvar alterações".
   */
  applyTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'prism-theme'

// Pre-auth screens always render in the default theme, regardless of what
// was saved locally/on the server from a previous session - so logging out
// of a "dark"/"seal"/"retro" account never leaves the login page themed.
const FORCED_LIGHT_ROUTES = ['/login', '/register']

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('light')
  const { data: profile } = useProfile()
  const pathname = usePathname()
  const forceLight = FORCED_LIGHT_ROUTES.includes(pathname)

  const applyTheme = useCallback((next: ThemeName) => {
    setThemeState(next)
    applyThemePreview(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (forceLight) {
      setThemeState('light')
      applyThemePreview('light')
      return
    }
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeName) || 'light'
    setThemeState(stored)
    applyThemePreview(stored)
    // Re-run when crossing the forced-light boundary too (e.g. navigating
    // away from /login after signing in) so the real saved theme applies.
  }, [forceLight])

  useEffect(() => {
    if (forceLight || !profile) return
    const remoteTheme = profile.preferences.theme
    setThemeState((current) => {
      if (current === remoteTheme) return current
      applyThemePreview(remoteTheme)
      try {
        localStorage.setItem(STORAGE_KEY, remoteTheme)
      } catch {
        /* ignore */
      }
      return remoteTheme
    })
    // Only react to the server value changing (e.g. logging in on a new
    // device), not to anything else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferences.theme, forceLight])

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
