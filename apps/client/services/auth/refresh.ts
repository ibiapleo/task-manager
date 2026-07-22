export interface SessionRefreshDeps {
  getSession: () => Promise<{
    data: {
      session: {
        access_token: string
        refresh_token: string
      } | null
    }
  }>
  refreshSession: () => Promise<{
    data: {
      session: {
        access_token: string
        refresh_token: string
      } | null
    }
    error: { message: string } | null
  }>
}

export function createEnsureFreshSession(deps: SessionRefreshDeps) {
  let refreshPromise: Promise<boolean> | null = null

  return function ensureFreshSession(): Promise<boolean> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      const { data } = await deps.getSession()
      const refreshToken = data.session?.refresh_token
      if (!refreshToken) return false

      const { data: refreshed, error } = await deps.refreshSession()
      if (error || !refreshed.session?.access_token) return false
      return true
    })().finally(() => {
      refreshPromise = null
    })

    return refreshPromise
  }
}
