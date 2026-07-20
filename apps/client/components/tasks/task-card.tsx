'use client'

import { forwardRef } from 'react'
import {
  CalendarDays,
  Check,
  GripVertical,
  Loader2,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PRIORITY_BADGE_STYLES,
  STATUS_BADGE_STYLES,
  TaskDueBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
} from '@/components/tasks/task-quick-edit-popover'
import { useFormattedDate } from '@/hooks/use-formatted-date'
import { useUpdateTask } from '@/hooks/use-tasks'
import { UserAvatar } from '@/components/user-avatar'
import type { Task } from '@/lib/types'
import { PRIORITY_META, STATUS_META } from '@/lib/types'
import { cn } from '@/lib/utils'

const DESCRIPTION_LIMIT = 120

function truncateDescription(text: string): string {
  if (text.length <= DESCRIPTION_LIMIT) return text
  return `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}...`
}

interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task: Task
  variant?: 'kanban' | 'list'
  showOwner?: boolean
  dragging?: boolean
  overlay?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  handleProps?: React.HTMLAttributes<HTMLButtonElement>
  onDelete?: () => void
  onOpen?: () => void
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  function TaskCard(
    {
      task,
      variant = 'kanban',
      showOwner = false,
      dragging,
      overlay,
      selected = false,
      onSelectedChange,
      handleProps,
      onDelete,
      onOpen,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const dueLabel = useFormattedDate(task.dueDate)
    const updateTask = useUpdateTask()
    const isUpdatingThis =
      updateTask.isPending && updateTask.variables?.id === task.id
    const description = task.description
      ? truncateDescription(task.description)
      : null
    const ownerName = task.user?.name?.trim() || 'Sem nome'

    async function handleComplete(e: React.MouseEvent) {
      e.stopPropagation()
      if (task.status === 'COMPLETED' || isUpdatingThis) return
      try {
        await updateTask.mutateAsync({
          id: task.id,
          patch: { status: 'COMPLETED' },
        })
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir a tarefa.',
        )
      }
    }

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          'glass group/card rounded-3xl p-4 transition',
          variant === 'list' && 'flex items-center gap-3',
          dragging && 'opacity-40',
          overlay && 'rotate-3 cursor-grabbing shadow-2xl',
          onOpen && 'cursor-pointer',
          className,
        )}
        onClick={onOpen}
        {...props}
      >
        {(onSelectedChange || handleProps) && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-1',
              variant === 'kanban' && 'mb-2',
            )}
          >
            {onSelectedChange && (
              <label
                className="flex size-8 items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  aria-label={`Selecionar tarefa ${task.title}`}
                  onChange={(e) => onSelectedChange(e.target.checked)}
                  className="checkbox-circle"
                />
              </label>
            )}
            {handleProps && (
              <button
                type="button"
                aria-label="Arrastar tarefa"
                onClick={(e) => e.stopPropagation()}
                className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground transition hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                {...handleProps}
              >
                <GripVertical className="size-4" />
              </button>
            )}
          </div>
        )}

        <div className={cn(variant === 'list' && 'min-w-0 flex-1')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight tracking-tight text-pretty">
              {task.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition focus-within:opacity-100 group-hover/card:opacity-100">
              {task.status !== 'COMPLETED' && (
                <button
                  type="button"
                  aria-label={`Concluir tarefa ${task.title}`}
                  disabled={isUpdatingThis}
                  onClick={handleComplete}
                  className="rounded-lg p-1.5 text-muted-foreground transition active:scale-90 hover:bg-success/15 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
                >
                  {isUpdatingThis &&
                  updateTask.variables?.patch.status === 'COMPLETED' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </button>
              )}
              {onOpen && (
                <button
                  type="button"
                  aria-label={`Abrir detalhes de ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen()
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground transition active:scale-90 hover:bg-accent/15 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="size-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Excluir tarefa ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground transition active:scale-90 hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>

          {description && (
            <p
              className={cn(
                'mt-1 text-sm leading-relaxed text-muted-foreground text-pretty',
                variant === 'list' && 'line-clamp-1',
              )}
            >
              {description}
            </p>
          )}

          {showOwner && task.user && (
            <span
              aria-label={`Responsável: ${ownerName}`}
              className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1 pr-3 pl-1 text-xs font-medium text-foreground"
            >
              <UserAvatar
                profile={{
                  name: task.user.name,
                  avatarUrl: task.user.avatarUrl,
                }}
                size="sm"
                className="size-6 text-[10px]"
              />
              <span className="truncate">{ownerName}</span>
            </span>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {overlay ? (
              <>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    STATUS_BADGE_STYLES[task.status],
                  )}
                >
                  {STATUS_META[task.status].label}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    PRIORITY_BADGE_STYLES[task.priority],
                  )}
                >
                  {PRIORITY_META[task.priority].label}
                </span>
                {dueLabel && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {dueLabel}
                  </span>
                )}
              </>
            ) : (
              <>
                <TaskStatusBadge task={task} />
                <TaskPriorityBadge task={task} />
                <TaskDueBadge task={task} />
              </>
            )}
            {task.attachments.length > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="size-3" />
                {task.attachments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  },
)
