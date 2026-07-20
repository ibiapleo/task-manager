'use client'

import { useProfile } from '@/hooks/use-profile'
import { formatDate } from '@/lib/format-date'
import type { DateFormat } from '@/lib/types'

const KNOWN_FORMATS: DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

export function useDateFormatPreference(): DateFormat {
  const { data: profile } = useProfile()
  const rawFormat = profile?.preferences.localization.dateFormat
  return KNOWN_FORMATS.includes(rawFormat as DateFormat)
    ? (rawFormat as DateFormat)
    : 'DD/MM/YYYY'
}

/**
 * Formats a date using the authenticated user's saved
 * `localization.dateFormat` preference, so due dates render consistently
 * with whatever the user picked in Ajustes - instead of a fixed, hardcoded
 * locale.
 */
export function useFormattedDate(
  date: string | Date | null | undefined,
): string | null {
  const format = useDateFormatPreference()
  return formatDate(date, format)
}
