// The client uploads attachments directly to Supabase Storage and only
// sends us the resulting URL, so we infer a simple "file type" (extension)
// from it instead of requiring an extra field on the DTO.
export function resolveFileType(url: string): string {
  const withoutQuery = url.split(/[?#]/)[0];
  const lastSegment = withoutQuery.split('/').pop() ?? '';
  const dotIndex = lastSegment.lastIndexOf('.');

  if (dotIndex === -1 || dotIndex === lastSegment.length - 1) {
    return 'unknown';
  }

  return lastSegment.slice(dotIndex + 1).toLowerCase();
}
