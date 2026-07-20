'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/lib/types'
import { STATUS_META } from '@/lib/types'
import { SortableTask } from '@/components/tasks/sortable-task'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  showOwner?: boolean
  selectedIds?: Set<string>
  onSelectedChange?: (taskId: string, selected: boolean) => void
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
  onDelete,
  onDuplicate,
  onOpen,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-64 flex-col gap-3 rounded-3xl border border-border/50 bg-card/20 p-3 backdrop-blur-md transition',
        isOver && 'border-ring bg-card/40 ring-2 ring-ring/40',
      )}
    >
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {STATUS_META[status].ascii}
          </span>
          <h2 className="font-semibold tracking-tight">
            {STATUS_META[status].label}
          </h2>
        </div>
        <span className="flex size-6 items-center justify-center rounded-full bg-card/60 text-xs font-medium text-muted-foreground">
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
