'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WorkspaceResponse } from '@task-manager/shared-types'
import { WorkspaceRail } from '@/components/workspaces/workspace-rail'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { cn } from '@/lib/utils'

interface WorkspaceRailSheetProps {
  workspaces: WorkspaceResponse[]
  activeWorkspaceId?: string
  onSelect: (id: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

export function WorkspaceRailSheet({
  workspaces,
  activeWorkspaceId,
  onSelect,
  isLoading = false,
  isError = false,
  onRetry,
}: WorkspaceRailSheetProps) {
  const [open, setOpen] = useState(false)
  const active = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  )

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleSelect(id: string) {
    onSelect(id)
    setOpen(false)
  }

  const toggleLabel = open ? 'Esconder espaços' : 'Mostrar espaços'

  return (
    <>
      <IconTooltip label={toggleLabel} side="right">
        <button
          type="button"
          aria-label={toggleLabel}
          aria-expanded={open}
          aria-controls="workspace-rail-panel"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            'fixed top-4 z-50 inline-flex size-11 items-center justify-center border border-border/60 glass transition-[left,background-color]',
            'hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'rounded-r-2xl rounded-l-none border-l-0',
            open ? 'left-72' : 'left-0',
          )}
        >
          {open ? (
            <ChevronLeft className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
          <span className="sr-only">
            {active ? `Espaço atual: ${active.name}` : 'Espaços'}
          </span>
        </button>
      </IconTooltip>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          />
          <div
            id="workspace-rail-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Espaços"
            className="glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-3 rounded-r-3xl p-4 pt-20"
          >
            <WorkspaceRail
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelect={handleSelect}
              isLoading={isLoading}
              isError={isError}
              onRetry={onRetry}
            />
          </div>
        </>
      )}
    </>
  )
}
