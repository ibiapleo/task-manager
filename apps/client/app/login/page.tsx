'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowRight, ListChecks, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { GlassCard } from '@/components/ui/glass'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const isRetro = theme === 'retro'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    try {
      await signIn(values.email, values.password)
      router.replace('/tasks')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível entrar.',
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
          {isRetro
            ? 'Onde design vira código e tarefas viram fluxo.'
            : 'A plataforma onde equipes transformam ideias em fluxo.'}
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
          Entre para organizar suas tarefas em lista ou Kanban, arraste e
          solte, e alterne entre quatro temas dinâmicos.
        </p>
      </div>

      <GlassCard className="w-full max-w-md p-8">
        {isRetro && (
          <div className="mb-4 text-center text-sm tracking-widest text-muted-foreground">
            [ LOGIN ]
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
              placeholder="voce@suaequipe.com"
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
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
              className={cn(
                'h-12 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
                errors.password && 'border-destructive',
              )}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
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
                Entrando...
              </>
            ) : (
              <>
                {isRetro ? '[ ENTRAR ]' : 'Entrar na conta'}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </GlassCard>
    </div>
  )
}
