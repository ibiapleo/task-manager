'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function pluralize(count: number, singular: string): string {
  if (count === 1) return singular
  if (singular.endsWith('m')) return `${singular.slice(0, -1)}ns`
  if (singular.endsWith('ão')) return `${singular.slice(0, -2)}ões`
  if (singular.endsWith('l')) return `${singular.slice(0, -1)}is`
  if (singular.endsWith('r') || singular.endsWith('z')) return `${singular}es`
  return `${singular}s`
}

interface PaginationProps {
  page: number
  totalPages: number
  total?: number
  itemLabel: string
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const atStart = page <= 1
  const atEnd = page >= totalPages
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1)

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

      <div className="flex flex-col items-center gap-0.5">
        <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Página</span>
          <select
            aria-label="Selecionar página"
            value={page}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className={cn(
              'h-8 min-w-[3.25rem] cursor-pointer appearance-none rounded-full border border-border/60 bg-card/60 px-2.5 text-center text-sm font-medium text-foreground outline-none',
              'transition hover:bg-card/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
          >
            {pageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="font-medium text-foreground">de {totalPages}</span>
        </label>
        {typeof total === 'number' && (
          <span className="text-xs text-muted-foreground">
            {total} {pluralize(total, itemLabel)}
          </span>
        )}
      </div>

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
