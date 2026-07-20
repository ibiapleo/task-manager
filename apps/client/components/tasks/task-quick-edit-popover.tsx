'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import {
  useDateFormatPreference,
  useFormattedDate,
} from '@/hooks/use-formatted-date'
import { useUpdateTask } from '@/hooks/use-tasks'
import {
  dateFormatPlaceholder,
  formatDate,
  parseDateInput,
} from '@/lib/format-date'
import type { Priority, Task, TaskStatus } from '@/lib/types'
import { PRIORITY_META, STATUS_META } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH']

export const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent/15 text-accent',
  COMPLETED: 'bg-success/15 text-success',
}

export const PRIORITY_BADGE_STYLES: Record<Priority, string> = {
  HIGH: 'bg-destructive/15 text-destructive',
  MEDIUM: 'bg-accent/15 text-accent',
  LOW: 'bg-muted text-muted-foreground',
}

interface MenuRect {
  top: number
  left: number
  width: number
}

function useAnchoredMenu(menuWidth: number) {
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updateMenuRect = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - menuWidth - 8,
    )
    setMenuRect({ top: rect.bottom + 6, left, width: menuWidth })
  }, [menuWidth])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuRect()
  }, [open, updateMenuRect])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updateMenuRect()
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, updateMenuRect])

  return { open, setOpen, menuRect, triggerRef, menuRef }
}

function useTaskFieldPatch(taskId: string) {
  const updateTask = useUpdateTask()
  const isPendingForThis =
    updateTask.isPending && updateTask.variables?.id === taskId

  async function patch(
    next: Partial<{ status: TaskStatus; priority: Priority; dueDate: string }>,
  ): Promise<boolean> {
    try {
      await updateTask.mutateAsync({ id: taskId, patch: next })
      return true
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a tarefa.',
      )
      return false
    }
  }

  return { patch, isPendingForThis }
}

function BadgeMenuPortal({
  open,
  menuRect,
  menuRef,
  label,
  children,
}: {
  open: boolean
  menuRect: MenuRect | null
  menuRef: React.RefObject<HTMLDivElement | null>
  label: string
  children: ReactNode
}) {
  if (!open || !menuRect) return null
  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label={label}
      style={{
        top: menuRect.top,
        left: menuRect.left,
        width: menuRect.width,
      }}
      className="glass fixed z-[100] flex flex-col gap-1.5 rounded-2xl border border-border/60 p-2 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}

interface BadgeEditorProps {
  task: Task
}

/** Status pill — click opens the other status options (Jira-style). */
export function TaskStatusBadge({ task }: BadgeEditorProps) {
  const { open, setOpen, menuRect, triggerRef, menuRef } = useAnchoredMenu(180)
  const { patch, isPendingForThis } = useTaskFieldPatch(task.id)

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Alterar status (atual: ${STATUS_META[task.status].label})`}
        disabled={isPendingForThis}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition active:scale-95',
          'hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:active:scale-100',
          STATUS_BADGE_STYLES[task.status],
        )}
      >
        {STATUS_META[task.status].label}
      </button>

      <BadgeMenuPortal
        open={open}
        menuRect={menuRect}
        menuRef={menuRef}
        label="Status"
      >
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            role="option"
            aria-selected={task.status === status}
            disabled={isPendingForThis}
            onClick={() => {
              void patch({ status }).then((ok) => {
                if (ok) setOpen(false)
              })
            }}
            className={cn(
              'rounded-full px-2.5 py-1.5 text-left text-xs font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100',
              task.status === status
                ? STATUS_BADGE_STYLES[status]
                : 'hover:bg-card/70',
            )}
          >
            {STATUS_META[status].label}
          </button>
        ))}
      </BadgeMenuPortal>
    </div>
  )
}

/** Priority pill — click opens the other priority options. */
export function TaskPriorityBadge({ task }: BadgeEditorProps) {
  const { open, setOpen, menuRect, triggerRef, menuRef } = useAnchoredMenu(160)
  const { patch, isPendingForThis } = useTaskFieldPatch(task.id)

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Alterar prioridade (atual: ${PRIORITY_META[task.priority].label})`}
        disabled={isPendingForThis}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition active:scale-95',
          'hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:active:scale-100',
          PRIORITY_BADGE_STYLES[task.priority],
        )}
      >
        {PRIORITY_META[task.priority].label}
      </button>

      <BadgeMenuPortal
        open={open}
        menuRect={menuRect}
        menuRef={menuRef}
        label="Prioridade"
      >
        {PRIORITY_OPTIONS.map((priority) => (
          <button
            key={priority}
            type="button"
            role="option"
            aria-selected={task.priority === priority}
            disabled={isPendingForThis}
            onClick={() => {
              void patch({ priority }).then((ok) => {
                if (ok) setOpen(false)
              })
            }}
            className={cn(
              'rounded-full px-2.5 py-1.5 text-left text-xs font-medium transition active:scale-95 disabled:opacity-50 disabled:active:scale-100',
              task.priority === priority
                ? PRIORITY_BADGE_STYLES[priority]
                : 'hover:bg-card/70',
            )}
          >
            {PRIORITY_META[priority].label}
          </button>
        ))}
      </BadgeMenuPortal>
    </div>
  )
}

