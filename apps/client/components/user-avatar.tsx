import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
} as const

function initialsFrom(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

interface UserAvatarProps {
  profile?: {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** Shows the profile's avatarUrl (uploaded client-side to Supabase Storage), falling back to initials. */
export function UserAvatar({
  profile,
  size = 'md',
  className,
}: UserAvatarProps) {
  if (profile?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external Supabase Storage URL
      <img
        src={profile.avatarUrl}
        alt={profile.name ?? profile.email ?? 'Avatar'}
        className={cn(
          'shrink-0 rounded-full border border-border/60 object-cover',
          SIZE_CLASSES[size],
          className,
        )}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initialsFrom(profile?.name, profile?.email)}
    </span>
  )
}
