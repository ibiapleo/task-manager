import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  FileCode2,
  FileText,
  FileType,
  Image as ImageIcon,
  Paperclip,
  Table2,
} from 'lucide-react'

export type AttachmentPreviewKind =
  | 'image'
  | 'pdf'
  | 'spreadsheet'
  | 'document'
  | 'archive'
  | 'text'
  | 'markdown'
  | 'other'

const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'avif',
  'bmp',
]
const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls', 'csv']
const DOCUMENT_EXTENSIONS = ['docx', 'doc']
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z']
const TEXT_EXTENSIONS = ['txt']
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd']

function extensionOf(nameOrUrl: string): string {
  return nameOrUrl.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''
}

function kindFromExtension(extension: string): AttachmentPreviewKind | null {
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image'
  if (extension === 'pdf') return 'pdf'
  if (SPREADSHEET_EXTENSIONS.includes(extension)) return 'spreadsheet'
  if (DOCUMENT_EXTENSIONS.includes(extension)) return 'document'
  if (ARCHIVE_EXTENSIONS.includes(extension)) return 'archive'
  if (MARKDOWN_EXTENSIONS.includes(extension)) return 'markdown'
  if (TEXT_EXTENSIONS.includes(extension)) return 'text'
  return null
}

function kindFromMime(mimeType: string): AttachmentPreviewKind | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (
    mimeType === 'text/csv' ||
    mimeType === 'application/csv' ||
    mimeType.includes('spreadsheet') ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'spreadsheet'
  }
  if (
    mimeType.includes('wordprocessingml') ||
    mimeType === 'application/msword'
  ) {
    return 'document'
  }
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed' ||
    mimeType === 'application/vnd.rar' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed'
  ) {
    return 'archive'
  }
  if (
    mimeType === 'text/markdown' ||
    mimeType === 'text/x-markdown' ||
    mimeType === 'application/markdown'
  ) {
    return 'markdown'
  }
  if (mimeType === 'text/plain') return 'text'
  return null
}

export function resolvePreviewKind(
  mimeType: string | undefined,
  nameOrUrl: string,
): AttachmentPreviewKind {
  const fromExt = kindFromExtension(extensionOf(nameOrUrl))
  if (fromExt === 'markdown') return 'markdown'

  if (mimeType) {
    const fromMime = kindFromMime(mimeType)
    if (fromMime) return fromMime
  }

  return fromExt ?? 'other'
}

/** Types with a rich in-app lightbox preview (gallery hint “Clique para visualizar”). */
export function isLightboxPreviewable(kind: AttachmentPreviewKind): boolean {
  return kind === 'image' || kind === 'pdf' || kind === 'markdown'
}

/** Types that may attempt a plain-text preview fetch in the lightbox. */
export function canAttemptTextPreview(
  kind: AttachmentPreviewKind,
  nameOrUrl: string,
): boolean {
  if (kind === 'text' || kind === 'markdown') return true
  if (kind === 'spreadsheet' && extensionOf(nameOrUrl) === 'csv') return true
  return false
}

export interface AttachmentKindMeta {
  label: string
  Icon: LucideIcon
  iconClass: string
  tileClass: string
  galleryHint: string
  unavailableMessage: string
}

export function attachmentKindMeta(
  kind: AttachmentPreviewKind,
): AttachmentKindMeta {
  switch (kind) {
    case 'image':
      return {
        label: 'Imagem',
        Icon: ImageIcon,
        iconClass: 'text-orange-500',
        tileClass: 'bg-orange-500/10',
        galleryHint: 'Clique para visualizar',
        unavailableMessage: '',
      }
    case 'pdf':
      return {
        label: 'PDF',
        Icon: FileText,
        iconClass: 'text-blue-500',
        tileClass: 'bg-blue-500/10',
        galleryHint: 'Clique para visualizar',
        unavailableMessage: '',
      }
    case 'spreadsheet':
      return {
        label: 'Planilha',
        Icon: Table2,
        iconClass: 'text-emerald-500',
        tileClass: 'bg-emerald-500/10',
        galleryHint: 'Baixar / abrir',
        unavailableMessage:
          'Planilhas não são renderizadas no navegador. Baixe o arquivo para abrir no Excel, Sheets ou app equivalente.',
      }
    case 'document':
      return {
        label: 'Documento',
        Icon: FileType,
        iconClass: 'text-blue-500',
        tileClass: 'bg-blue-500/10',
        galleryHint: 'Baixar / abrir',
        unavailableMessage:
          'Documentos Word não são renderizados no navegador. Baixe o arquivo para abrir no Word ou app equivalente.',
      }
    case 'archive':
      return {
        label: 'Compactado',
        Icon: Archive,
        iconClass: 'text-violet-500',
        tileClass: 'bg-violet-500/10',
        galleryHint: 'Baixar / abrir',
        unavailableMessage:
          'Arquivos compactados precisam ser baixados e extraídos no seu dispositivo.',
      }
    case 'text':
      return {
        label: 'Texto',
        Icon: FileText,
        iconClass: 'text-sky-500',
        tileClass: 'bg-sky-500/10',
        galleryHint: 'Baixar / abrir',
        unavailableMessage:
          'Não foi possível pré-visualizar este arquivo de texto. Baixe para abrir no editor preferido.',
      }
    case 'markdown':
      return {
        label: 'Markdown',
        Icon: FileCode2,
        iconClass: 'text-teal-500',
        tileClass: 'bg-teal-500/10',
        galleryHint: 'Clique para visualizar',
        unavailableMessage:
          'Não foi possível pré-visualizar este Markdown. Baixe para abrir no editor preferido.',
      }
    default:
      return {
        label: 'Arquivo',
        Icon: Paperclip,
        iconClass: 'text-muted-foreground',
        tileClass: 'bg-muted/40',
        galleryHint: 'Baixar / abrir',
        unavailableMessage:
          'Pré-visualização indisponível para este tipo de arquivo.',
      }
  }
}

export function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return pathname.split('/').pop() || url
  } catch {
    return url
  }
}
