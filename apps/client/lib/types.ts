import type {
  Priority,
  ProfileResponse,
  Role,
  TaskResponse,
  Theme,
} from '@task-manager/shared-types'

// Re-exported so the rest of the app imports domain types from one place.
// The actual shapes/validation live in @task-manager/shared-types, which is
// hand-kept in sync with the NestJS DTOs in apps/api/src.
export type { Priority, Role }
export type TaskStatus = TaskResponse['status']
export type ThemeName = Theme

/** App-facing aliases for the backend response shapes. */
export type Task = TaskResponse
export type User = ProfileResponse

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

export const STATUS_META: Record<
  TaskStatus,
  { label: string; ascii: string }
> = {
  PENDING: { label: 'Pendente', ascii: '[ ]' },
  IN_PROGRESS: { label: 'Em progresso', ascii: '[~]' },
  COMPLETED: { label: 'Concluído', ascii: '[x]' },
}

export const PRIORITY_META: Record<Priority, { label: string }> = {
  LOW: { label: 'Baixa' },
  MEDIUM: { label: 'Média' },
  HIGH: { label: 'Alta' },
}

export const ROLE_META: Record<Role, { label: string }> = {
  ADMIN: { label: 'Admin' },
  COMMON: { label: 'Comum' },
}

export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
]
