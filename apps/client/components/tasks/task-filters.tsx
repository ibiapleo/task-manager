'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass'
import { PillSelect } from '@/components/ui/pill-select'
import type {
  DuePreset,
  TaskSearchState,
} from '@/lib/task-search-params'
import type { Priority, TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: TaskStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'COMPLETED', label: 'Concluído' },
]

const PRIORITY_OPTIONS: { value: Priority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas as prioridades' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
]

const DUE_OPTIONS: { value: DuePreset; label: string }[] = [
  { value: 'all', label: 'Qualquer data' },
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Próximos 7 dias' },
  { value: 'none', label: 'Sem data' },
]

interface TaskFiltersProps {
  state: TaskSearchState
  onChange: (patch: Partial<TaskSearchState>) => void
  onClear: () => void
}

export function TaskFilters({ state, onChange, onClear }: TaskFiltersProps) {
  const [open, setOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(state.q)

  useEffect(() => {
    setSearchDraft(state.q)
  }, [state.q])

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Debounce search into the URL (~300ms) so typing doesn't thrash fetches.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft !== state.q) {
        onChangeRef.current({ q: searchDraft.trim() })
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchDraft, state.q])

  const hasActiveFilters =
    !!state.status ||
    !!state.priority ||
    !!state.q ||
    state.due !== 'all'

  return (
    <GlassCard className="overflow-visible p-3 sm:p-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-2 py-1 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight">Filtros</span>
          <span className="text-xs text-muted-foreground">
            {hasActiveFilters
              ? 'Filtros ativos — clique para ajustar'
              : 'Busca, status, prioridade e data'}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-border/40 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <label htmlFor="task-search" className="text-sm font-medium">
              Busca
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="task-search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Título ou descrição"
                className="h-10 w-full rounded-full border border-border/60 bg-card/50 py-2 pl-9 pr-4 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Status</span>
            <PillSelect<TaskStatus | 'ALL'>
              label="Status"
              value={state.status ?? 'ALL'}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                onChange({ status: value === 'ALL' ? undefined : value })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Prioridade</span>
            <PillSelect<Priority | 'ALL'>
              label="Prioridade"
              value={state.priority ?? 'ALL'}
              options={PRIORITY_OPTIONS}
              onChange={(value) =>
                onChange({ priority: value === 'ALL' ? undefined : value })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data</span>
            <PillSelect<DuePreset>
              label="Data"
              value={state.due}
              options={DUE_OPTIONS}
              onChange={(due) => onChange({ due })}
            />
          </div>

          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
