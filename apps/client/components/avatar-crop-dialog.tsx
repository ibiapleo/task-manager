'use client'

import { useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Cropper, { type Area } from 'react-easy-crop'
import { ImagePlus, Loader2, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { getCroppedImageBlob } from '@/services/media/crop-image'
import { cn } from '@/lib/utils'

type Step = 'drop' | 'crop'

interface AvatarCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropped: (file: File) => void
}


export function AvatarCropDialog({
  open,
  onOpenChange,
  onCropped,
}: AvatarCropDialogProps) {
  const [step, setStep] = useState<Step>('drop')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const imageUrlRef = useRef(imageUrl)
  imageUrlRef.current = imageUrl
  const previewUrlRef = useRef(previewUrl)
  previewUrlRef.current = previewUrl

  function resetState() {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    setStep('drop')
    setImageUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setPreviewUrl(null)
  }

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function closeDialog() {
    resetState()
    onOpenChange(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: step !== 'drop',
    onDropRejected: () => {
      toast.error('Selecione um arquivo de imagem válido.')
    },
    onDrop: (accepted) => {
      const file = accepted[0]
      if (!file) return
      setImageUrl(URL.createObjectURL(file))
      setStep('crop')
    },
  })

  useEffect(() => {
    if (!imageUrl || !croppedAreaPixels) return
    let cancelled = false
    getCroppedImageBlob(imageUrl, croppedAreaPixels).then((blob) => {
      if (cancelled || !blob) return
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
    })
    return () => {
      cancelled = true
    }
  }, [imageUrl, croppedAreaPixels])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) closeDialog()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isProcessing])

  if (!open) return null

  async function handleConfirm() {
    if (!imageUrl || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageUrl, croppedAreaPixels)
      if (!blob) throw new Error('Canvas produced no blob.')
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      onCropped(file)
      closeDialog()
    } catch (err) {
      console.error('Avatar crop failed:', err)
      toast.error('Não foi possível recortar a imagem. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => !isProcessing && closeDialog()}
        className="absolute inset-0 cursor-default bg-background/40 backdrop-blur-sm"
      />
      <GlassCard
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="avatar-crop-title" className="text-lg font-semibold tracking-tight">
            {step === 'drop' ? 'Novo avatar' : 'Ajustar recorte'}
          </h2>
          <IconTooltip label="Fechar">
            <button
              type="button"
              aria-label="Fechar"
              disabled={isProcessing}
              onClick={closeDialog}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/60 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
            >
              <X className="size-4" />
            </button>
          </IconTooltip>
        </div>

        {step === 'drop' && (
          <div
            {...getRootProps()}
            className={cn(
              'mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-card/30 px-6 py-12 text-center transition',
              isDragActive && 'border-ring bg-card/60',
            )}
          >
            <input {...getInputProps()} />
            <span className="flex size-12 items-center justify-center rounded-full border border-border/50 bg-card/60">
              <ImagePlus className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">
              {isDragActive
                ? 'Solte a imagem aqui...'
                : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP.</p>
          </div>
        )}

        {step === 'crop' && imageUrl && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-black/60">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                aria-label="Zoom"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img
                  src={previewUrl}
                  alt="Preview do avatar recortado"
                  className="size-16 shrink-0 rounded-full border border-border/60 object-cover"
                />
              ) : (
                <span className="size-16 shrink-0 rounded-full border border-dashed border-border/60" />
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={resetState}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
              >
                <RotateCcw className="size-4" />
                Escolher outra
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={closeDialog}
                  className="inline-flex h-10 items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm font-medium transition active:scale-95 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:active:scale-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isProcessing || !croppedAreaPixels}
                  onClick={handleConfirm}
                  className={cn(
                    'inline-flex h-10 min-w-[8rem] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-95',
                    'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Usar esta foto'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
