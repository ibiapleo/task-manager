'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  RegisterInputSchema,
  type RegisterInput,
} from '@task-manager/shared-types'
import { ArrowRight, CheckCircle2, ListChecks, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { PasswordField } from '@/components/password-field'
import { PasswordRequirements } from '@/components/password-requirements'
import { useTheme } from '@/components/theme-provider'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const isRetro = theme === 'retro'
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const password = watch('password')

  async function onSubmit(values: RegisterInput) {
    try {
      const { requiresEmailConfirmation } = await signUp(
        values.email,
        values.password,
      )
      if (requiresEmailConfirmation) {
        setAwaitingConfirmation(true)
      } else {
        router.replace('/tasks')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível criar a conta.',
      )
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
        <GlassCard className="flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">
            Confirme seu e-mail
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enviamos um link de confirmação para o seu e-mail. Depois de
            confirmar, você já pode entrar normalmente.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ir para o login
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
          Crie sua conta e comece a organizar tudo.
        </h1>
      </div>

      <GlassCard className="w-full max-w-md p-8">
        {isRetro && (
          <div className="mb-4 text-center text-sm tracking-widest text-muted-foreground">
            [ CRIAR CONTA ]
          </div>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@seuemail.com"
              aria-invalid={!!errors.email}
              {...register('email')}
              className={cn(
                'h-12 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                errors.email && 'border-destructive',
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <PasswordField
            id="password"
            label="Senha"
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
                Criando conta...
              </>
            ) : (
              <>
                {isRetro ? '[ CRIAR CONTA ]' : 'Criar conta'}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      </GlassCard>
    </div>
  )
}
