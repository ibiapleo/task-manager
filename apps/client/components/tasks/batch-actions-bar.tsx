'use client'

import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'
import { PillSelect } from '@/components/ui/pill-select'
import type { Priority, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'Alterar status…' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'COMPLETED', label: 'Concluído' },
]

const PRIORITY_OPTIONS: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'Alterar prioridade…' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
]

interface BatchActionsBarProps {
  selectedCount: number
  onStatusChange: (status: TaskStatus) => void
  onPriorityChange: (priority: Priority) => void
  onDueDateChange: (dueDate: string) => void
  onMarkCompleted: () => void
  onDelete: () => void
  className?: string
}

export function BatchActionsBar({
  selectedCount,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onMarkCompleted,
  onDelete,
  className,
}: BatchActionsBarProps) {
  const [statusValue, setStatusValue] = useState<TaskStatus | ''>('')
  const [priorityValue, setPriorityValue] = useState<Priority | ''>('')
  const [dueDateValue, setDueDateValue] = useState('')

  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4',
        className,
      )}
    >
      <GlassCard className="pointer-events-auto flex max-w-full flex-wrap items-center gap-3 px-5 py-3 shadow-xl">
        <p className="text-sm font-medium text-foreground">
          {selectedCount === 1
            ? '1 tarefa selecionada'
            : `${selectedCount} tarefas selecionadas`}
        </p>

        <PillSelect<TaskStatus | ''>
          value={statusValue}
          options={STATUS_OPTIONS}
          placement="top"
          onChange={(value) => {
            setStatusValue(value)
            if (!value) return
            onStatusChange(value)
            setStatusValue('')
          }}
          className="min-w-[9.5rem]"
        />

        <PillSelect<Priority | ''>
          value={priorityValue}
          options={PRIORITY_OPTIONS}
          placement="top"
          onChange={(value) => {
            setPriorityValue(value)
            if (!value) return
            onPriorityChange(value)
            setPriorityValue('')
          }}
          className="min-w-[10rem]"
        />

        <input
          type="date"
          value={dueDateValue}
          aria-label="Alterar data de vencimento"
          onChange={(e) => {
            const next = e.target.value
            setDueDateValue(next)
            if (!next) return
            onDueDateChange(next)
            setDueDateValue('')
          }}
          className="h-10 rounded-full border border-border/60 bg-card/50 px-3 text-sm text-foreground outline-none backdrop-blur-md transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />

        <button
          type="button"
          onClick={onMarkCompleted}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 text-sm font-medium transition active:scale-95 hover:bg-success/15 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="size-4" />
          Marcar como concluídas
        </button>

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
