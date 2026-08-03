'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import type { RegisterResponse } from '@task-manager/shared-types'
import { toast } from 'sonner'
import { apiClient, setUnauthorizedHandler } from '@/services/http/api-client'
import { supabase } from '@/services/auth/supabase-client'

interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  ready: boolean
  isPasswordRecovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw new Error(error.message)
    setSession(null)
    setIsPasswordRecovery(false)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true)
        }
        if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false)
        }
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      toast.error('Sua sessão expirou. Entre novamente.')
      void signOut().catch((err) => {
        console.error('Forced sign out after irrecoverable session failed:', err)
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      const isInvalidCredentials = /invalid login credentials/i.test(
        error.message,
      )
      throw new Error(
        isInvalidCredentials
          ? 'E-mail ou senha incorretos.'
          : error.message,
      )
    }
  }

  async function signUp(email: string, password: string) {
    const result = await apiClient.post<RegisterResponse>('/auth/register', {
      email,
      password,
    })

    if (result.session) {
      const { error } = await supabase.auth.setSession({
        access_token: result.session.accessToken,
        refresh_token: result.session.refreshToken,
      })
      if (error) throw new Error(error.message)
    }

    return { requiresEmailConfirmation: result.requiresEmailConfirmation }
  }

  async function requestPasswordReset(email: string) {
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) throw new Error(error.message)
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(error.message)
    setIsPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        ready,
        isPasswordRecovery,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
