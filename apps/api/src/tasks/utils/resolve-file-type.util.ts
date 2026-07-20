// The client uploads attachments directly to Supabase Storage and sends
// URL + originalName; we still infer a simple "file type" (extension)
// from the storage URL for the Attachment.fileType column.
export function resolveFileType(url: string): string {
  const withoutQuery = url.split(/[?#]/)[0];
  const lastSegment = withoutQuery.split('/').pop() ?? '';
  const dotIndex = lastSegment.lastIndexOf('.');

  if (dotIndex === -1 || dotIndex === lastSegment.length - 1) {
    return 'unknown';
  }

  return lastSegment.slice(dotIndex + 1).toLowerCase();
}
