'use client'

import { Check, Moon, Sun, Terminal, Waves } from 'lucide-react'
import type { ThemeName } from '@/domain/types'
import { cn } from '@/lib/utils'

const THEMES: {
  value: ThemeName
  label: string
  description: string
  icon: typeof Sun
  swatch: string[]
}[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Vidro claro sobre auréolas azuis.',
    icon: Sun,
    swatch: ['#f7f9ff', '#3b6bff', '#111827'],
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Fundo profundo com brilhos noturnos.',
    icon: Moon,
    swatch: ['#0f1320', '#3f6bff', '#e5e7eb'],
  },
  {
    value: 'seal',
    label: 'Seal',
    description: 'Tons de azul-chumbo foscos.',
    icon: Waves,
    swatch: ['#3a4a63', '#6fa8dc', '#e8eef7'],
  },
  {
    value: 'retro',
    label: 'Retro',
    description: 'Monospace ASCII, sem vidro.',
    icon: Terminal,
    swatch: ['#ffffff', '#000000', '#000000'],
  },
]

export function ThemeSelector({
  value,
  onChange,
}: {
  value: ThemeName
  onChange: (theme: ThemeName) => void
}) {
  const theme = value
  const setTheme = onChange

  return (
    <div
      role="radiogroup"
      aria-label="Selecionar tema"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {THEMES.map((t) => {
        const selected = theme === t.value
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(t.value)}
            className={cn(
              'group relative flex items-center gap-4 rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-ring bg-card/70 shadow-lg'
                : 'border-border/60 bg-card/30 hover:bg-card/50',
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card/60">
              <t.icon className="size-5" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-semibold tracking-tight">
                {t.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {t.description}
              </span>
              <span className="mt-2 flex gap-1.5" aria-hidden>
                {t.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="size-4 rounded-full border border-border/40"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
            </span>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border transition',
                selected
                  ? 'border-ring bg-primary text-primary-foreground'
                  : 'border-border/60 text-transparent',
              )}
            >
              <Check className="size-3.5" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
