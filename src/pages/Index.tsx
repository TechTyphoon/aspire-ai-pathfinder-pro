
import { Dashboard } from '@/components/dashboard/Dashboard'

const Index = () => {
  // Commented out authentication logic - no login required for now
  // const { user } = useAuth()

  // if (!user) {
  //   return <Auth />
  // }

  // return (
  //   <ProtectedRoute>
  //     <Dashboard />
  //   </ProtectedRoute>
  // )

  // Direct access to dashboard without authentication
  return <Dashboard />
};

export default Index;
