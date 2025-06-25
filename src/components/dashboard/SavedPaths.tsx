
import { Button } from '@/components/ui/button'
import { BookOpen, Star, Calendar } from 'lucide-react'

export const SavedPaths = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Saved Career Paths</h2>
        <p className="text-gray-400 mb-6">
          Your saved career analyses and recommendations
        </p>
      </div>

      <div className="text-center py-12">
        <div className="p-4 bg-gray-800 rounded-full w-fit mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">No Saved Paths Yet</h3>
        <p className="text-gray-400 mb-6">
          Start by analyzing your resume or exploring career paths to save your favorites
        </p>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
          Explore Careers
        </Button>
      </div>
    </div>
  )
}
