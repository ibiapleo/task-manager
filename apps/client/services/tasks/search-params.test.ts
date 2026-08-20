import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TASK_SEARCH,
  parseTaskSearchParams,
  serializeTaskSearchParams,
  toTaskFilterInput,
} from './search-params'

const WORKSPACE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

describe('task search params', () => {
  it('parses a valid workspace uuid from the URL', () => {
    const params = new URLSearchParams(`workspace=${WORKSPACE_ID}`)
    expect(parseTaskSearchParams(params).workspaceId).toBe(WORKSPACE_ID)
  })

  it('discards an invalid workspace value', () => {
    const params = new URLSearchParams('workspace=not-a-uuid')
    expect(parseTaskSearchParams(params).workspaceId).toBeUndefined()
  })

  it('serializes workspace into the workspace query param', () => {
    const params = serializeTaskSearchParams({
      ...DEFAULT_TASK_SEARCH,
      workspaceId: WORKSPACE_ID,
    })
    expect(params.get('workspace')).toBe(WORKSPACE_ID)
  })

  it('includes workspaceId in the API filter on personal scope', () => {
    const filter = toTaskFilterInput({
      ...DEFAULT_TASK_SEARCH,
      workspaceId: WORKSPACE_ID,
    })
    expect(filter.workspaceId).toBe(WORKSPACE_ID)
  })

  it('omits workspaceId from the API filter when scope is all', () => {
    const filter = toTaskFilterInput({
      ...DEFAULT_TASK_SEARCH,
      scope: 'all',
      workspaceId: WORKSPACE_ID,
    })
    expect(filter.workspaceId).toBeUndefined()
  })
})
