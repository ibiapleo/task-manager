'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutGrid,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { UserAvatar } from '@/components/user-avatar'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { usePermissions } from '@/hooks/use-permissions'
import { useProfile } from '@/hooks/use-profile'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/tasks', label: 'Tarefas', icon: LayoutGrid, adminOnly: false },
  { href: '/users', label: 'Usuários', icon: Users, adminOnly: true },
  { href: '/settings', label: 'Ajustes', icon: Settings, adminOnly: false },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { isAdmin } = usePermissions()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await signOut()
      setOpen(false)
      router.replace('/login')
    } catch (err) {
      console.error('Logout failed:', err)
      toast.error('Não foi possível sair. Tente novamente.')
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav
        aria-label="Navegação principal"
        className="glass pointer-events-auto flex w-full max-w-3xl items-center gap-2 rounded-full px-3 py-2"
      >
        <Link
          href="/tasks"
          className="flex items-center gap-2 rounded-full px-2 py-1 font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListChecks className="size-4" />
          </span>
          <span className="hidden sm:inline">Prism</span>
        </Link>

        {/* Desktop */}
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="ml-1 inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition active:scale-95 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:active:scale-100"
          >
            {isLoggingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
          <IconTooltip label="Ajustes">
            <Link href="/settings" aria-label="Ajustes" className="ml-1">
              <UserAvatar profile={profile} size="sm" />
            </Link>
          </IconTooltip>
        </div>

        {/* Mobile trigger */}
        <IconTooltip label="Abrir menu">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="ml-auto inline-flex size-9 items-center justify-center rounded-full border border-border/60 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-5" />
          </button>
        </IconTooltip>
      </nav>

      {/* Mobile Sheet */}
      {open && (
        <div className="pointer-events-auto md:hidden">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="glass fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col gap-2 rounded-l-3xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold tracking-tight">
                <UserAvatar profile={profile} size="sm" />
                Menu
              </span>
              <IconTooltip label="Fechar">
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-5" />
                </button>
              </IconTooltip>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-card/60',
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-auto inline-flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:active:scale-100"
            >
              {isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
