'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { setUnauthorizedHandler } from '@/lib/api-client'
import { supabase } from '@/lib/supabase-client'

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

/**
 * Owns the Supabase auth session only. It intentionally knows nothing about
 * the app's `Profile` (name, role, preferences) - that is business data
 * served by our own API and belongs to `useProfile()` (see hooks/use-profile.ts).
 * Keeping identity (who is this Supabase user) separate from profile
 * (what does our app know about them) follows single-responsibility and
 * avoids two sources of truth for the same data.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  const signOut = useCallback(async () => {
    // Await the real Supabase teardown before clearing React state. Clearing
    // first made AppShell bounce to /login while tokens stayed in
    // localStorage - the session then restored and "another account" never stuck.
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw new Error(error.message)
    setSession(null)
    // Drop cached profile/tasks so the next session cannot flash the previous user.
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
        console.error('Forced sign out after 401 failed:', err)
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(error.message)
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    // If email confirmation is required, Supabase returns a user but no
    // session yet - the caller should show a "check your inbox" message
    // instead of redirecting straight into the app.
    return { requiresEmailConfirmation: !data.session }
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
