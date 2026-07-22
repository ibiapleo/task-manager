import { supabase } from '@/services/auth/supabase-client'

export const STORAGE_BUCKETS = {
  avatars: 'profile-avatars',
  tasks: 'tasks',
} as const


export interface UploadedAttachment {
  url: string
  originalName: string
}

function buildObjectKey(pathPrefix: string, file: File): string {
  const extension = file.name.split('.').pop()
  const safeExt =
    extension && /^[a-zA-Z0-9]{1,16}$/.test(extension) ? `.${extension}` : ''
  return `${pathPrefix}/${crypto.randomUUID()}${safeExt}`
}

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
