import type { TaskFilterInput } from '@task-manager/shared-types'
import type { Priority, TaskStatus } from '@/domain/types'

export type TaskViewMode = 'list' | 'kanban'
export type TaskScope = 'personal' | 'all'
export type DuePreset = 'all' | 'overdue' | 'today' | 'week' | 'none'
export type TaskSortField = 'createdAt' | 'priority' | 'dueDate'
export type SortOrder = 'asc' | 'desc'

export const TASK_LIST_PAGE_SIZE = 20

export const TASK_KANBAN_PAGE_SIZE = 100

export interface TaskSearchState {
  view: TaskViewMode
  scope: TaskScope
  status?: TaskStatus
  priority?: Priority
  q: string
  userId?: string
  due: DuePreset
  sort: TaskSortField
  order: SortOrder
  page: number
}

const VIEWS: TaskViewMode[] = ['list', 'kanban']
const SCOPES: TaskScope[] = ['personal', 'all']
const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH']
const DUES: DuePreset[] = ['all', 'overdue', 'today', 'week', 'none']
const SORTS: TaskSortField[] = ['createdAt', 'priority', 'dueDate']
const ORDERS: SortOrder[] = ['asc', 'desc']

export const DEFAULT_TASK_SEARCH: TaskSearchState = {
  view: 'kanban',
  scope: 'personal',
  q: '',
  due: 'all',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
}

function isOneOf<T extends string>(value: string | null, allowed: T[]): value is T {
  return value != null && (allowed as string[]).includes(value)
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value == null || value === '') return fallback
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 1 ? n : fallback
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseUuid(value: string | null): string | undefined {
  if (!value) return undefined
  return UUID_RE.test(value) ? value : undefined
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

export function parseTaskSearchParams(
  params: URLSearchParams,
): TaskSearchState {
  const viewRaw = params.get('view')
  const scopeRaw = params.get('scope')
  const statusRaw = params.get('status')
  const priorityRaw = params.get('priority')
  const dueRaw = params.get('due')
  const sortRaw = params.get('sort')
  const orderRaw = params.get('order')
  const q = params.get('q')?.trim() ?? ''

  return {
    view: isOneOf(viewRaw, VIEWS) ? viewRaw : DEFAULT_TASK_SEARCH.view,
    scope: isOneOf(scopeRaw, SCOPES) ? scopeRaw : DEFAULT_TASK_SEARCH.scope,
    status: isOneOf(statusRaw, STATUSES) ? statusRaw : undefined,
    priority: isOneOf(priorityRaw, PRIORITIES) ? priorityRaw : undefined,
    q,
    userId: parseUuid(params.get('user')),
    due: isOneOf(dueRaw, DUES) ? dueRaw : DEFAULT_TASK_SEARCH.due,
    sort: isOneOf(sortRaw, SORTS) ? sortRaw : DEFAULT_TASK_SEARCH.sort,
    order: isOneOf(orderRaw, ORDERS) ? orderRaw : DEFAULT_TASK_SEARCH.order,
    page: parsePositiveInt(params.get('page'), DEFAULT_TASK_SEARCH.page),
  }
}

export function serializeTaskSearchParams(
  state: TaskSearchState,
): URLSearchParams {
  const params = new URLSearchParams()
  if (state.view !== DEFAULT_TASK_SEARCH.view) params.set('view', state.view)
  if (state.scope !== DEFAULT_TASK_SEARCH.scope) params.set('scope', state.scope)
  if (state.status) params.set('status', state.status)
  if (state.priority) params.set('priority', state.priority)
  if (state.q) params.set('q', state.q)
  if (state.userId) params.set('user', state.userId)
  if (state.due !== DEFAULT_TASK_SEARCH.due) params.set('due', state.due)
  if (state.sort !== DEFAULT_TASK_SEARCH.sort) params.set('sort', state.sort)
  if (state.order !== DEFAULT_TASK_SEARCH.order) params.set('order', state.order)
  if (state.page !== DEFAULT_TASK_SEARCH.page) {
    params.set('page', String(state.page))
  }
  return params
}

export function toTaskFilterInput(state: TaskSearchState): TaskFilterInput {
  const today = toIsoDate(new Date())
  const isList = state.view === 'list'
  const filter: TaskFilterInput = {
    scope: state.scope,
    sortBy: state.sort,
    order: state.order,
    page: isList ? state.page : 1,
    limit: isList ? TASK_LIST_PAGE_SIZE : TASK_KANBAN_PAGE_SIZE,
  }

  if (state.status) filter.status = state.status
  if (state.priority) filter.priority = state.priority
  if (state.q) filter.search = state.q
  if (state.scope === 'all' && state.userId) filter.profileId = state.userId

  switch (state.due) {
    case 'overdue':
      filter.dueBefore = addUtcDays(today, -1)
      break
    case 'today':
      filter.dueAfter = today
      filter.dueBefore = today
      break
    case 'week':
      filter.dueAfter = today
      filter.dueBefore = addUtcDays(today, 7)
      break
    case 'none':
      filter.unscheduled = true
      break
    case 'all':
    default:
      break
  }

  return filter
}
