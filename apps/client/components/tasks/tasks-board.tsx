'use client'

import { useEffect, useState } from 'react'
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
import { useDeleteTask, useTasksQuery, useUpdateTask } from '@/hooks/use-tasks'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { KanbanColumn } from '@/components/tasks/kanban-column'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDetailsModal } from '@/components/tasks/task-details-modal'
import type { Task, TaskStatus } from '@/lib/types'

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function isStatus(id: string): id is TaskStatus {
  return (STATUSES as string[]).includes(id)
}

export function TasksBoard({
  viewMode,
  scope = 'personal',
  filters = {},
}: {
  viewMode: 'list' | 'kanban'
  scope?: 'personal' | 'all'
  filters?: TaskFilterInput
}) {
  const { data, isLoading, isError } = useTasksQuery(filters)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const showOwner = scope === 'all'

  const serverTasks = data?.data ?? []
  // Local buffer so Kanban drag can animate instantly. The API has no
  // manual ordering field, so only cross-column drops (a real status
  // change) get persisted via useUpdateTask - same-column position is
  // purely visual and resets on the next refetch.
  const [tasks, setTasks] = useState<Task[]>(serverTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Task | null>(null)
  const [detailsTask, setDetailsTask] = useState<Task | null>(null)

  useEffect(() => {
    setTasks(serverTasks)
    // Re-sync whenever the server list changes (refetch, filters, mutation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

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
                onDelete={(task) => setToDelete(task)}
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
              onDelete={() => setToDelete(task)}
              onOpen={() => setDetailsTask(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              Nenhuma tarefa ainda. Adicione a primeira acima.
            </div>
          )}
        </div>
      )}

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

      <TaskDetailsModal
        task={detailsTask}
        showOwner={showOwner}
        onOpenChange={(open) => !open && setDetailsTask(null)}
      />
    </>
  )
}
