'use client'

import { useProfile } from '@/hooks/use-profile'
import { formatDate } from '@/services/date/format-date'
import type { DateFormat } from '@/domain/types'

const KNOWN_FORMATS: DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

export function useDateFormatPreference(): DateFormat {
  const { data: profile } = useProfile()
  const rawFormat = profile?.preferences.localization.dateFormat
  return KNOWN_FORMATS.includes(rawFormat as DateFormat)
    ? (rawFormat as DateFormat)
    : 'DD/MM/YYYY'
}

export function useFormattedDate(
  date: string | Date | null | undefined,
): string | null {
  const format = useDateFormatPreference()
  return formatDate(date, format)
}
