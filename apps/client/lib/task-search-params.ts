import type { TaskFilterInput } from '@task-manager/shared-types'
import type { Priority, TaskStatus } from '@/lib/types'

export type TaskViewMode = 'list' | 'kanban'
export type TaskScope = 'personal' | 'all'
export type DuePreset = 'all' | 'overdue' | 'today' | 'week' | 'none'
export type TaskSortField = 'createdAt' | 'priority' | 'dueDate'
export type SortOrder = 'asc' | 'desc'

export interface TaskSearchState {
  view: TaskViewMode
  scope: TaskScope
  status?: TaskStatus
  priority?: Priority
  q: string
  due: DuePreset
  sort: TaskSortField
  order: SortOrder
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
}

function isOneOf<T extends string>(value: string | null, allowed: T[]): value is T {
  return value != null && (allowed as string[]).includes(value)
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

/** Parse URLSearchParams into a typed task board state (unknown keys ignored). */
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
    due: isOneOf(dueRaw, DUES) ? dueRaw : DEFAULT_TASK_SEARCH.due,
    sort: isOneOf(sortRaw, SORTS) ? sortRaw : DEFAULT_TASK_SEARCH.sort,
    order: isOneOf(orderRaw, ORDERS) ? orderRaw : DEFAULT_TASK_SEARCH.order,
  }
}

/**
 * Serialize typed state to a URLSearchParams instance, omitting defaults so
 * the URL stays shareable and readable.
 */
export function serializeTaskSearchParams(
  state: TaskSearchState,
): URLSearchParams {
  const params = new URLSearchParams()
  if (state.view !== DEFAULT_TASK_SEARCH.view) params.set('view', state.view)
  if (state.scope !== DEFAULT_TASK_SEARCH.scope) params.set('scope', state.scope)
  if (state.status) params.set('status', state.status)
  if (state.priority) params.set('priority', state.priority)
  if (state.q) params.set('q', state.q)
  if (state.due !== DEFAULT_TASK_SEARCH.due) params.set('due', state.due)
  if (state.sort !== DEFAULT_TASK_SEARCH.sort) params.set('sort', state.sort)
  if (state.order !== DEFAULT_TASK_SEARCH.order) params.set('order', state.order)
  return params
}

/** Map URL due presets + sort into the API's TaskFilterInput shape. */
export function toTaskFilterInput(state: TaskSearchState): TaskFilterInput {
  const today = toIsoDate(new Date())
  const filter: TaskFilterInput = {
    scope: state.scope,
    sortBy: state.sort,
    order: state.order,
    page: 1,
    limit: 100,
  }

  if (state.status) filter.status = state.status
  if (state.priority) filter.priority = state.priority
  if (state.q) filter.search = state.q

  switch (state.due) {
    case 'overdue':
      // Exclusive of today: anything due strictly before today.
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
