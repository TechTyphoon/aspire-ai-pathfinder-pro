import { Dashboard } from '@/components/dashboard/Dashboard'
import { Auth } from '@/pages/Auth'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const Index = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return <Dashboard />
}

export default Index
