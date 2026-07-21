import { createEnsureFreshSession } from './auth-refresh'
import { supabase } from './supabase-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const ensureFreshSession = createEnsureFreshSession({
  getSession: () => supabase.auth.getSession(),
  refreshSession: () => supabase.auth.refreshSession(),
})

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
}

function isRequestOptions(value: unknown): value is RequestOptions {
  if (typeof value !== 'object' || value === null) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.every((key) => key === 'query' || key === 'signal')
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), `${API_BASE_URL}/`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface NestErrorBody {
  message?: string | string[]
  error?: string
}

function errorMessage(payload: NestErrorBody | null, fallback: string): string {
  if (!payload) return fallback
  return Array.isArray(payload.message)
    ? payload.message.join(', ')
    : payload.message ?? fallback
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  retried = false,
): Promise<T> {
  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload: NestErrorBody | T | null = await response.json().catch(() => null)

  if (!response.ok) {
    const nestBody = payload as NestErrorBody | null
    const message = errorMessage(
      nestBody,
      response.statusText || 'Unexpected error',
    )

    if (response.status === 401) {
      if (!retried) {
        const refreshed = await ensureFreshSession()
        if (refreshed) {
          return request<T>(method, path, body, options, true)
        }
      }
      unauthorizedHandler?.()
    }

    throw new ApiError(response.status, message)
  }

  return payload as T
}

/**
 * Thin, typed Fetch API wrapper shared by every hook in the app. Centralizes
 * auth header injection, silent token refresh on 401, and NestJS error-body
 * parsing so hooks/components never touch `fetch` directly.
 */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(
    path: string,
    bodyOrOptions?: unknown,
    options?: RequestOptions,
  ) => {
    if (options === undefined && isRequestOptions(bodyOrOptions)) {
      return request<T>('DELETE', path, undefined, bodyOrOptions)
    }
    return request<T>('DELETE', path, bodyOrOptions, options)
  },
}
