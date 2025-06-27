
import { Button } from '@/components/ui/button'
// import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User } from 'lucide-react'
// import { useToast } from '@/hooks/use-toast'

export const Header = () => {
  // const { user, signOut } = useAuth()
  // const { toast } = useToast()

  // const handleSignOut = async () => {
  //   try {
  //     await signOut()
  //     toast({
  //       title: 'Signed out',
  //       description: 'You have been successfully signed out',
  //     })
  //   } catch (error) {
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to sign out',
  //       variant: 'destructive',
  //     })
  //   }
  // }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">ASPIRO AI</h1>
            <span className="text-gray-500">Your AI Career Assistant</span>
          </div>
          
          {/* Commented out user authentication UI */}
          {/* {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          )} */}
        </div>
      </div>
    </header>
  )
}
