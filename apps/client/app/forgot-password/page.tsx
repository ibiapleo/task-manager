'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  ForgotPasswordInputSchema,
  type ForgotPasswordInput,
} from '@task-manager/shared-types'
import { ArrowRight, ListChecks, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { theme } = useTheme()
  const isRetro = theme === 'retro'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInputSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      await requestPasswordReset(values.email.trim().toLowerCase())
      toast.success(
        'Se existir uma conta com este e-mail, enviamos um link de recuperação.',
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o link de recuperação.',
      )
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
          <ListChecks className="size-3.5" />
          {isRetro ? '[ PRISM // TASK MANAGER ]' : 'Prism · Task Manager'}
        </span>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tighter text-balance sm:text-6xl md:text-7xl">
          Recuperar senha
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
          Informe o e-mail da sua conta. Se ele estiver cadastrado, você
          receberá um link para criar uma nova senha.
        </p>
      </div>

      <GlassCard className="w-full max-w-md p-8">
        {isRetro && (
          <div className="mb-4 text-center text-sm tracking-widest text-muted-foreground">
            [ RECUPERAR SENHA ]
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
              autoFocus
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
                Enviando...
              </>
            ) : (
              <>
                {isRetro ? '[ ENVIAR LINK ]' : 'Enviar link'}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Lembrou a senha?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </form>
      </GlassCard>
    </div>
  )
}
