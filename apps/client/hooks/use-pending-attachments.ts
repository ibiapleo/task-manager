'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface PendingAttachment {
  file: File
  previewUrl: string
}

export function usePendingAttachments() {
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const add = useCallback((file: File) => {
    setPending((prev) => [
      ...prev,
      { file, previewUrl: URL.createObjectURL(file) },
    ])
  }, [])

  const removeAt = useCallback((index: number) => {
    setPending((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const reset = useCallback(() => {
    pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPending([])
  }, [])

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [])

  return { pending, add, removeAt, reset }
}
