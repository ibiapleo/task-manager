'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  ResetPasswordInputSchema,
  type ResetPasswordInput,
} from '@task-manager/shared-types'
import { ArrowRight, ListChecks, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { PasswordField } from '@/components/password-field'
import { PasswordRequirements } from '@/components/password-requirements'
import { useTheme } from '@/components/theme-provider'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const {
    session,
    ready,
    isPasswordRecovery,
    updatePassword,
    signOut,
  } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const isRetro = theme === 'retro'
  const [linkSettled, setLinkSettled] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInputSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = watch('password')
  const canReset = !!session && (isPasswordRecovery || linkSettled)

  useEffect(() => {
    if (!ready) return
    if (session || isPasswordRecovery) {
      setLinkSettled(true)
      return
    }
    const timer = window.setTimeout(() => setLinkSettled(true), 800)
    return () => window.clearTimeout(timer)
  }, [ready, session, isPasswordRecovery])

  useEffect(() => {
    if (!session) return
    if (window.location.hash || window.location.search.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [session])

  async function onSubmit(values: ResetPasswordInput) {
    try {
      await updatePassword(values.password)
      toast.success('Senha atualizada. Entre com a nova senha.')
      await signOut()
      router.replace('/login')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a senha.',
      )
    }
  }

  if (!ready || !linkSettled) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canReset) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
        <GlassCard className="flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Link inválido ou expirado
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Solicite um novo link de recuperação para definir outra senha.
          </p>
          <Link
            href="/forgot-password"
            className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Recuperar senha
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
          <ListChecks className="size-3.5" />
          {isRetro ? '[ PRISM // TASK MANAGER ]' : 'Prism · Task Manager'}
        </span>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tighter text-balance sm:text-6xl md:text-7xl">
          Nova senha
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
          Escolha uma senha forte para a sua conta.
        </p>
      </div>

      <GlassCard className="w-full max-w-md p-8">
        {isRetro && (
          <div className="mb-4 text-center text-sm tracking-widest text-muted-foreground">
            [ NOVA SENHA ]
          </div>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <PasswordField
            id="password"
            label="Nova senha"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordRequirements password={password ?? ''} />
          <PasswordField
            id="confirmPassword"
            label="Confirmar senha"
            autoComplete="new-password"
            placeholder="••••••••"
            revealable={false}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition active:scale-95',
              'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {isRetro ? '[ SALVAR SENHA ]' : 'Salvar senha'}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>
      </GlassCard>
    </div>
  )
}
