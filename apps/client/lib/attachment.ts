export type AttachmentPreviewKind = 'image' | 'pdf' | 'other'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']

function extensionOf(nameOrUrl: string): string {
  return nameOrUrl.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''
}

/**
 * Best-effort MIME classification, used purely for choosing a preview
 * widget (thumbnail vs. icon). Prefers the real `File.type` when available
 * (local, not-yet-uploaded picks) and falls back to the file extension
 * (remote URLs, where we only have the string persisted by the API).
 */
export function resolvePreviewKind(
  mimeType: string | undefined,
  nameOrUrl: string,
): AttachmentPreviewKind {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'

  const extension = extensionOf(nameOrUrl)
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image'
  if (extension === 'pdf') return 'pdf'
  return 'other'
}

export function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return pathname.split('/').pop() || url
  } catch {
    return url
  }
}
