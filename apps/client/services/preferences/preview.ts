import type { AccessibilityPreferences } from '@task-manager/shared-types'
import type { ThemeName } from '@/domain/types'

/**
 * Single source of truth for "how a theme gets written to the DOM" - used
 * both for the real, persisted value (ThemeProvider.applyTheme, after a
 * save succeeds) and for the Settings page's live preview (before saving).
 */
export function applyThemePreview(theme: ThemeName): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Mirrors AccessibilityEffects' DOM writes (`data-high-contrast` attribute,
 * literal `.high-contrast` class, `--font-size-multiplier` CSS var) so the
 * Settings page can preview accessibility changes instantly, before the
 * PATCH that actually persists them resolves.
 */
export function applyAccessibilityPreview({
  highContrast,
  fontSizeMultiplier,
}: AccessibilityPreferences): void {
  const root = document.documentElement
  root.setAttribute('data-high-contrast', String(highContrast))
  root.classList.toggle('high-contrast', highContrast)
  root.style.setProperty('--font-size-multiplier', String(fontSizeMultiplier))
}
