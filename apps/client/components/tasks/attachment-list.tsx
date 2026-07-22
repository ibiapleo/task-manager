'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import {
  AttachmentKindIcon,
  AttachmentLightbox,
  type LightboxAttachment,
} from '@/components/tasks/attachment-lightbox'
import type { PendingAttachment } from '@/hooks/use-pending-attachments'
import {
  attachmentKindMeta,
  isLightboxPreviewable,
  resolvePreviewKind,
  type AttachmentPreviewKind,
} from '@/services/tasks/attachment'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { cn } from '@/lib/utils'

export interface RemoteAttachmentRef {
  url: string
  originalName: string
}

interface AttachmentItem extends LightboxAttachment {
  pendingIndex?: number
}

function displayName(attachment: RemoteAttachmentRef): string {
  const name = attachment.originalName.trim()
  return name || 'Arquivo'
}

function buildItems(
  remote: RemoteAttachmentRef[],
  pending: PendingAttachment[],
): AttachmentItem[] {
  const remoteItems: AttachmentItem[] = remote.map((attachment) => {
    const name = displayName(attachment)
    return {
      id: `remote-${attachment.url}`,
      url: attachment.url,
      name,
      kind: resolvePreviewKind(undefined, name),
    }
  })
  const local: AttachmentItem[] = pending.map((item, index) => ({
    id: `pending-${item.previewUrl}`,
    url: item.previewUrl,
    name: item.file.name,
    kind: resolvePreviewKind(item.file.type, item.file.name),
    pendingIndex: index,
  }))
  return [...remoteItems, ...local]
}

function CompactThumb({
  previewKind,
  src,
}: {
  previewKind: AttachmentPreviewKind
  src: string
}) {
  const meta = attachmentKindMeta(previewKind)

  if (previewKind === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-lg border border-border/40 object-cover"
      />
    )
  }

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/40',
        meta.tileClass,
      )}
    >
      <AttachmentKindIcon kind={previewKind} size="sm" />
    </span>
  )
}

function GalleryTile({
  item,
  onOpen,
  onRequestRemove,
}: {
  item: AttachmentItem
  onOpen: () => void
  onRequestRemove: () => void
}) {
  const isPending = item.pendingIndex !== undefined
  const meta = attachmentKindMeta(item.kind)
  const previewable = isLightboxPreviewable(item.kind)

  return (
    <li className="group/tile relative min-w-0">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'glass flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 text-left transition active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isPending && 'border-dashed',
        )}
      >
        <span
          className={cn(
            'relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden',
            item.kind === 'image' ? 'bg-card/40' : meta.tileClass,
          )}
        >
          {item.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <AttachmentKindIcon kind={item.kind} />
          )}
          {isPending && (
            <span className="absolute left-2 top-2 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
              Novo
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-col gap-1 border-t border-border/40 bg-card/30 px-3 py-2.5">
          <span
            className={cn(
              'truncate text-[10px] font-medium',
              previewable ? 'text-foreground/80' : 'text-muted-foreground',
            )}
          >
            {meta.galleryHint}
          </span>
          <span className="truncate text-xs font-semibold tracking-tight text-foreground">
            {item.name}
          </span>
          <span className={cn('truncate text-[10px] font-medium', meta.iconClass)}>
            {meta.label}
          </span>
        </span>
      </button>

      <IconTooltip label="Remover">
        <button
          type="button"
          aria-label={`Remover ${item.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onRequestRemove()
          }}
          className={cn(
            'absolute top-2 right-2 z-10 inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground opacity-0 shadow transition',
            'hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
            'group-hover/tile:opacity-100 group-focus-within/tile:opacity-100',
          )}
        >
          <X className="size-3.5" />
        </button>
      </IconTooltip>
    </li>
  )
}

export function AttachmentList({
  attachments,
  onRemove,
  pending = [],
  onRemovePending,
  variant = 'list',
}: {
  attachments: RemoteAttachmentRef[]
  onRemove: (url: string) => void
  pending?: PendingAttachment[]
  onRemovePending?: (index: number) => void
  variant?: 'list' | 'gallery'
}) {
  const items = useMemo(
    () => buildItems(attachments, pending),
    [attachments, pending],
  )
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [toRemove, setToRemove] = useState<AttachmentItem | null>(null)

  if (items.length === 0) return null

  function openAt(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function applyRemoval(item: AttachmentItem) {
    if (item.pendingIndex !== undefined) {
      onRemovePending?.(item.pendingIndex)
      return
    }
    onRemove(item.url)
  }

  const confirmDialog = (
    <ConfirmActionDialog
      open={!!toRemove}
      onOpenChange={(open) => {
        if (!open) setToRemove(null)
      }}
      title="Remover anexo?"
      description={
        toRemove
          ? `O arquivo "${toRemove.name}" será removido da lista de anexos desta tarefa.`
          : undefined
      }
      variant="destructive"
      confirmLabel="Remover"
      onConfirm={async () => {
        if (!toRemove) return
        applyRemoval(toRemove)
      }}
    />
  )

  if (variant === 'gallery') {
    return (
      <>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <GalleryTile
              key={item.id}
              item={item}
              onOpen={() => openAt(index)}
              onRequestRemove={() => setToRemove(item)}
            />
          ))}
        </ul>
        <AttachmentLightbox
          items={items}
          index={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={setLightboxIndex}
        />
        {confirmDialog}
      </>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {attachments.map((attachment) => {
          const name = displayName(attachment)
          return (
            <li
              key={attachment.url}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm"
            >
              <CompactThumb
                previewKind={resolvePreviewKind(undefined, name)}
                src={attachment.url}
              />
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                download={name}
                className="min-w-0 flex-1 truncate underline-offset-2 hover:underline"
              >
                {name}
              </a>
              <IconTooltip label="Remover">
                <button
                  type="button"
                  aria-label={`Remover ${name}`}
                  onClick={() =>
                    setToRemove({
                      id: `remote-${attachment.url}`,
                      url: attachment.url,
                      name,
                      kind: resolvePreviewKind(undefined, name),
                    })
                  }
                  className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </IconTooltip>
            </li>
          )
        })}
        {pending.map((item, index) => (
          <li
            key={item.previewUrl}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/25 px-3 py-2 text-sm"
          >
            <CompactThumb
              previewKind={resolvePreviewKind(item.file.type, item.file.name)}
              src={item.previewUrl}
            />
            <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Novo
            </span>
            {onRemovePending && (
              <IconTooltip label="Remover">
                <button
                  type="button"
                  aria-label={`Remover ${item.file.name}`}
                  onClick={() =>
                    setToRemove({
                      id: `pending-${item.previewUrl}`,
                      url: item.previewUrl,
                      name: item.file.name,
                      kind: resolvePreviewKind(item.file.type, item.file.name),
                      pendingIndex: index,
                    })
                  }
                  className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </IconTooltip>
            )}
          </li>
        ))}
      </ul>
      {confirmDialog}
    </>
  )
}
