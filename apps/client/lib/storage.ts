import { supabase } from '@/lib/supabase-client'

/** Actual bucket names configured in the Supabase project - keep in sync with the dashboard. */
export const STORAGE_BUCKETS = {
  avatars: 'profile-avatars',
  tasks: 'tasks',
} as const

/**
 * Result of a task attachment upload. The storage object key is an opaque
 * UUID (Supabase rejects many unicode characters in keys). The exact
 * user-facing filename is carried separately as `originalName`.
 */
export interface UploadedAttachment {
  url: string
  /** Exact `File.name` as picked by the user — accents and punctuation preserved. */
  originalName: string
}

function buildObjectKey(pathPrefix: string, file: File): string {
  const extension = file.name.split('.').pop()
  const safeExt =
    extension && /^[a-zA-Z0-9]{1,16}$/.test(extension) ? `.${extension}` : ''
  return `${pathPrefix}/${crypto.randomUUID()}${safeExt}`
}

/**
 * Uploads a single file straight from the browser to Supabase Storage and
 * returns its public URL. The object key is always a UUID (+ safe extension)
 * so Supabase never rejects the key for special characters in the real name.
 *
 * Callers that need the display name should keep `file.name` themselves
 * (see `uploadTaskAttachments`).
 */
export async function uploadFile(
  bucket: string,
  pathPrefix: string,
  file: File,
): Promise<string> {
  const fileName = buildObjectKey(pathPrefix, file)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

/**
 * Uploads task attachments in parallel. Returns public URLs paired with the
 * exact original filenames for API persistence and UI display.
 */
export async function uploadTaskAttachments(
  bucket: string,
  pathPrefix: string,
  files: File[],
): Promise<UploadedAttachment[]> {
  return Promise.all(
    files.map(async (file) => {
      const url = await uploadFile(bucket, pathPrefix, file)
      return { url, originalName: file.name }
    }),
  )
}
