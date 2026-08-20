'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import {
  CreateWorkspaceInputSchema,
  type CreateWorkspaceInput,
} from '@task-manager/shared-types'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { ApiError } from '@/services/http/api-client'
import { cn } from '@/lib/utils'

interface WorkspaceFormDialogProps {
  open: boolean
  mode: 'create' | 'rename'
  initialName?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<void>
}

export function WorkspaceFormDialog({
  open,
  mode,
  initialName = '',
  onOpenChange,
  onSubmit,
}: WorkspaceFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(CreateWorkspaceInputSchema),
    defaultValues: { name: initialName },
  })

  useEffect(() => {
    if (open) {
      reset({ name: initialName })
    }
  }, [open, initialName, reset])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isSubmitting, onOpenChange])

  if (!open) return null

  const title = mode === 'create' ? 'Novo espaço' : 'Renomear espaço'
  const confirmLabel = mode === 'create' ? 'Criar espaço' : 'Salvar'

  async function submit(values: CreateWorkspaceInput) {
    try {
      await onSubmit(values.name.trim())
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('name', { type: 'server', message: error.message })
        return
      }
      setError('name', {
        type: 'server',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o espaço.',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => !isSubmitting && onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-background/40 backdrop-blur-sm"
      />
      <GlassCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-form-title"
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between">
          <h2
            id="workspace-form-title"
            className="text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
          <IconTooltip label="Fechar">
            <button
              type="button"
              aria-label="Fechar"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </IconTooltip>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Nome
            </label>
            <input
              id="workspace-name"
              autoFocus
              maxLength={40}
              placeholder="Ex.: Trabalho"
              {...register('name')}
              className="h-11 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="mt-1 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95',
                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
              )}
            >
              {isSubmitting ? 'Salvando...' : confirmLabel}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
