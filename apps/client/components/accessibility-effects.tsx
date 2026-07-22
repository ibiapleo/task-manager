'use client'

import { useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { applyAccessibilityPreview } from '@/services/preferences/preview'

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
