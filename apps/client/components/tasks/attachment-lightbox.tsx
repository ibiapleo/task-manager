'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'
import {
  attachmentKindMeta,
  canAttemptTextPreview,
  type AttachmentPreviewKind,
} from '@/lib/attachment'
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
const TEXT_PREVIEW_LIMIT = 80_000

interface AttachmentLightboxProps {
  items: LightboxAttachment[]
  index: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onIndexChange: (index: number) => void
}

function DownloadFallbackPanel({
  item,
}: {
  item: LightboxAttachment
}) {
  const meta = attachmentKindMeta(item.kind)
  const Icon = meta.Icon

  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <span
        className={cn(
          'flex size-16 items-center justify-center rounded-2xl border border-border/50',
          meta.tileClass,
        )}
      >
        <Icon className={cn('size-7', meta.iconClass)} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{meta.label}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {meta.unavailableMessage}
        </p>
      </div>
      <a
        href={item.url}
        download={item.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:opacity-90"
      >
        <Download className="size-4" />
        Baixar arquivo
      </a>
    </div>
  )
}

function useFetchedText(url: string) {
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setText(null)

    async function load() {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('fetch failed')
        const body = await response.text()
        if (cancelled) return
        setText(
          body.length > TEXT_PREVIEW_LIMIT
            ? `${body.slice(0, TEXT_PREVIEW_LIMIT)}\n\n… (conteúdo truncado)`
            : body,
        )
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [url])

  return { text, failed, loading }
}

function TextPreviewPanel({ item }: { item: LightboxAttachment }) {
  const { text, failed, loading } = useFetchedText(item.url)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Carregando pré-visualização…
      </div>
    )
  }

  if (failed || text === null) {
    return <DownloadFallbackPanel item={item} />
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-4">
      <p className="shrink-0 text-xs text-muted-foreground">
        Pré-visualização de texto. Use Baixar para o arquivo completo.
      </p>
      <pre className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border/50 bg-card/60 p-4 text-left text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {text}
      </pre>
      <a
        href={item.url}
        download={item.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:opacity-90"
      >
        <Download className="size-4" />
        Baixar arquivo
      </a>
    </div>
  )
}

function MarkdownPreviewPanel({ item }: { item: LightboxAttachment }) {
  const { text, failed, loading } = useFetchedText(item.url)
  const [mode, setMode] = useState<'preview' | 'source'>('preview')

  useEffect(() => {
    setMode('preview')
  }, [item.url])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Carregando pré-visualização…
      </div>
    )
  }

  if (failed || text === null) {
    return <DownloadFallbackPanel item={item} />
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Modo de visualização Markdown"
          className="inline-flex rounded-full border border-border/60 bg-card/50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={() => setMode('preview')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              mode === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pré-visualização
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'source'}
            onClick={() => setMode('source')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              mode === 'source'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Código
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use Baixar para o arquivo completo.
        </p>
      </div>

      {mode === 'preview' ? (
        <article className="markdown-preview min-h-0 flex-1 overflow-auto rounded-2xl border border-border/50 bg-card/60 p-4 text-left text-sm leading-relaxed text-foreground">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-4 text-xl font-semibold tracking-tight first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
                  {children}
                </blockquote>
              ),
              code: ({ className, children }) => {
                const isBlock = Boolean(className)
                if (isBlock) {
                  return (
                    <code className="block overflow-x-auto rounded-xl bg-black/30 p-3 font-mono text-xs leading-relaxed">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[0.85em]">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="mb-3 overflow-x-auto rounded-xl last:mb-0">
                  {children}
                </pre>
              ),
              hr: () => <hr className="my-4 border-border/60" />,
              table: ({ children }) => (
                <div className="mb-3 overflow-x-auto last:mb-0">
                  <table className="w-full border-collapse text-left text-xs">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border/50 bg-muted/40 px-2 py-1.5 font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border/50 px-2 py-1.5">{children}</td>
              ),
              img: ({ src, alt }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt ?? ''}
                  className="my-3 max-h-80 max-w-full rounded-xl object-contain"
                />
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </article>
      ) : (
        <pre className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border/50 bg-card/60 p-4 text-left font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {text}
        </pre>
      )}

      <a
        href={item.url}
        download={item.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95 hover:opacity-90"
      >
        <Download className="size-4" />
        Baixar arquivo
      </a>
    </div>
  )
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
  const showImage = current?.kind === 'image'
  const showPdf = current?.kind === 'pdf'
  const showMarkdown = current?.kind === 'markdown'
  const showTextPreview =
    !!current &&
    !showMarkdown &&
    canAttemptTextPreview(current.kind, current.name)
  const showFallback =
    !!current && !showImage && !showPdf && !showMarkdown && !showTextPreview

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
            {showImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.name}
                className="max-h-full max-w-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            )}

            {showPdf && (
              <iframe
                src={current.url}
                title={current.name}
                className="h-full min-h-[50vh] w-full rounded-2xl bg-card"
              />
            )}

            {showMarkdown && <MarkdownPreviewPanel item={current} />}

            {showTextPreview && <TextPreviewPanel item={current} />}

            {showFallback && <DownloadFallbackPanel item={current} />}
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

/** Colored icon used when a gallery tile is not an image thumbnail. */
export function AttachmentKindIcon({
  kind,
  className,
  size = 'lg',
}: {
  kind: AttachmentPreviewKind
  className?: string
  size?: 'sm' | 'lg'
}) {
  const meta = attachmentKindMeta(kind)
  const Icon = meta.Icon
  return (
    <Icon
      className={cn(
        size === 'lg' ? 'size-10' : 'size-4',
        meta.iconClass,
        className,
      )}
    />
  )
}
