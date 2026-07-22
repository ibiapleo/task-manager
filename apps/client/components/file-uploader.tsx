'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  accept?: string
  label?: string
  disabled?: boolean
  onFileSelected: (file: File) => void
  className?: string
}

export function FileUploader({
  accept,
  label = 'Selecionar arquivo',
  disabled,
  onFileSelected,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(files: FileList | null) {
    const file = files?.[0]
    if (file) onFileSelected(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-border/60 bg-card/40 px-4 text-sm font-medium text-muted-foreground transition hover:bg-card/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:active:scale-100"
      >
        <Upload className="size-4" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleChange(e.target.files)}
      />
    </div>
  )
}
