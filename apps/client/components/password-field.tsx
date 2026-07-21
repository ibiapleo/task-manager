'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { id, label, error, className, disabled, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? 'password'

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              'h-12 w-full rounded-full border border-border/60 bg-card/50 py-0 pr-12 pl-5 text-sm outline-none backdrop-blur-md transition',
              'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
              error && 'border-destructive',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className={cn(
              'absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition',
              'hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  },
)
