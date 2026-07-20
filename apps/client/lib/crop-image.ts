import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/**
 * Renders the selected `react-easy-crop` area of `imageSrc` onto an
 * offscreen canvas and resolves a JPEG `Blob` of just that region - used
 * both for the crop dialog's live "final result" preview and for producing
 * the file that eventually gets uploaded (see components/avatar-crop-dialog.tsx).
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  area: Area,
): Promise<Blob | null> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(area.width))
  canvas.height = Math.max(1, Math.round(area.height))

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
  })
}
