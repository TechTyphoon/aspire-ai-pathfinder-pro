
import { useState } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <AuthLayout
      title={isLogin ? 'Welcome Back' : 'Join ASPIRO AI'}
      subtitle={isLogin ? 'Sign in to access your career dashboard' : 'Create your account to get started'}
    >
      {isLogin ? (
        <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
      ) : (
        <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </AuthLayout>
  )
}
