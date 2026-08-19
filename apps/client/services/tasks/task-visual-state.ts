import type { TaskStatus } from '../../domain/types'
import { toCivilDay } from '../date/format-date'

export type TaskVisualState = 'completed' | 'overdue' | 'default'

export interface TaskVisualInput {
  status: TaskStatus
  dueDate: string | Date | null
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getTaskVisualState(
  task: TaskVisualInput,
  today: string = todayUtc(),
): TaskVisualState {
  if (task.status === 'COMPLETED') return 'completed'

  const dueDay = toCivilDay(task.dueDate)
  if (!dueDay) return 'default'
  if (dueDay < today) return 'overdue'
  return 'default'
}

export function isTaskOverdue(
  task: TaskVisualInput,
  today?: string,
): boolean {
  return getTaskVisualState(task, today) === 'overdue'
}
