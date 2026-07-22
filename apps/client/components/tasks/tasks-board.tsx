'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import type { TaskFilterInput } from '@task-manager/shared-types'
import {
  useDeleteTask,
  useDeleteTasks,
  useDuplicateTask,
  useTasksQuery,
  useUpdateTask,
  useUpdateTasks,
} from '@/hooks/use-tasks'
import { BatchActionsBar } from '@/components/tasks/batch-actions-bar'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { KanbanColumn } from '@/components/tasks/kanban-column'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDetailsModal } from '@/components/tasks/task-details-modal'
import { Pagination } from '@/components/ui/pagination'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import type { Priority, Task, TaskStatus } from '@/domain/types'

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function isStatus(id: string): id is TaskStatus {
  return (STATUSES as string[]).includes(id)
}

function filtersKey(filters: TaskFilterInput): string {
  return JSON.stringify(filters)
}

export function TasksBoard({
  viewMode,
  scope = 'personal',
  filters = {},
  onPageChange,
}: {
  viewMode: 'list' | 'kanban'
  scope?: 'personal' | 'all'
  filters?: TaskFilterInput
  onPageChange?: (page: number) => void
}) {
  const { data, isLoading, isError } = useTasksQuery(filters)
  const updateTask = useUpdateTask()
  const updateTasks = useUpdateTasks()
  const deleteTask = useDeleteTask()
  const deleteTasks = useDeleteTasks()
  const duplicateTask = useDuplicateTask()
  const showOwner = scope === 'all'
  const meta = data?.meta

  const serverTasks = data?.data ?? []

  const [tasks, setTasks] = useState<Task[]>(serverTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Task | null>(null)
  const [batchDeleteIds, setBatchDeleteIds] = useState<string[]>([])
  const [detailsTask, setDetailsTask] = useState<Task | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const filterKey = filtersKey(filters)

  useEffect(() => {
    setTasks(serverTasks)
  }, [data])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [viewMode, filterKey])

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev
      const visible = new Set(tasks.map((t) => t.id))
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (visible.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [tasks])

  useEffect(() => {
    if (viewMode !== 'list' || !meta || !onPageChange) return
    if (meta.totalPages === 0) return
    if (meta.page > meta.totalPages) {
      onPageChange(meta.totalPages)
    }
  }, [viewMode, meta, onPageChange])

  const visibleIds = tasks.map((t) => t.id)
  const selectedCount = selectedIds.size
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id))

  useEffect(() => {
    if (!selectAllRef.current) return
    selectAllRef.current.indeterminate =
      someVisibleSelected && !allVisibleSelected
  }, [someVisibleSelected, allVisibleSelected])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeTask = tasks.find((t) => t.id === activeId) ?? null

  function findContainer(id: string): TaskStatus | undefined {
    if (isStatus(id)) return id
    return tasks.find((t) => t.id === id)?.status
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overId = String(over.id)
    const activeContainer = findContainer(activeIdStr)
    const overContainer = isStatus(overId) ? overId : findContainer(overId)
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    )
      return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeIdStr ? { ...t, status: overContainer } : t,
      ),
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)

    const movedTask = tasks.find((t) => t.id === activeIdStr)
    const originalTask = serverTasks.find((t) => t.id === activeIdStr)
    if (
      movedTask &&
      originalTask &&
      movedTask.status !== originalTask.status
    ) {
      updateTask.mutate(
        { id: activeIdStr, patch: { status: movedTask.status } },
        {
          onError: () => {
            toast.error('Não foi possível mover a tarefa.')
            setTasks(serverTasks)
          },
        },
      )
    }
  }

  function handleSelectedChange(taskId: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(taskId)
      else next.delete(taskId)
      return next
    })
  }

  function handleSelectAllVisible(checked: boolean) {
    setSelectedIds(() => {
      if (!checked) return new Set()
      return new Set(visibleIds)
    })
  }

  const handleSelectColumn = useCallback(
    (status: TaskStatus, checked: boolean) => {
      setSelectedIds((prev) => {
        const columnIds = tasks
          .filter((task) => task.status === status)
          .map((task) => task.id)
        if (columnIds.length === 0) return prev

        const next = new Set(prev)
        let changed = false
        for (const id of columnIds) {
          if (checked) {
            if (!next.has(id)) {
              next.add(id)
              changed = true
            }
          } else if (next.delete(id)) {
            changed = true
          }
        }
        return changed ? next : prev
      })
    },
    [tasks],
  )

  async function handleBatchUpdate(
    patch: { status?: TaskStatus; priority?: Priority; dueDate?: string },
    successMessage: string,
  ) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await updateTasks.mutateAsync({ ids, ...patch })
      toast.success(successMessage)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar as tarefas.',
      )
    }
  }

  async function handleDuplicate(taskId: string) {
    try {
      await duplicateTask.mutateAsync(taskId)
      toast.success('Tarefa duplicada.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível duplicar a tarefa.',
      )
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
        Carregando tarefas...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-dashed border-destructive/50 p-10 text-center text-sm text-destructive">
        Não foi possível carregar as tarefas.
      </div>
    )
  }

  return (
    <>
      {tasks.length > 0 && (
        <div className="mb-3 flex items-center gap-2 px-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <IconTooltip label="Selecionar visíveis">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => handleSelectAllVisible(e.target.checked)}
                aria-label="Selecionar todas as tarefas visíveis"
                className="checkbox-circle"
              />
            </IconTooltip>
            Selecionar visíveis
          </label>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null)
            setTasks(serverTasks)
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                showOwner={showOwner}
                selectedIds={selectedIds}
                onSelectedChange={handleSelectedChange}
                onSelectColumn={(checked) =>
                  handleSelectColumn(status, checked)
                }
                onDelete={(task) => setToDelete(task)}
                onDuplicate={(task) => void handleDuplicate(task.id)}
                onOpen={(task) => setDetailsTask(task)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                variant="kanban"
                overlay
                showOwner={showOwner}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant="list"
              showOwner={showOwner}
              selected={selectedIds.has(task.id)}
              onSelectedChange={(selected) =>
                handleSelectedChange(task.id, selected)
              }
              onDelete={() => setToDelete(task)}
              onDuplicate={() => void handleDuplicate(task.id)}
              onOpen={() => setDetailsTask(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              Nenhuma tarefa ainda. Adicione a primeira acima.
            </div>
          )}
          {viewMode === 'list' && meta && onPageChange && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              itemLabel="tarefa"
              onPageChange={onPageChange}
              className="mt-3 self-center"
            />
          )}
        </div>
      )}

      <BatchActionsBar
        selectedCount={selectedCount}
        onStatusChange={(status) =>
          void handleBatchUpdate(
            { status },
            selectedCount === 1
              ? 'Status atualizado.'
              : `Status atualizado em ${selectedCount} tarefas.`,
          )
        }
        onPriorityChange={(priority) =>
          void handleBatchUpdate(
            { priority },
            selectedCount === 1
              ? 'Prioridade atualizada.'
              : `Prioridade atualizada em ${selectedCount} tarefas.`,
          )
        }
        onDueDateChange={(dueDate) =>
          void handleBatchUpdate(
            { dueDate },
            selectedCount === 1
              ? 'Data de vencimento atualizada.'
              : `Data atualizada em ${selectedCount} tarefas.`,
          )
        }
        onMarkCompleted={() =>
          void handleBatchUpdate(
            { status: 'COMPLETED' },
            selectedCount === 1
              ? 'Tarefa concluída.'
              : `${selectedCount} tarefas concluídas.`,
          )
        }
        onDelete={() => setBatchDeleteIds(Array.from(selectedIds))}
      />

      <ConfirmActionDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir tarefa?"
        description={
          toDelete
            ? `A tarefa "${toDelete.title}" será removida permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteTask.mutateAsync(toDelete.id)
            toast.success('Tarefa excluída.')
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Não foi possível excluir a tarefa.',
            )
            throw error
          }
        }}
      />

      <ConfirmActionDialog
        open={batchDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setBatchDeleteIds([])
        }}
        title={
          batchDeleteIds.length === 1
            ? 'Excluir 1 tarefa?'
            : `Excluir ${batchDeleteIds.length} tarefas?`
        }
        description={
          batchDeleteIds.length === 1
            ? 'A tarefa selecionada será removida permanentemente. Esta ação não pode ser desfeita.'
            : `As ${batchDeleteIds.length} tarefas selecionadas serão removidas permanentemente. Esta ação não pode ser desfeita.`
        }
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={async () => {
          const ids = batchDeleteIds
          if (ids.length === 0) return
          try {
            await deleteTasks.mutateAsync(ids)
            setSelectedIds(new Set())
            toast.success(
              ids.length === 1
                ? 'Tarefa excluída.'
                : `${ids.length} tarefas excluídas.`,
            )
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Não foi possível excluir as tarefas.',
            )
            throw error
          }
        }}
      />

      <TaskDetailsModal
        task={detailsTask}
        showOwner={showOwner}
        onOpenChange={(open) => !open && setDetailsTask(null)}
        onDuplicate={
          detailsTask
            ? () => void handleDuplicate(detailsTask.id)
            : undefined
        }
      />
    </>
  )
}
