'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Paperclip,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'
import type { AttachmentPreviewKind } from '@/lib/attachment'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { cn } from '@/lib/utils'

export interface LightboxAttachment {
  id: string
  url: string
  name: string
  kind: AttachmentPreviewKind
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

interface AttachmentLightboxProps {
  items: LightboxAttachment[]
  index: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onIndexChange: (index: number) => void
}

/**
 * Immersive attachment viewer rendered above the task details modal
 * (z-[100] portal). Independent open state — closing it never closes the
 * parent details form. PDFs use a lazy iframe mounted only while viewing
 * a PDF item.
 */
export function AttachmentLightbox({
  items,
  index,
  open,
  onOpenChange,
  onIndexChange,
}: AttachmentLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const current = items[index] ?? null
  const hasNav = items.length > 1

  useEffect(() => {
    setZoom(1)
  }, [index])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onOpenChange(false)
        return
      }
      if (!hasNav) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onIndexChange((index - 1 + items.length) % items.length)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onIndexChange((index + 1) % items.length)
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, hasNav, index, items.length, onIndexChange, onOpenChange])

  if (!open || !current) return null

  function close() {
    onOpenChange(false)
  }

  function goPrev() {
    onIndexChange((index - 1 + items.length) % items.length)
  }

  function goNext() {
    onIndexChange((index + 1) % items.length)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-md"
      />

      <GlassCard
        role="dialog"
        aria-modal="true"
        aria-label={current.name}
        className="relative z-10 flex h-[min(90vh,56rem)] w-full max-w-5xl flex-col overflow-hidden p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex shrink-0 items-center gap-3">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
            {current.name}
          </h2>
          {current.kind === 'image' && (
            <div className="flex items-center gap-1">
              <IconTooltip label="Diminuir zoom">
                <button
                  type="button"
                  aria-label="Diminuir zoom"
                  disabled={zoom <= MIN_ZOOM}
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)),
                    )
                  }
                  className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:active:scale-100"
                >
                  <ZoomOut className="size-4" />
                </button>
              </IconTooltip>
              <IconTooltip label="Aumentar zoom">
                <button
                  type="button"
                  aria-label="Aumentar zoom"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)),
                    )
                  }
                  className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:active:scale-100"
                >
                  <ZoomIn className="size-4" />
                </button>
              </IconTooltip>
              <button
                type="button"
                aria-label="Resetar zoom"
                onClick={() => setZoom(1)}
                className="hidden h-8 items-center rounded-full border border-border/60 px-2.5 text-xs font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
              >
                {Math.round(zoom * 100)}%
              </button>
            </div>
          )}
          <IconTooltip label="Baixar">
            <a
              href={current.url}
              download={current.name}
              target="_blank"
              rel="noreferrer"
              aria-label={`Baixar ${current.name}`}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-4" />
            </a>
          </IconTooltip>
          <IconTooltip label="Fechar">
            <button
              type="button"
              aria-label="Fechar"
              onClick={close}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </IconTooltip>
        </header>

        <div className="relative min-h-0 flex-1">
          {hasNav && (
            <>
              <IconTooltip label="Anterior" side="right">
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur transition active:scale-95 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="size-5" />
                </button>
              </IconTooltip>
              <IconTooltip label="Próximo" side="left">
                <button
                  type="button"
                  aria-label="Próximo"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur transition active:scale-95 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="size-5" />
                </button>
              </IconTooltip>
            </>
          )}

          <div
            className={cn(
              'flex h-full w-full items-center justify-center overflow-auto rounded-2xl border border-border/40 bg-black/30',
            )}
            onWheel={(e) => {
              if (current.kind !== 'image' || !(e.ctrlKey || e.metaKey)) return
              e.preventDefault()
              const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
              setZoom((z) =>
                Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))),
              )
            }}
          >
            {current.kind === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.name}
                className="max-h-full max-w-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            )}

            {current.kind === 'pdf' && (
              <iframe
                src={current.url}
                title={current.name}
                className="h-full min-h-[50vh] w-full rounded-2xl bg-card"
              />
            )}

            {current.kind === 'other' && (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card/60">
                  <Paperclip className="size-7 text-muted-foreground" />
                </span>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Pré-visualização indisponível para este tipo de arquivo.
                </p>
                <a
                  href={current.url}
                  download={current.name}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:opacity-90"
                >
                  <Download className="size-4" />
                  Baixar arquivo
                </a>
              </div>
            )}
          </div>
        </div>

        {hasNav && (
          <p className="mt-3 shrink-0 text-center text-xs text-muted-foreground">
            {index + 1} / {items.length}
          </p>
        )}
      </GlassCard>
    </div>,
    document.body,
  )
}

/** Small icon used when a gallery tile is not an image. */
export function AttachmentKindIcon({
  kind,
  className,
}: {
  kind: AttachmentPreviewKind
  className?: string
}) {
  if (kind === 'pdf') {
    return <FileText className={cn('size-10 text-muted-foreground', className)} />
  }
  return <Paperclip className={cn('size-10 text-muted-foreground', className)} />
}
