'use client'

import { useMemo, useState } from 'react'
import { FileText, Paperclip, X } from 'lucide-react'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import {
  AttachmentKindIcon,
  AttachmentLightbox,
  type LightboxAttachment,
} from '@/components/tasks/attachment-lightbox'
import type { PendingAttachment } from '@/hooks/use-pending-attachments'
import {
  fileNameFromUrl,
  resolvePreviewKind,
  type AttachmentPreviewKind,
} from '@/lib/attachment'
import { cn } from '@/lib/utils'

interface AttachmentItem extends LightboxAttachment {
  pendingIndex?: number
}

function buildItems(
  urls: string[],
  pending: PendingAttachment[],
): AttachmentItem[] {
  const remote: AttachmentItem[] = urls.map((url) => ({
    id: `remote-${url}`,
    url,
    name: fileNameFromUrl(url),
    kind: resolvePreviewKind(undefined, url),
  }))
  const local: AttachmentItem[] = pending.map((item, index) => ({
    id: `pending-${item.previewUrl}`,
    url: item.previewUrl,
    name: item.file.name,
    kind: resolvePreviewKind(item.file.type, item.file.name),
    pendingIndex: index,
  }))
  return [...remote, ...local]
}

function CompactThumb({
  previewKind,
  src,
}: {
  previewKind: AttachmentPreviewKind
  src: string
}) {
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
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/60">
      {previewKind === 'pdf' ? (
        <FileText className="size-4 text-muted-foreground" />
      ) : (
        <Paperclip className="size-3.5 text-muted-foreground" />
      )}
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

  return (
    <li className="group/tile relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex w-full flex-col gap-2 rounded-2xl text-left transition active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <span
          className={cn(
            'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card/40',
            isPending && 'border-dashed',
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
        <span className="line-clamp-2 px-0.5 text-xs font-medium leading-snug text-muted-foreground">
          {item.name}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remover ${item.name}`}
        onClick={(e) => {
          e.stopPropagation()
          onRequestRemove()
        }}
        className={cn(
          'absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground opacity-0 shadow transition',
          'hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
          'group-hover/tile:opacity-100 group-focus-within/tile:opacity-100',
        )}
      >
        <X className="size-3.5" />
      </button>
    </li>
  )
}

export function AttachmentList({
  urls,
  onRemove,
  pending = [],
  onRemovePending,
  variant = 'list',
}: {
  /** Remote attachments already persisted on the task/profile. */
  urls: string[]
  onRemove: (url: string) => void
  /** Picked locally, not uploaded yet - only sent to the API on submit. */
  pending?: PendingAttachment[]
  onRemovePending?: (index: number) => void
  /** `gallery` = large preview grid + LightBox (TaskDetailsModal). */
  variant?: 'list' | 'gallery'
}) {
  const items = useMemo(() => buildItems(urls, pending), [urls, pending])
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
        {urls.map((url) => (
          <li
            key={url}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm"
          >
            <CompactThumb
              previewKind={resolvePreviewKind(undefined, url)}
              src={url}
            />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate underline-offset-2 hover:underline"
            >
              {fileNameFromUrl(url)}
            </a>
            <button
              type="button"
              aria-label={`Remover ${fileNameFromUrl(url)}`}
              onClick={() =>
                setToRemove({
                  id: `remote-${url}`,
                  url,
                  name: fileNameFromUrl(url),
                  kind: resolvePreviewKind(undefined, url),
                })
              }
              className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
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
            )}
          </li>
        ))}
      </ul>
      {confirmDialog}
    </>
  )
}
