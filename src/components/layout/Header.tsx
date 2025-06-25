
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sparkles, LogOut } from 'lucide-react'

export const Header = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            ASPIRO AI
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
