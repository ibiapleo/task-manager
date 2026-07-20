'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { AddTaskDialog } from '@/components/tasks/add-task-dialog'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TaskSortBar } from '@/components/tasks/task-sort-bar'
import { TasksBoard } from '@/components/tasks/tasks-board'
import { usePermissions } from '@/hooks/use-permissions'
import { useProfile } from '@/hooks/use-profile'
import {
  DEFAULT_TASK_SEARCH,
  parseTaskSearchParams,
  serializeTaskSearchParams,
  toTaskFilterInput,
  type TaskScope,
  type TaskSearchState,
} from '@/lib/task-search-params'
import { cn } from '@/lib/utils'

function TasksPageContent() {
  const { data: profile } = useProfile()
  const { isAdmin } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [adding, setAdding] = useState(false)

  const parsed = useMemo(
    () => parseTaskSearchParams(searchParams),
    [searchParams],
  )

  // COMMON never gets the global board — strip scope=all from a shared URL.
  const state = useMemo<TaskSearchState>(() => {
    if (!isAdmin && parsed.scope === 'all') {
      return { ...parsed, scope: 'personal' }
    }
    return parsed
  }, [isAdmin, parsed])

  const replaceState = useCallback(
    (next: TaskSearchState) => {
      const params = serializeTaskSearchParams(next)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!isAdmin && parsed.scope === 'all') {
      replaceState({ ...parsed, scope: 'personal' })
    }
  }, [isAdmin, parsed, replaceState])

  const patchState = useCallback(
    (patch: Partial<TaskSearchState>) => {
      replaceState({ ...state, ...patch })
    },
    [replaceState, state],
  )

  const setScope = useCallback(
    (scope: TaskScope) => {
      if (scope === state.scope) return
      // Reset filters when switching boards; keep list/kanban layout preference.
      replaceState({
        ...DEFAULT_TASK_SEARCH,
        view: state.view,
        scope,
      })
    },
    [replaceState, state.scope, state.view],
  )

  const clearFilters = useCallback(() => {
    replaceState({
      ...state,
      status: undefined,
      priority: undefined,
      q: '',
      due: 'all',
    })
  }, [replaceState, state])

  const filters = useMemo(() => toTaskFilterInput(state), [state])
  const firstName = profile?.name?.split(' ')[0] ?? profile?.email?.split('@')[0]

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        {firstName && (
          <p className="text-sm font-medium text-muted-foreground">
            Olá, {firstName}
          </p>
        )}
        <h1 className="mt-1 text-4xl font-extrabold tracking-tighter text-balance sm:text-5xl md:text-6xl">
          {state.scope === 'all'
            ? 'Todas as tarefas da plataforma.'
            : 'Suas tarefas, em fluxo.'}
        </h1>
      </header>

      {isAdmin && (
        <div
          role="tablist"
          aria-label="Escopo das tarefas"
          className="glass mx-auto inline-flex items-center gap-1 rounded-full p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={state.scope === 'personal'}
            onClick={() => setScope('personal')}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              state.scope === 'personal'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Minhas Tarefas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.scope === 'all'}
            onClick={() => setScope('all')}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              state.scope === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Todas as Tarefas
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div
          role="tablist"
          aria-label="Modo de visualização"
          className="glass inline-flex items-center gap-1 rounded-full p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={state.view === 'list'}
            onClick={() => patchState({ view: 'list' })}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              state.view === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="size-4" />
            Lista
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.view === 'kanban'}
            onClick={() => patchState({ view: 'kanban' })}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              state.view === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="size-4" />
            Kanban
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95',
            'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <Plus className="size-4" />
          Nova tarefa
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <TaskFilters
          state={state}
          onChange={patchState}
          onClear={clearFilters}
        />
        <div className="flex justify-end">
          <TaskSortBar
            state={{ sort: state.sort, order: state.order }}
            onChange={patchState}
          />
        </div>
      </div>

      <TasksBoard
        viewMode={state.view}
        scope={state.scope}
        filters={filters}
      />

      <AddTaskDialog open={adding} onOpenChange={setAdding} />
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Carregando tarefas...
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  )
}
