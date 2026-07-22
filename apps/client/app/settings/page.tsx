'use client'

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeSchema, type UpdateProfileInput } from '@task-manager/shared-types'
import { AvatarCropDialog } from '@/components/avatar-crop-dialog'
import { ThemeSelector } from '@/components/theme-selector'
import { useTheme } from '@/components/theme-provider'
import { UserAvatar } from '@/components/user-avatar'
import { GlassCard } from '@/components/ui/glass'
import { IconTooltip } from '@/components/ui/icon-tooltip'
import { PillSelect } from '@/components/ui/pill-select'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { applyAccessibilityPreview, applyThemePreview } from '@/services/preferences/preview'
import { STORAGE_BUCKETS, uploadFile } from '@/services/storage/storage'
import { DATE_FORMAT_OPTIONS, ROLE_META, type DateFormat } from '@/domain/types'
import { cn } from '@/lib/utils'

const settingsSchema = z.object({
  name: z.string().max(120).optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  theme: ThemeSchema,
  highContrast: z.boolean(),
  fontSizeMultiplier: z.number().min(0.5).max(3),
  dateFormat: z.string().max(20),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const FALLBACK_VALUES: SettingsFormValues = {
  name: '',
  avatarUrl: '',
  theme: 'light',
  highContrast: false,
  fontSizeMultiplier: 1,
  dateFormat: 'DD/MM/YYYY',
}

export default function SettingsPage() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { applyTheme } = useTheme()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: FALLBACK_VALUES,
  })

  useEffect(() => {
    if (!profile) return
    reset({
      name: profile.name ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      theme: profile.preferences.theme,
      highContrast: profile.preferences.accessibility.highContrast,
      fontSizeMultiplier: profile.preferences.accessibility.fontSizeMultiplier,
      dateFormat: profile.preferences.localization.dateFormat,
    })
  }, [profile, reset])

  const avatarUrl = watch('avatarUrl')
  const theme = watch('theme')
  const fontSizeMultiplier = watch('fontSizeMultiplier')
  const highContrast = watch('highContrast')

  useEffect(() => {
    applyThemePreview(theme)
    applyAccessibilityPreview({ highContrast, fontSizeMultiplier })
  }, [theme, highContrast, fontSizeMultiplier])

  const profileRef = useRef(profile)
  profileRef.current = profile
  useEffect(() => {
    return () => {
      const persisted = profileRef.current?.preferences
      if (!persisted) return
      applyThemePreview(persisted.theme)
      applyAccessibilityPreview(persisted.accessibility)
    }
  }, [])

  async function onSubmit(values: SettingsFormValues) {
    let nextAvatarUrl = values.avatarUrl || undefined

    if (avatarFile && profile) {
      setIsUploadingAvatar(true)
      try {
        nextAvatarUrl = await uploadFile(STORAGE_BUCKETS.avatars, profile.id, avatarFile)
      } catch (err) {
        console.error('Avatar upload failed:', err)
        toast.error('Erro ao enviar arquivo. Tente novamente.')
        return
      } finally {
        setIsUploadingAvatar(false)
      }
    }

    const payload: UpdateProfileInput = {
      name: values.name || undefined,
      avatarUrl: nextAvatarUrl,
      preferences: {
        theme: values.theme,
        accessibility: {
          highContrast: values.highContrast,
          fontSizeMultiplier: values.fontSizeMultiplier,
        },
        localization: {
          dateFormat: values.dateFormat,
        },
      },
    }
    try {
      await updateProfile.mutateAsync(payload)
      applyTheme(values.theme)
      if (avatarFile) {
        setValue('avatarUrl', nextAvatarUrl ?? '')
        setAvatarFile(null)
        setAvatarPreview(null)
      }
      toast.success('Perfil salvo.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter text-balance sm:text-5xl">
          Ajustes
        </h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          Personalize seu perfil e a aparência do Prism.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estas informações aparecem para administradores.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <IconTooltip label="Trocar avatar">
                <button
                  type="button"
                  aria-label="Trocar avatar"
                  disabled={isUploadingAvatar || !profile}
                  onClick={() => setAvatarDialogOpen(true)}
                  className="group relative rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 disabled:active:scale-100"
                >
                  <UserAvatar
                    profile={
                      profile
                        ? {
                            ...profile,
                            avatarUrl: avatarPreview || avatarUrl || null,
                          }
                        : null
                    }
                    size="lg"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 transition group-hover:opacity-100">
                    <Pencil className="size-5" />
                  </span>
                </button>
              </IconTooltip>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Foto de perfil</span>
                <span className="text-xs text-muted-foreground">
                  Clique no avatar para arrastar, enviar e recortar uma nova foto.
                </span>
              </div>
            </div>

            <AvatarCropDialog
              open={avatarDialogOpen}
              onOpenChange={setAvatarDialogOpen}
              onCropped={(file) => {
                setAvatarFile(file)
                setAvatarPreview(URL.createObjectURL(file))
              }}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <input
                id="name"
                {...register('name')}
                className="h-11 w-full rounded-full border border-border/60 bg-card/50 px-5 text-sm outline-none backdrop-blur-md transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">E-mail</span>
              <span className="inline-flex h-11 w-fit items-center rounded-full border border-border/60 bg-card/40 px-5 text-sm text-muted-foreground">
                {profile?.email}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Função</span>
              <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-sm font-medium">
                {profile ? ROLE_META[profile.role].label : '—'}
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Tema</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha entre quatro modos visuais e veja o preview em tempo
            real - a escolha só é salva ao clicar em &quot;Salvar
            alterações&quot;.
          </p>
          <div className="mt-6">
            <ThemeSelector value={theme} onChange={(next) => setValue('theme', next)} />
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Acessibilidade e localização
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajustes salvos no seu perfil e aplicados em qualquer dispositivo.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Alto contraste</span>
              <button
                type="button"
                role="switch"
                aria-checked={highContrast}
                onClick={() => setValue('highContrast', !highContrast)}
                className={cn(
                  'inline-flex h-9 w-16 items-center rounded-full border border-border/60 p-1 transition',
                  highContrast ? 'bg-primary' : 'bg-card/50',
                )}
              >
                <span
                  className={cn(
                    'size-6 rounded-full bg-background shadow transition-transform',
                    highContrast && 'translate-x-7',
                  )}
                />
              </button>
              <p className="text-xs text-muted-foreground">
                Aumenta bordas e contraste de texto em toda a interface.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="fontSizeMultiplier" className="text-sm font-medium">
                Tamanho do texto ({fontSizeMultiplier.toFixed(1)}x)
              </label>
              <input
                id="fontSizeMultiplier"
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                {...register('fontSizeMultiplier', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Escala todo o texto e espaçamento do app.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Formato de data</span>
              <Controller
                control={control}
                name="dateFormat"
                render={({ field }) => (
                  <PillSelect<DateFormat>
                    label="Formato de data"
                    value={field.value as DateFormat}
                    options={DATE_FORMAT_OPTIONS}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || updateProfile.isPending || isUploadingAvatar}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 self-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition active:scale-95 sm:self-end',
          'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 disabled:active:scale-100',
        )}
      >
        {isUploadingAvatar ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando avatar...
          </>
        ) : updateProfile.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Check className="size-4" />
            Salvar alterações
          </>
        )}
      </button>
    </form>
  )
}
