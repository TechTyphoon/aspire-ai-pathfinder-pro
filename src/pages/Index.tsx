
import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const Index = () => {
  const { user } = useAuth()

  if (!user) {
    return <Auth />
  }

  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
};

export default Index;
