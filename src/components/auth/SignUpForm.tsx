
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface SignUpFormProps {
  onSwitchToLogin: () => void
}

export const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        console.error('Sign up error:', error)
        
        // Handle specific error cases
        if (error.message?.includes('User already registered')) {
          toast({
            title: 'Account Exists',
            description: 'This email is already registered. Please try signing in instead.',
          })
          setTimeout(() => onSwitchToLogin(), 1500)
        } else {
          toast({
            title: 'Sign Up Failed',
            description: error.message || 'Failed to create account. Please try again.',
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Success!',
          description: 'Account created successfully! You are now signed in.',
        })
        // No need to switch to login, user should be automatically signed in
      }
    } catch (error) {
      console.error('Sign up exception:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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
          disabled={isLoading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:text-blue-500 underline"
          disabled={isLoading}
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  )
}
