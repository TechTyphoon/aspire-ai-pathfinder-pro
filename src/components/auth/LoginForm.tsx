
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

interface LoginFormProps {
  onSwitchToSignUp: () => void
}

export const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
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

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
      </Button>

      <div className="text-center">
        <span className="text-gray-400">Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-purple-400 hover:text-purple-300 font-medium"
        >
          Sign up
        </button>
      </div>
    </form>
  )
}
