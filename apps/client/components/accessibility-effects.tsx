'use client'

import { useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { applyAccessibilityPreview } from '@/lib/preview-preferences'

/**
 * Applies the authenticated profile's accessibility preferences to the
 * document so every page benefits without threading props around: a
 * `data-high-contrast` attribute plus a literal `.high-contrast` class
 * (both read by app/globals.css - the class exists so anything that
 * specifically targets `.high-contrast` keeps working) and a
 * `--font-size-multiplier` CSS variable that scales the whole app's
 * rem-based type scale.
 */
export function AccessibilityEffects() {
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile) return

    applyAccessibilityPreview(profile.preferences.accessibility)

    return () => {
      document.documentElement.removeAttribute('data-high-contrast')
      document.documentElement.classList.remove('high-contrast')
      document.documentElement.style.removeProperty('--font-size-multiplier')
    }
  }, [profile])

  return null
}
