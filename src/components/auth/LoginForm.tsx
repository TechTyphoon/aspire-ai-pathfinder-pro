
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface LoginFormProps {
  onSwitchToSignUp: () => void
}

export const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('Login error:', error)
        
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please check your credentials and try again.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Login Failed',
            description: error.message || 'Unable to sign in. Please try again.',
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Success',
          description: 'Welcome back!',
        })
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during login',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsDemoLoading(true)
    
    try {
      const demoEmail = 'demo@aspiroai.com'
      const demoPassword = 'demo123456'
      
      // Try to sign in first
      const { error: signInError } = await signIn(demoEmail, demoPassword)
      
      if (!signInError) {
        // Login successful
        toast({
          title: 'Demo Login Successful',
          description: 'Welcome to ASPIRO AI! You are now logged in with the demo account.',
        })
        return
      }
      
      // If sign in failed, try to create the demo account
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            name: 'Demo User'
          }
        }
      })
      
      if (signUpError) {
        // If user already exists but couldn't sign in, show specific message
        if (signUpError.message?.includes('User already registered')) {
          toast({
            title: 'Demo Account Issue',
            description: 'Demo account exists but login failed. Please try again or contact support.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Demo Setup Failed',
            description: 'Unable to set up demo account. Please try regular signup.',
            variant: 'destructive',
          })
        }
      } else {
        // Signup successful - user should be automatically signed in
        toast({
          title: 'Demo Account Created',
          description: 'Welcome to ASPIRO AI! Demo account created and you are now signed in.',
        })
      }
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during demo login',
        variant: 'destructive',
      })
    } finally {
      setIsDemoLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isDemoLoading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading || isDemoLoading}
          required
        />
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isLoading || isDemoLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or try demo
            </span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100" 
          onClick={handleDemoLogin}
          disabled={isLoading || isDemoLoading}
        >
          {isDemoLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Setting up demo...
            </>
          ) : (
            '🚀 Try Demo Account'
          )}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-sm text-blue-600 hover:text-blue-500 underline"
          disabled={isLoading || isDemoLoading}
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  )
}
