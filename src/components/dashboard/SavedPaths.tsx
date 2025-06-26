
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Trash2, Eye, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SavedPath {
  id: string
  name: string
  field: string
  savedAt: string
  summary: string
}

export const SavedPaths = () => {
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([])
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved paths from localStorage or API
    const mockPaths: SavedPath[] = [
      {
        id: '1',
        name: 'Data Science Career Path',
        field: 'Data Science',
        savedAt: '2024-01-15',
        summary: 'High-growth field with excellent salary prospects and remote work opportunities.'
      },
      {
        id: '2', 
        name: 'UX Design Journey',
        field: 'UX Design',
        savedAt: '2024-01-10',
        summary: 'Creative field focusing on user experience with strong demand in tech industry.'
      }
    ]
    setSavedPaths(mockPaths)
  }, [])

  const handleViewPath = (path: SavedPath) => {
    setSelectedPath(path)
    toast({
      title: "Path loaded",
      description: `Viewing details for ${path.name}`,
    })
  }

  const handleDeletePath = (pathId: string) => {
    setSavedPaths(prev => prev.filter(p => p.id !== pathId))
    if (selectedPath?.id === pathId) {
      setSelectedPath(null)
    }
    toast({
      title: "Path deleted",
      description: "Career path removed from your collection",
    })
  }

  const handleExploreMore = () => {
    toast({
      title: "Feature coming soon",
      description: "Navigate to Career Explorer to discover new paths",
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Saved Career Paths</h2>
        <p className="text-gray-600 mb-6">
          Your collection of explored career opportunities
        </p>
      </div>

      {savedPaths.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved paths yet</h3>
          <p className="text-gray-600 mb-6">
            Start exploring career paths to build your collection
          </p>
          <Button onClick={handleExploreMore} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Explore Career Paths
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Paths List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Saved Paths</h3>
            {savedPaths.map((path) => (
              <div key={path.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{path.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{path.field}</p>
                    <p className="text-sm text-gray-500 mt-2">{path.summary}</p>
                    <p className="text-xs text-gray-400 mt-2">Saved on {path.savedAt}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPath(path)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePath(path.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Path Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Path Details</h3>
            {selectedPath ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{selectedPath.name}</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900">Field:</h5>
                    <p className="text-gray-600">{selectedPath.field}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Summary:</h5>
                    <p className="text-gray-600">{selectedPath.summary}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Career Progression:</h5>
                    <ul className="text-gray-600 list-disc list-inside space-y-1">
                      <li>Entry Level → Junior Professional</li>
                      <li>Mid Level → Senior Specialist</li>
                      <li>Senior Level → Team Lead</li>
                      <li>Executive → Director/VP</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => toast({ title: "Action coming soon", description: "Detailed path analysis will be available soon" })}
                  >
                    Get Detailed Analysis
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a saved path to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
