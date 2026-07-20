'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@task-manager/shared-types'
import { AdminOnly } from '@/components/admin-only'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { UserAvatar } from '@/components/user-avatar'
import { GlassCard } from '@/components/ui/glass'
import { Pagination } from '@/components/ui/pagination'
import { PillSelect } from '@/components/ui/pill-select'
import { useUpdateUserRole, useUsersQuery } from '@/hooks/use-users'
import { ROLE_META } from '@/lib/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COMMON', label: 'Comum' },
]

const PAGE_SIZE = 10

const SEARCH_DEBOUNCE_MS = 300

function parsePageParam(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function UsersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = useMemo(
    () => parsePageParam(searchParams.get('page')),
    [searchParams],
  )
  const searchFromUrl = useMemo(
    () => searchParams.get('search')?.trim() ?? '',
    [searchParams],
  )

  const [searchDraft, setSearchDraft] = useState(searchFromUrl)

  useEffect(() => {
    setSearchDraft(searchFromUrl)
  }, [searchFromUrl])

  const replaceParams = useCallback(
    (patch: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString())

      const nextSearch =
        patch.search !== undefined ? patch.search.trim() : searchFromUrl
      if (nextSearch) params.set('search', nextSearch)
      else params.delete('search')

      const nextPage =
        patch.page !== undefined
          ? patch.page
          : patch.search !== undefined
            ? 1
            : page
      if (nextPage <= 1) params.delete('page')
      else params.set('page', String(nextPage))

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [page, pathname, router, searchFromUrl, searchParams],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchDraft.trim()
      if (trimmed !== searchFromUrl) {
        replaceParams({ search: trimmed, page: 1 })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [replaceParams, searchDraft, searchFromUrl])

  const { data, isLoading, isError } = useUsersQuery({
    page,
    limit: PAGE_SIZE,
    search: searchFromUrl || undefined,
  })
  const updateRole = useUpdateUserRole()
  const [pending, setPending] = useState<{ id: string; role: Role } | null>(
    null,
  )

  const users = data?.data ?? []
  const meta = data?.meta
  const target = users.find((u) => u.id === pending?.id)

  useEffect(() => {
    if (!meta || meta.totalPages === 0) return
    if (page > meta.totalPages) {
      replaceParams({ page: meta.totalPages })
    }
  }, [meta, page, replaceParams])

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter text-balance sm:text-5xl">
          Usuários
        </h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          Gerencie funções de acesso da sua equipe.
        </p>
      </header>

      <AdminOnly
        fallback={
          <GlassCard className="mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              Somente administradores podem gerenciar usuários.
            </p>
          </GlassCard>
        }
      >
        <div className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar por nome ou e-mail"
            className="h-11 w-full rounded-full border border-border/60 bg-card/50 py-2 pl-11 pr-4 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            Carregando usuários...
          </p>
        )}
        {isError && (
          <p className="text-center text-sm text-destructive">
            Não foi possível carregar os usuários.
          </p>
        )}
        {!isLoading && !isError && (
          <>
            <GlassCard className="overflow-hidden p-2 sm:p-3">
              <ul className="flex flex-col">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 rounded-2xl p-4 transition hover:bg-card/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar profile={u} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.name || u.email}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:w-56">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        Função
                      </span>
                      <PillSelect<Role>
                        className="flex-1"
                        label={`Função de ${u.name || u.email}`}
                        value={u.role}
                        options={ROLE_OPTIONS}
                        onChange={(role) => {
                          if (role !== u.role) setPending({ id: u.id, role })
                        }}
                      />
                    </div>
                  </li>
                ))}
                {users.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum usuário encontrado.
                  </li>
                )}
              </ul>
            </GlassCard>

            {meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                itemLabel="usuário"
                onPageChange={(next) => replaceParams({ page: next })}
                className="self-center"
              />
            )}
          </>
        )}
      </AdminOnly>

      <ConfirmActionDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Alterar função do usuário?"
        description={
          target && pending
            ? `${target.name || target.email} passará de ${ROLE_META[target.role].label} para ${ROLE_META[pending.role].label}. Isso altera as permissões de acesso.`
            : undefined
        }
        confirmLabel="Alterar função"
        onConfirm={async () => {
          if (!pending) return
          try {
            await updateRole.mutateAsync(pending)
            toast.success('Função atualizada.')
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Não foi possível atualizar a função.',
            )
            throw error
          }
        }}
      />
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Carregando usuários...
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  )
}
