'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  /** Ação assíncrona. O spinner é exibido até resolver. */
  onConfirm: () => void | Promise<void>
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
}: ConfirmActionDialogProps) {
  const [loading, setLoading] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    // foco inicial no botão de confirmação
    const id = requestAnimationFrame(() => confirmRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(id)
    }
  }, [open, loading, onOpenChange])

  if (!open) return null

  async function handleConfirm() {
    if (loading) return // previne duplo clique
    try {
      setLoading(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        aria-hidden
        tabIndex={-1}
        onClick={() => !loading && onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-background/40 backdrop-blur-sm"
      />
      <GlassCard
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        className="relative z-10 w-full max-w-md p-6"
      >
        <h2
          id="confirm-title"
          className="text-lg font-semibold tracking-tight text-balance"
        >
          {title}
        </h2>
        {description && (
          <p
            id="confirm-desc"
            className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty"
          >
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className={cn(
              'inline-flex h-10 items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm font-medium transition active:scale-95',
              'hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100',
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={cn(
              'inline-flex h-10 min-w-[7rem] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive'
                : 'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-ring',
            )}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
