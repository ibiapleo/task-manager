'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskPaginationProps {
  page: number
  totalPages: number
  total?: number
  onPageChange: (page: number) => void
  className?: string
}

export function TaskPagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: TaskPaginationProps) {
  if (totalPages <= 1) return null

  const atStart = page <= 1
  const atEnd = page >= totalPages

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        'glass flex flex-wrap items-center justify-center gap-3 rounded-full px-3 py-2',
        className,
      )}
    >
      <button
        type="button"
        disabled={atStart}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100',
          'text-muted-foreground hover:bg-card/60 hover:text-foreground',
        )}
      >
        <ChevronLeft className="size-4" />
        Anterior
      </button>

      <p className="min-w-[8rem] text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Página {page} de {totalPages}
        </span>
        {typeof total === 'number' && (
          <span className="mt-0.5 block text-xs">
            {total} {total === 1 ? 'tarefa' : 'tarefas'}
          </span>
        )}
      </p>

      <button
        type="button"
        disabled={atEnd}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100',
          'text-muted-foreground hover:bg-card/60 hover:text-foreground',
        )}
      >
        Próxima
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
