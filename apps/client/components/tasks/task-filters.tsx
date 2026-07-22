'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import type { ProfileResponse } from '@task-manager/shared-types'
import { GlassCard } from '@/components/ui/glass'
import { PillSelect } from '@/components/ui/pill-select'
import { UserAvatar } from '@/components/user-avatar'
import { useUsersQuery } from '@/hooks/use-users'
import type {
  DuePreset,
  TaskSearchState,
} from '@/services/tasks/search-params'
import type { Priority, TaskStatus } from '@/domain/types'
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

const USER_SEARCH_DEBOUNCE_MS = 300
const USER_SUGGESTION_LIMIT = 8

interface TaskFiltersProps {
  state: TaskSearchState
  onChange: (patch: Partial<TaskSearchState>) => void
  onClear: () => void
  showUserFilter?: boolean
}

export function TaskFilters({
  state,
  onChange,
  onClear,
  showUserFilter = false,
}: TaskFiltersProps) {
  const [open, setOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(state.q)
  const [userDraft, setUserDraft] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ProfileResponse | null>(null)
  const userPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchDraft(state.q)
  }, [state.q])

  useEffect(() => {
    if (!state.userId) {
      setSelectedUser(null)
      setUserDraft('')
      setUserQuery('')
    }
  }, [state.userId])

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft !== state.q) {
        onChangeRef.current({ q: searchDraft.trim() })
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchDraft, state.q])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setUserQuery(userDraft.trim())
    }, USER_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [userDraft])

  const { data: userSuggestions, isFetching: usersFetching } = useUsersQuery(
    {
      page: 1,
      limit: USER_SUGGESTION_LIMIT,
      search: userQuery || undefined,
    },
    { enabled: showUserFilter && suggestionsOpen && userQuery.length > 0 },
  )

  const { data: selectedLookup } = useUsersQuery(
    { page: 1, limit: 100 },
    { enabled: showUserFilter && !!state.userId && !selectedUser },
  )

  useEffect(() => {
    if (!state.userId || selectedUser) return
    const match = selectedLookup?.data.find((u) => u.id === state.userId)
    if (match) setSelectedUser(match)
  }, [selectedLookup, selectedUser, state.userId])

  useEffect(() => {
    if (!suggestionsOpen) return
    function onPointerDown(e: PointerEvent) {
      if (!userPickerRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [suggestionsOpen])

  const suggestions = userSuggestions?.data ?? []

  const hasActiveFilters =
    !!state.status ||
    !!state.priority ||
    !!state.q ||
    !!state.userId ||
    state.due !== 'all'

  function selectUser(user: ProfileResponse) {
    setSelectedUser(user)
    setUserDraft('')
    setUserQuery('')
    setSuggestionsOpen(false)
    onChange({ userId: user.id })
  }

  function clearUser() {
    setSelectedUser(null)
    setUserDraft('')
    setUserQuery('')
    onChange({ userId: undefined })
  }

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
              : showUserFilter
                ? 'Busca, usuário, status, prioridade e data'
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

          {showUserFilter && (
            <div
              ref={userPickerRef}
              className="relative flex flex-col gap-2 sm:col-span-2 lg:col-span-1"
            >
              <label htmlFor="task-user-filter" className="text-sm font-medium">
                Usuário
              </label>
              {selectedUser || state.userId ? (
                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1 pl-1 pr-2">
                  {selectedUser ? (
                    <UserAvatar profile={selectedUser} size="sm" />
                  ) : (
                    <span className="ml-2 size-8 rounded-full bg-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {selectedUser?.name || selectedUser?.email || 'Usuário'}
                  </span>
                  <button
                    type="button"
                    aria-label="Limpar filtro de usuário"
                    onClick={clearUser}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="task-user-filter"
                    value={userDraft}
                    onChange={(e) => {
                      setUserDraft(e.target.value)
                      setSuggestionsOpen(true)
                    }}
                    onFocus={() => setSuggestionsOpen(true)}
                    placeholder="Filtrar por usuário"
                    autoComplete="off"
                    className="h-10 w-full rounded-full border border-border/60 bg-card/50 py-2 pl-9 pr-4 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  {suggestionsOpen && userQuery.length > 0 && (
                    <ul
                      role="listbox"
                      aria-label="Sugestões de usuários"
                      className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-md"
                    >
                      {usersFetching && (
                        <li className="px-3 py-2 text-xs text-muted-foreground">
                          Buscando...
                        </li>
                      )}
                      {!usersFetching && suggestions.length === 0 && (
                        <li className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum usuário encontrado.
                        </li>
                      )}
                      {suggestions.map((user) => (
                        <li key={user.id} role="option">
                          <button
                            type="button"
                            onClick={() => selectUser(user)}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <UserAvatar profile={user} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {user.name || user.email}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

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