/**
 * Due-date chip — shows the formatted date or "Sem data"; click opens a
 * text field in the user's dateFormat preference (not the browser locale
 * forced by `<input type="date">`). A hidden native picker backs the
 * calendar affordance when available.
 */
export function TaskDueBadge({ task }: BadgeEditorProps) {
  const dueLabel = useFormattedDate(task.dueDate)
  const dateFormat = useDateFormatPreference()
  const { open, setOpen, menuRect, triggerRef, menuRef } = useAnchoredMenu(240)
  const { patch, isPendingForThis } = useTaskFieldPatch(task.id)
  const inputId = useId()
  const nativeId = useId()
  const isoValue = task.dueDate ? task.dueDate.slice(0, 10) : ''
  const [draft, setDraft] = useState(
    () => formatDate(task.dueDate, dateFormat) ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const nativeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(formatDate(task.dueDate, dateFormat) ?? '')
    setError(null)
  }, [open, task.dueDate, dateFormat])

  async function commit(raw: string) {
    const iso = parseDateInput(raw, dateFormat)
    if (!iso) {
      setError(`Use o formato ${dateFormatPlaceholder(dateFormat)}.`)
      return
    }
    setError(null)
    const ok = await patch({ dueDate: iso })
    if (ok) setOpen(false)
  }

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          dueLabel
            ? `Alterar data limite (atual: ${dueLabel})`
            : 'Definir data limite'
        }
        disabled={isPendingForThis}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition active:scale-95',
          'hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:active:scale-100',
          dueLabel
            ? 'bg-card/50 text-muted-foreground'
            : 'border border-dashed border-border/60 text-muted-foreground',
        )}
      >
        <CalendarDays className="size-3" />
        {dueLabel ?? 'Sem data'}
      </button>

      <BadgeMenuPortal
        open={open}
        menuRect={menuRect}
        menuRef={menuRef}
        label="Data limite"
      >
        <label
          htmlFor={inputId}
          className="px-1 text-[11px] font-medium text-muted-foreground"
        >
          Data limite
        </label>
        <div className="relative">
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            placeholder={dateFormatPlaceholder(dateFormat)}
            value={draft}
            disabled={isPendingForThis}
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void commit(draft)
              }
            }}
            onBlur={() => {
              if (!draft.trim()) return
              // Only auto-save when the typed value is already valid; leave
              // the field open with an error when the user is mid-edit.
              if (parseDateInput(draft, dateFormat)) void commit(draft)
            }}
            className="h-9 w-full rounded-full border border-border/60 bg-card/50 py-2 pl-3 pr-9 text-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <input
            id={nativeId}
            ref={nativeRef}
            type="date"
            tabIndex={-1}
            value={isoValue}
            disabled={isPendingForThis}
            onChange={(e) => {
              const value = e.target.value
              if (!value) return
              setDraft(formatDate(value, dateFormat) ?? value)
              void patch({ dueDate: value }).then((ok) => {
                if (ok) setOpen(false)
              })
            }}
            className="pointer-events-none absolute inset-0 opacity-0"
            aria-hidden
          />
          <button
            type="button"
            aria-label="Abrir calendário"
            disabled={isPendingForThis}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const el = nativeRef.current
              if (!el) return
              if (typeof el.showPicker === 'function') {
                el.showPicker()
              } else {
                el.click()
              }
            }}
            className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <CalendarDays className="size-3.5" />
          </button>
        </div>
        {error && (
          <p className="px-1 text-[10px] text-destructive">{error}</p>
        )}
      </BadgeMenuPortal>
    </div>
  )
}
