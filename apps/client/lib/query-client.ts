import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
    return false
  }
  return failureCount < 2
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
