'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { applyThemePreview } from '@/services/preferences/preview'
import type { ThemeName } from '@/domain/types'
import { useProfile } from '@/hooks/use-profile'

interface ThemeContextValue {
  theme: ThemeName
  applyTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'prism-theme'

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
