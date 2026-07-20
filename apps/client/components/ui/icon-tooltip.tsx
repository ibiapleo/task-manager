'use client'

import { isValidElement, type ReactElement } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

interface IconTooltipProps {
  label: string
  side?: TooltipSide
  children: ReactElement
}

/**
 * Standard accessible tooltip for isolated icon controls.
 * Uses Base UI TooltipTrigger `render` so the child stays the focusable
 * element (no extra wrapper that would break drag/stopPropagation).
 */
export function IconTooltip({
  label,
  side = 'top',
  children,
}: IconTooltipProps) {
  if (!isValidElement(children)) return children

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
