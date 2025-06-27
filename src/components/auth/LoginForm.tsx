
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
      // First try to sign up the demo user (in case it doesn't exist)
      const demoEmail = 'demo@aspiroai.com'
      const demoPassword = 'demo123456'
      
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          emailRedirectTo: undefined
        }
      })
      
      // Then sign in (whether signup succeeded or failed due to existing user)
      const { error } = await signIn(demoEmail, demoPassword)
      
      if (error) {
        console.error('Demo login error:', error)
        toast({
          title: 'Demo Login Failed',
          description: 'Unable to log in with demo account. Please try regular login.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Demo Login Successful',
          description: 'Welcome to ASPIRO AI! You are now logged in with the demo account.',
        })
      }
    } catch (error) {
      console.error('Demo login exception:', error)
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
              Or
            </span>
          </div>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={handleDemoLogin}
          disabled={isLoading || isDemoLoading}
        >
          {isDemoLoading ? 'Logging in with demo...' : 'Try Demo Account'}
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
