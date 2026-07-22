'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  CreateTaskInputSchema,
  type CreateTaskInput,
} from '@task-manager/shared-types'
import { AttachmentList } from '@/components/tasks/attachment-list'
import { FileUploader } from '@/components/file-uploader'
import { useCreateTask } from '@/hooks/use-tasks'
import { useProfile } from '@/hooks/use-profile'
import { usePendingAttachments } from '@/hooks/use-pending-attachments'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { PillSelect } from '@/components/ui/pill-select'
import { STORAGE_BUCKETS, uploadTaskAttachments } from '@/services/storage/storage'
import type { Priority, TaskStatus } from '@/domain/types'
import { cn } from '@/lib/utils'

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

const DEFAULT_VALUES: CreateTaskInput = {
  title: '',
  description: '',
  dueDate: '',
  status: 'PENDING',
  priority: 'MEDIUM',
  attachments: [],
}

export function AddTaskDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: profile } = useProfile()
  const createTask = useCreateTask()
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
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskInputSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const attachments = watch('attachments') ?? []

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES)
      resetPendingFiles()
    }
  }, [open, reset, resetPendingFiles])

  function closeDialog() {
    resetPendingFiles()
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  async function onSubmit(values: CreateTaskInput) {
    let uploaded: { url: string; originalName: string }[] = []
    if (pendingFiles.length > 0 && profile) {
      setIsUploadingAttachments(true)
      try {
        uploaded = await uploadTaskAttachments(
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
      const payload: CreateTaskInput = {
        ...values,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        dueDate: values.dueDate || undefined,
        attachments: [...(values.attachments ?? []), ...uploaded],
      }
      await createTask.mutateAsync(payload)
      toast.success('Tarefa criada.')
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível criar a tarefa.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-hidden
        tabIndex={-1}
        onClick={closeDialog}
        className="absolute inset-0 cursor-default bg-background/40 backdrop-blur-sm"
      />
      <GlassCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between">
          <h2
            id="add-task-title"
            className="text-lg font-semibold tracking-tight"
          >
            Nova tarefa
          </h2>
          <IconTooltip label="Fechar">
            <button
              type="button"
              aria-label="Fechar"
              onClick={closeDialog}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </IconTooltip>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Título
            </label>
            <input
              id="task-title"
              autoFocus
              placeholder="O que precisa ser feito?"
              {...register('title')}
              className="h-11 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="task-desc" className="text-sm font-medium">
              Descrição
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Detalhes opcionais..."
              {...register('description')}
              className="w-full resize-none rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="task-due" className="text-sm font-medium">
              Data limite
            </label>
            <input
              id="task-due"
              type="date"
              {...register('dueDate')}
              className="h-11 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Status</span>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <PillSelect<TaskStatus>
                    label="Status"
                    value={field.value ?? 'PENDING'}
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
                    value={field.value ?? 'MEDIUM'}
                    options={PRIORITY_OPTIONS}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Anexos</span>
            <AttachmentList
              attachments={attachments}
              onRemove={(url) =>
                setValue(
                  'attachments',
                  attachments.filter((a) => a.url !== url),
                )
              }
              pending={pendingFiles}
              onRemovePending={removePendingFile}
            />
            {profile && (
              <FileUploader
                label="Adicionar anexo"
                disabled={isUploadingAttachments}
                onFileSelected={addPendingFile}
              />
            )}
          </div>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex h-10 items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending || isUploadingAttachments}
              className={cn(
                'inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95',
                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
              )}
            >
              {isUploadingAttachments
                ? 'Enviando anexos...'
                : createTask.isPending
                  ? 'Criando...'
                  : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
