'use client'

import { ArrowDownUp } from 'lucide-react'
import { PillSelect } from '@/components/ui/pill-select'
import type { SortOrder, TaskSearchState, TaskSortField } from '@/lib/task-search-params'

type SortKey = `${TaskSortField}:${SortOrder}`

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt:desc', label: 'Criação (mais recentes)' },
  { value: 'createdAt:asc', label: 'Criação (mais antigas)' },
  { value: 'dueDate:asc', label: 'Vencimento (mais próximas)' },
  { value: 'dueDate:desc', label: 'Vencimento (mais distantes)' },
  { value: 'priority:desc', label: 'Prioridade (alta → baixa)' },
  { value: 'priority:asc', label: 'Prioridade (baixa → alta)' },
]

interface TaskSortBarProps {
  state: Pick<TaskSearchState, 'sort' | 'order'>
  onChange: (patch: Pick<TaskSearchState, 'sort' | 'order'>) => void
}

export function TaskSortBar({ state, onChange }: TaskSortBarProps) {
  const value: SortKey = `${state.sort}:${state.order}`

  return (
    <div className="flex items-center gap-2">
      <ArrowDownUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <PillSelect<SortKey>
        label="Ordenar"
        value={value}
        options={SORT_OPTIONS}
        onChange={(next) => {
          const [sort, order] = next.split(':') as [TaskSortField, SortOrder]
          onChange({ sort, order })
        }}
        className="min-w-[14rem]"
      />
    </div>
  )
}
