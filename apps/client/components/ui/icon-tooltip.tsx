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
