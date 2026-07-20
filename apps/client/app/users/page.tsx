'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@task-manager/shared-types'
import { AdminOnly } from '@/components/admin-only'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { UserAvatar } from '@/components/user-avatar'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { PillSelect } from '@/components/ui/pill-select'
import { useUpdateUserRole, useUsersQuery } from '@/hooks/use-users'
import { ROLE_META } from '@/lib/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COMMON', label: 'Comum' },
]

const PAGE_SIZE = 10

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useUsersQuery({
    page,
    limit: PAGE_SIZE,
  })
  const updateRole = useUpdateUserRole()
  const [pending, setPending] = useState<{ id: string; role: Role } | null>(
    null,
  )

  const users = data?.data ?? []
  const meta = data?.meta
  const target = users.find((u) => u.id === pending?.id)

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

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <IconTooltip label="Página anterior">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 transition active:scale-90 disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                </IconTooltip>
                <span className="text-sm text-muted-foreground">
                  Página {meta.page} de {meta.totalPages}
                </span>
                <IconTooltip label="Próxima página">
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(meta.totalPages, p + 1))
                    }
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 transition active:scale-90 disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </IconTooltip>
              </div>
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
