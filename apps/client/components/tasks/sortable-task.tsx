'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'
import { TaskCard } from '@/components/tasks/task-card'

interface SortableTaskProps {
  task: Task
  variant?: 'kanban' | 'list'
  showOwner?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  onDelete?: () => void
  onOpen?: () => void
}

export function SortableTask({
  task,
  variant = 'kanban',
  showOwner = false,
  selected,
  onSelectedChange,
  onDelete,
  onOpen,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } })

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      variant={variant}
      showOwner={showOwner}
      dragging={isDragging}
      selected={selected}
      onSelectedChange={onSelectedChange}
      onDelete={onDelete}
      onOpen={onOpen}
      handleProps={{ ...attributes, ...(listeners as object) }}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    />
  )
}
