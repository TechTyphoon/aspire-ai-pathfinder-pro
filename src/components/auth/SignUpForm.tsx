
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

interface SignUpFormProps {
  onSwitchToLogin: () => void
}

export const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password)
      toast.success('Account created! Please check your email to verify.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Enter your password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Confirm your password"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
      </Button>

      <div className="text-center">
        <span className="text-gray-400">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-purple-400 hover:text-purple-300 font-medium"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}
