'use client'

import { Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

interface BatchActionsBarProps {
  selectedCount: number
  onDelete: () => void
  className?: string
}

export function BatchActionsBar({
  selectedCount,
  onDelete,
  className,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4',
        className,
      )}
    >
      <GlassCard className="pointer-events-auto flex items-center gap-4 px-5 py-3 shadow-xl">
        <p className="text-sm font-medium text-foreground">
          {selectedCount === 1
            ? '1 tarefa selecionada'
            : `${selectedCount} tarefas selecionadas`}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition active:scale-95 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <Trash2 className="size-4" />
          Excluir
        </button>
      </GlassCard>
    </div>
  )
}
