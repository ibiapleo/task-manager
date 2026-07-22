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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw new Error(error.message)
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
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

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        ready,
        signIn,
        signUp,
        signOut,
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
