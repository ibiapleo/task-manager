'use client'

import { Check, Circle } from 'lucide-react'
import {
  evaluatePassword,
  type PasswordStrength,
} from '@task-manager/shared-types'
import { cn } from '@/lib/utils'

const STRENGTH_BAR: Record<
  Exclude<PasswordStrength, 'empty'>,
  { width: string; className: string }
> = {
  weak: { width: '33%', className: 'bg-destructive' },
  medium: { width: '66%', className: 'bg-amber-500' },
  strong: { width: '100%', className: 'bg-emerald-500' },
}

export function PasswordRequirements({ password }: { password: string }) {
  const evaluation = evaluatePassword(password)
  const bar =
    evaluation.strength === 'empty' ? null : STRENGTH_BAR[evaluation.strength]

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/30 px-4 py-3">
      <ul className="flex flex-col gap-1.5" aria-label="Requisitos da senha">
        {evaluation.rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors',
              rule.met
                ? 'text-emerald-600 dark:text-emerald-400'
                : password.length === 0
                  ? 'text-muted-foreground'
                  : 'text-destructive',
            )}
          >
            {rule.met ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="size-3.5 shrink-0 opacity-60" aria-hidden />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
      {bar && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Força da senha</span>
            <span
              className={cn(
                'font-medium',
                evaluation.strength === 'weak' && 'text-destructive',
                evaluation.strength === 'medium' && 'text-amber-600 dark:text-amber-400',
                evaluation.strength === 'strong' &&
                  'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {evaluation.strengthLabel}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted/80"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={
              evaluation.strength === 'weak'
                ? 1
                : evaluation.strength === 'medium'
                  ? 2
                  : 3
            }
            aria-label={`Força da senha: ${evaluation.strengthLabel}`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                bar.className,
              )}
              style={{ width: bar.width }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
