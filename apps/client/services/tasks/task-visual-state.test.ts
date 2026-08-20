import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getTaskVisualState,
  isTaskOverdue,
} from './task-visual-state'

const TODAY = '2026-08-19'

afterEach(() => {
  vi.useRealTimers()
})

describe('getTaskVisualState', () => {
  it('returns overdue when the due date is before today and status is pending', () => {
    expect(
      getTaskVisualState(
        { status: 'PENDING', dueDate: '2026-08-18' },
        TODAY,
      ),
    ).toBe('overdue')
  })

  it('returns default when the due date is today', () => {
    expect(
      getTaskVisualState(
        { status: 'IN_PROGRESS', dueDate: '2026-08-19' },
        TODAY,
      ),
    ).toBe('default')
  })

  it('returns default when the due date is in the future', () => {
    expect(
      getTaskVisualState(
        { status: 'PENDING', dueDate: '2026-08-20' },
        TODAY,
      ),
    ).toBe('default')
  })

  it('returns default when there is no due date', () => {
    expect(
      getTaskVisualState({ status: 'PENDING', dueDate: null }, TODAY),
    ).toBe('default')
  })

  it('returns completed for a completed task with a past due date', () => {
    expect(
      getTaskVisualState(
        { status: 'COMPLETED', dueDate: '2026-08-01' },
        TODAY,
      ),
    ).toBe('completed')
  })

  it('returns completed for a completed task without a due date', () => {
    expect(
      getTaskVisualState({ status: 'COMPLETED', dueDate: null }, TODAY),
    ).toBe('completed')
  })

  it('accepts a full ISO due date string', () => {
    expect(
      getTaskVisualState(
        { status: 'PENDING', dueDate: '2026-08-18T00:00:00.000Z' },
        TODAY,
      ),
    ).toBe('overdue')
  })

  it('accepts a Date due date', () => {
    expect(
      getTaskVisualState(
        { status: 'PENDING', dueDate: new Date('2026-08-18T00:00:00.000Z') },
        TODAY,
      ),
    ).toBe('overdue')
  })

  it('uses UTC today when today is omitted', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T15:00:00.000Z'))

    expect(
      getTaskVisualState({ status: 'PENDING', dueDate: '2026-08-18' }),
    ).toBe('overdue')
    expect(
      getTaskVisualState({ status: 'PENDING', dueDate: '2026-08-19' }),
    ).toBe('default')
  })
})

describe('isTaskOverdue', () => {
  it('is true only for overdue visual state', () => {
    expect(
      isTaskOverdue({ status: 'PENDING', dueDate: '2026-08-18' }, TODAY),
    ).toBe(true)
    expect(
      isTaskOverdue({ status: 'IN_PROGRESS', dueDate: '2026-08-19' }, TODAY),
    ).toBe(false)
    expect(
      isTaskOverdue({ status: 'PENDING', dueDate: '2026-08-20' }, TODAY),
    ).toBe(false)
    expect(
      isTaskOverdue({ status: 'PENDING', dueDate: null }, TODAY),
    ).toBe(false)
    expect(
      isTaskOverdue({ status: 'COMPLETED', dueDate: '2026-08-01' }, TODAY),
    ).toBe(false)
    expect(
      isTaskOverdue({ status: 'COMPLETED', dueDate: null }, TODAY),
    ).toBe(false)
  })
})
