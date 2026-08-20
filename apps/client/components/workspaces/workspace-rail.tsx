'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkspaceResponse } from '@task-manager/shared-types'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { WorkspaceFormDialog } from '@/components/workspaces/workspace-form-dialog'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useRenameWorkspace,
} from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

export interface WorkspaceRailProps {
  workspaces: WorkspaceResponse[]
  activeWorkspaceId?: string
  onSelect: (id: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
}

export function WorkspaceRail({
  workspaces,
  activeWorkspaceId,
  onSelect,
  isLoading = false,
  isError = false,
  onRetry,
  className,
}: WorkspaceRailProps) {
  const createWorkspace = useCreateWorkspace()
  const renameWorkspace = useRenameWorkspace()
  const deleteWorkspace = useDeleteWorkspace()
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<WorkspaceResponse | null>(null)
  const [deleting, setDeleting] = useState<WorkspaceResponse | null>(null)

  const canDelete = workspaces.length > 1

  async function handleCreate(name: string) {
    const created = await createWorkspace.mutateAsync({ name })
    toast.success('Espaço criado.')
    onSelect(created.id)
  }

  async function handleRename(name: string) {
    if (!renaming) return
    await renameWorkspace.mutateAsync({
      id: renaming.id,
      patch: { name },
    })
    toast.success('Espaço renomeado.')
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteWorkspace.mutateAsync(deleting.id)
      toast.success('Espaço excluído.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o espaço.',
      )
      throw error
    }
  }

  return (
    <>
      <nav
        aria-label="Espaços"
        className={cn('flex flex-col gap-1', className)}
      >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Espaços
            </p>
            <IconTooltip label="Novo espaço">
              <button
                type="button"
                aria-label="Novo espaço"
                onClick={() => setCreating(true)}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4" />
              </button>
            </IconTooltip>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-2 px-1" aria-hidden>
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-full bg-card/60"
                />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="flex flex-col items-start gap-2 px-2 py-3">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar seus espaços.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}

          {!isLoading && !isError && workspaces.length === 0 && (
            <div className="flex flex-col items-start gap-2 px-2 py-3">
              <p className="text-sm text-muted-foreground">
                Você ainda não tem um espaço.
              </p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Criar meu primeiro espaço
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId
              return (
                <div
                  key={workspace.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-full pr-1',
                    active && 'bg-primary text-primary-foreground',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(workspace.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{workspace.name}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-1.5 text-[11px] font-medium',
                        active
                          ? 'bg-primary-foreground/15'
                          : 'bg-card/70 text-muted-foreground',
                      )}
                    >
                      {workspace.taskCount}
                    </span>
                  </button>
                  <IconTooltip label="Renomear">
                    <button
                      type="button"
                      aria-label={`Renomear ${workspace.name}`}
                      onClick={() => setRenaming(workspace)}
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'hover:bg-primary-foreground/15'
                          : 'hover:bg-card/70',
                      )}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </IconTooltip>
                  {canDelete && (
                    <IconTooltip label="Excluir">
                      <button
                        type="button"
                        aria-label={`Excluir ${workspace.name}`}
                        onClick={() => setDeleting(workspace)}
                        className={cn(
                          'inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          active
                            ? 'hover:bg-primary-foreground/15'
                            : 'hover:bg-card/70',
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </IconTooltip>
                  )}
                </div>
              )
            })}
      </nav>

      <WorkspaceFormDialog
        open={creating}
        mode="create"
        onOpenChange={setCreating}
        onSubmit={handleCreate}
      />
      <WorkspaceFormDialog
        open={!!renaming}
        mode="rename"
        initialName={renaming?.name}
        onOpenChange={(open) => {
          if (!open) setRenaming(null)
        }}
        onSubmit={handleRename}
      />
      <ConfirmActionDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={`Excluir o espaço “${deleting?.name ?? ''}”?`}
        description={
          deleting
            ? deleting.taskCount === 1
              ? 'Isso vai excluir 1 tarefa. Esta ação não pode ser desfeita.'
              : `Isso vai excluir ${deleting.taskCount} tarefas. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir espaço"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
