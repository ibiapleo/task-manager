'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  UpdateTaskInputSchema,
  type TaskResponse,
  type UpdateTaskInput,
} from '@task-manager/shared-types'
import { AttachmentList } from '@/components/tasks/attachment-list'
import { FileUploader } from '@/components/file-uploader'
import { useUpdateTask } from '@/hooks/use-tasks'
import { useProfile } from '@/hooks/use-profile'
import { usePendingAttachments } from '@/hooks/use-pending-attachments'
import { useFormattedDate } from '@/hooks/use-formatted-date'
import { GlassCard } from '@/components/ui/glass'
import { PillSelect } from '@/components/ui/pill-select'
import { STORAGE_BUCKETS, uploadFiles } from '@/lib/storage'
import type { Priority, TaskStatus } from '@/lib/types'
import { STATUS_META } from '@/lib/types'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user-avatar'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'COMPLETED', label: 'Concluído' },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
]

const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent/15 text-accent',
  COMPLETED: 'bg-success/15 text-success',
}

function toFormValues(task: TaskResponse): UpdateTaskInput {
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    status: task.status,
    priority: task.priority,
    attachments: task.attachments.map((a) => a.url),
  }
}

/**
 * Wide Jira-style details / edit modal. Distinct from AddTaskDialog (create
 * only). Attachments stay local until "Salvar" — then upload to
 * STORAGE_BUCKETS.tasks and PATCH.
 */
export function TaskDetailsModal({
  task,
  onOpenChange,
  showOwner = false,
}: {
  task: TaskResponse | null
  onOpenChange: (open: boolean) => void
  showOwner?: boolean
}) {
  const { data: profile } = useProfile()
  const updateTask = useUpdateTask()
  const {
    pending: pendingFiles,
    add: addPendingFile,
    removeAt: removePendingFile,
    reset: resetPendingFiles,
  } = usePendingAttachments()
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(UpdateTaskInputSchema),
    defaultValues: task ? toFormValues(task) : {},
  })

  const attachments = watch('attachments') ?? []
  const watchedStatus = watch('status') ?? task?.status ?? 'PENDING'
  const watchedDueDate = watch('dueDate')
  const dueLabel = useFormattedDate(
    watchedDueDate || task?.dueDate || null,
  )

  useEffect(() => {
    if (task) {
      reset(toFormValues(task))
      resetPendingFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, reset])

  function closeDialog() {
    resetPendingFiles()
    onOpenChange(false)
  }

  useEffect(() => {
    if (!task) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  if (!task) return null

  const activeTask = task
  const busy = updateTask.isPending || isUploadingAttachments

  async function onSubmit(values: UpdateTaskInput) {
    let uploadedUrls: string[] = []
    if (pendingFiles.length > 0 && profile) {
      setIsUploadingAttachments(true)
      try {
        uploadedUrls = await uploadFiles(
          STORAGE_BUCKETS.tasks,
          profile.id,
          pendingFiles.map((p) => p.file),
        )
      } catch (err) {
        console.error('Attachment upload failed:', err)
        toast.error('Erro ao enviar arquivo. Tente novamente.')
        return
      } finally {
        setIsUploadingAttachments(false)
      }
    }

    try {
      const payload: UpdateTaskInput = {
        ...values,
        title: values.title?.trim(),
        description: values.description?.trim() || undefined,
        dueDate: values.dueDate || undefined,
        attachments: [...(values.attachments ?? []), ...uploadedUrls],
      }
      await updateTask.mutateAsync({ id: activeTask.id, patch: payload })
      toast.success('Tarefa atualizada.')
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a tarefa.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => !busy && closeDialog()}
        className="absolute inset-0 cursor-default bg-background/40 backdrop-blur-sm"
      />
      <GlassCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Detalhes da tarefa
          </p>
          <button
            type="button"
            aria-label="Fechar"
            disabled={busy}
            onClick={closeDialog}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 flex flex-col gap-6"
        >
          <section className="flex flex-col gap-3">
            <label htmlFor="task-details-title" className="sr-only">
              Título
            </label>
            <input
              id="task-details-title"
              autoFocus
              {...register('title')}
              className="w-full border-0 bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-3xl"
              placeholder="Título da tarefa"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
            <label htmlFor="task-details-desc" className="sr-only">
              Descrição
            </label>
            <textarea
              id="task-details-desc"
              rows={5}
              {...register('description')}
              placeholder="Adicione uma descrição..."
              className="w-full resize-none rounded-2xl border border-border/40 bg-card/30 px-4 py-3 text-sm leading-relaxed outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                STATUS_BADGE_STYLES[watchedStatus],
              )}
            >
              {STATUS_META[watchedStatus].label}
            </span>
            {dueLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {dueLabel}
              </span>
            )}
            {showOwner && activeTask.user && (
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/50 bg-card/40 py-1 pr-3 pl-1 text-xs font-medium text-foreground"
                aria-label={`Responsável: ${activeTask.user.name?.trim() || 'Sem nome'}`}
              >
                <UserAvatar
                  profile={{
                    name: activeTask.user.name,
                    avatarUrl: activeTask.user.avatarUrl,
                  }}
                  size="sm"
                  className="size-6 text-[10px]"
                />
                <span className="truncate">
                  {activeTask.user.name?.trim() || 'Sem nome'}
                </span>
              </span>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Status</span>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <PillSelect<TaskStatus>
                    label="Status"
                    value={field.value ?? activeTask.status}
                    options={STATUS_OPTIONS}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Prioridade</span>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <PillSelect<Priority>
                    label="Prioridade"
                    value={field.value ?? activeTask.priority}
                    options={PRIORITY_OPTIONS}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="task-details-due" className="text-sm font-medium">
                Data limite
              </label>
              <input
                id="task-details-due"
                type="date"
                {...register('dueDate')}
                className="h-10 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight">Anexos</h3>
            <AttachmentList
              variant="gallery"
              urls={attachments}
              onRemove={(url) =>
                setValue(
                  'attachments',
                  attachments.filter((a) => a !== url),
                )
              }
              pending={pendingFiles}
              onRemovePending={removePendingFile}
            />
            {profile && (
              <FileUploader
                label="Adicionar anexo"
                disabled={busy}
                onFileSelected={addPendingFile}
              />
            )}
          </section>

          <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={closeDialog}
              className="inline-flex h-10 items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cn(
                'inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95',
                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
              )}
            >
              {isUploadingAttachments
                ? 'Enviando anexos...'
                : updateTask.isPending
                  ? 'Salvando...'
                  : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
