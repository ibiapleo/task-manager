'use client'

import { useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/domain/types'
import { STATUS_META } from '@/domain/types'
import { SortableTask } from '@/components/tasks/sortable-task'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  showOwner?: boolean
  selectedIds?: Set<string>
  onSelectedChange?: (taskId: string, selected: boolean) => void
  onSelectColumn?: (selected: boolean) => void
  onDelete: (task: Task) => void
  onDuplicate?: (task: Task) => void
  onOpen: (task: Task) => void
}

export function KanbanColumn({
  status,
  tasks,
  showOwner = false,
  selectedIds,
  onSelectedChange,
  onSelectColumn,
  onDelete,
  onDuplicate,
  onOpen,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const columnSelectRef = useRef<HTMLInputElement>(null)

  const columnSelectedCount = selectedIds
    ? tasks.reduce(
        (count, task) => count + (selectedIds.has(task.id) ? 1 : 0),
        0,
      )
    : 0
  const allColumnSelected =
    tasks.length > 0 && columnSelectedCount === tasks.length
  const someColumnSelected =
    columnSelectedCount > 0 && columnSelectedCount < tasks.length

  useEffect(() => {
    if (!columnSelectRef.current) return
    columnSelectRef.current.indeterminate = someColumnSelected
  }, [someColumnSelected])

  const label = STATUS_META[status].label
  const selectLabel = allColumnSelected
    ? `Desmarcar coluna ${label}`
    : `Selecionar coluna ${label}`

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-64 flex-col gap-3 rounded-3xl border border-border/50 bg-card/20 p-3 backdrop-blur-md transition',
        isOver && 'border-ring bg-card/40 ring-2 ring-ring/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          {onSelectColumn && tasks.length > 0 && (
            <IconTooltip label={selectLabel}>
              <label
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={columnSelectRef}
                  type="checkbox"
                  checked={allColumnSelected}
                  onChange={(e) => onSelectColumn(e.target.checked)}
                  aria-label={selectLabel}
                  className="checkbox-circle"
                />
              </label>
            </IconTooltip>
          )}
          <span className="font-mono text-sm text-muted-foreground">
            {STATUS_META[status].ascii}
          </span>
          <h2 className="truncate font-semibold tracking-tight">{label}</h2>
        </div>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card/60 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              variant="kanban"
              showOwner={showOwner}
              selected={selectedIds?.has(task.id)}
              onSelectedChange={
                onSelectedChange
                  ? (selected) => onSelectedChange(task.id, selected)
                  : undefined
              }
              onDelete={() => onDelete(task)}
              onDuplicate={
                onDuplicate ? () => onDuplicate(task) : undefined
              }
              onOpen={() => onOpen(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
              Solte tarefas aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
