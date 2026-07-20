import { cn } from '@/lib/utils'

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass rounded-3xl text-card-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function GlassInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm text-foreground outline-none backdrop-blur-md transition',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
        'data-[theme=retro]:rounded-none',
        className,
      )}
      {...props}
    />
  )
}
