import { supabase } from '@/lib/supabase-client'

/** Actual bucket names configured in the Supabase project - keep in sync with the dashboard. */
export const STORAGE_BUCKETS = {
  avatars: 'profile-avatars',
  tasks: 'tasks',
} as const

/**
 * Uploads a single file straight from the browser to Supabase Storage and
 * returns its public URL. The API is never involved in the byte transfer -
 * it only ever persists the resulting URL (see UpdateProfileDto.avatarUrl /
 * CreateTaskDto.attachments).
 *
 * Callers are expected to wrap this in their own try/catch and surface a
 * friendly toast - raw storage errors (e.g. "Bucket not found", RLS policy
 * errors) should never reach the end user directly.
 */
export async function uploadFile(
  bucket: string,
  pathPrefix: string,
  file: File,
): Promise<string> {
  const extension = file.name.split('.').pop()
  const fileName = `${pathPrefix}/${crypto.randomUUID()}${
    extension ? `.${extension}` : ''
  }`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

/** Uploads several files in parallel, preserving input order in the result. */
export async function uploadFiles(
  bucket: string,
  pathPrefix: string,
  files: File[],
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadFile(bucket, pathPrefix, file)))
}
