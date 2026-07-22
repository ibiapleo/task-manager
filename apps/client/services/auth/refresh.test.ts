import { describe, expect, it, vi } from 'vitest'
import { createEnsureFreshSession } from './refresh'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('createEnsureFreshSession', () => {
  it('returns false without calling refresh when there is no refresh_token', async () => {
    const refreshSession = vi.fn()
    const ensureFreshSession = createEnsureFreshSession({
      getSession: async () => ({ data: { session: null } }),
      refreshSession,
    })

    await expect(ensureFreshSession()).resolves.toBe(false)
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('returns false when refreshSession fails', async () => {
    const ensureFreshSession = createEnsureFreshSession({
      getSession: async () => ({
        data: {
          session: {
            access_token: 'expired',
            refresh_token: 'refresh',
          },
        },
      }),
      refreshSession: async () => ({
        data: { session: null },
        error: { message: 'Invalid Refresh Token' },
      }),
    })

    await expect(ensureFreshSession()).resolves.toBe(false)
  })

  it('shares one in-flight refresh across concurrent callers', async () => {
    const gate = deferred<{
      data: {
        session: { access_token: string; refresh_token: string } | null
      }
      error: null
    }>()

    const refreshSession = vi.fn(() => gate.promise)
    const ensureFreshSession = createEnsureFreshSession({
      getSession: async () => ({
        data: {
          session: {
            access_token: 'expired',
            refresh_token: 'refresh',
          },
        },
      }),
      refreshSession,
    })

    const first = ensureFreshSession()
    const second = ensureFreshSession()

    await vi.waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1)
    })

    gate.resolve({
      data: {
        session: {
          access_token: 'fresh',
          refresh_token: 'refresh',
        },
      },
      error: null,
    })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })
})
