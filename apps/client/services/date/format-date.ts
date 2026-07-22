import type { DateFormat } from '@/domain/types'

function calendarParts(
  date: string | Date,
): { year: string; month: string; day: string } | null {
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim())
    if (match) {
      return { year: match[1], month: match[2], day: match[3] }
    }
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return null
    return calendarPartsFromDate(parsed)
  }

  if (Number.isNaN(date.getTime())) return null
  return calendarPartsFromDate(date)
}

function calendarPartsFromDate(date: Date): {
  year: string
  month: string
  day: string
} {
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return { year, month, day }
}

function isValidCalendarDay(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const probe = new Date(Date.UTC(year, month - 1, day))
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  )
}

export function formatDate(
  date: string | Date | null | undefined,
  format: DateFormat,
): string | null {
  if (!date) return null

  const parts = calendarParts(date)
  if (!parts) return null

  const { day, month, year } = parts

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

export function dateFormatPlaceholder(format: DateFormat): string {
  switch (format) {
    case 'MM/DD/YYYY':
      return 'MM/DD/AAAA'
    case 'YYYY-MM-DD':
      return 'AAAA-MM-DD'
    case 'DD/MM/YYYY':
    default:
      return 'DD/MM/AAAA'
  }
}

export function parseDateInput(
  value: string,
  format: DateFormat,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2])
    const day = Number(iso[3])
    if (!isValidCalendarDay(year, month, day)) return null
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }

  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (!slash) return null

  const a = Number(slash[1])
  const b = Number(slash[2])
  const year = Number(slash[3])

  let day: number
  let month: number
  if (format === 'MM/DD/YYYY') {
    month = a
    day = b
  } else {
    // DD/MM/YYYY (default)
    day = a
    month = b
  }

  if (!isValidCalendarDay(year, month, day)) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
