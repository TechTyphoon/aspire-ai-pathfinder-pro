
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Setting up auth state listener...')
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    console.log('Attempting to sign up:', email)
    setLoading(true)
    
    try {
      // Sign up without email confirmation for testing
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined // Remove email redirect to skip verification
        }
      })
      
      console.log('Sign up response:', { data, error })
      
      if (error) {
        console.error('Sign up error:', error)
        setLoading(false)
        return { error }
      }

      // If user is created but not confirmed, auto-confirm for testing
      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created but not confirmed, attempting direct sign in...')
        // Try to sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          console.error('Auto sign-in failed:', signInError)
        } else {
          console.log('Auto sign-in successful')
        }
      }
      
      setLoading(false)
      return { error: null }
    } catch (err) {
      console.error('Sign up exception:', err)
      setLoading(false)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response:', { data, error })
      
      setLoading(false)
      return { error }
    } catch (err) {
      console.error('Sign in exception:', err)
      setLoading(false)
      return { error: err }
    }
  }

  const signOut = async () => {
    console.log('Signing out...')
    setLoading(true)
    try {
      await supabase.auth.signOut()
      console.log('Sign out successful')
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
