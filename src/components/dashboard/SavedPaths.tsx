
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Trash2, Eye, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface SavedPath {
  id: number
  path_name: string
  path_details_json: {
    field?: string
    analysis?: string
    saved_at?: string
  }
  created_at: string
}

export const SavedPaths = () => {
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([])
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadSavedPaths()
  }, [])

  const loadSavedPaths = async () => {
    try {
      // Load all saved paths since we're not using authentication
      const { data, error } = await supabase
        .from('saved_paths')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedPaths(data || [])
    } catch (error) {
      console.error('Load paths error:', error)
      toast({
        title: "Load failed",
        description: "Unable to load saved paths",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPath = (path: SavedPath) => {
    setSelectedPath(path)
    toast({
      title: "Path loaded",
      description: `Viewing details for ${path.path_name}`,
    })
  }

  const handleDeletePath = async (pathId: number) => {
    if (!confirm('Are you sure you want to delete this career path?')) return

    try {
      const { error } = await supabase
        .from('saved_paths')
        .delete()
        .eq('id', pathId)

      if (error) throw error

      setSavedPaths(prev => prev.filter(p => p.id !== pathId))
      if (selectedPath?.id === pathId) {
        setSelectedPath(null)
      }
      toast({
        title: "Path deleted",
        description: "Career path removed from your collection",
      })
    } catch (error) {
      console.error('Delete path error:', error)
      toast({
        title: "Delete failed",
        description: "Unable to delete career path",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
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
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Explore Careers
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Paths List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Saved Paths ({savedPaths.length})</h3>
            {savedPaths.map((path) => (
              <div key={path.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{path.path_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{path.path_details_json.field || 'Career Path'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {path.path_details_json.analysis?.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Saved on {new Date(path.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPath(path)}
                      className="hover:bg-blue-50 hover:border-blue-300"
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
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{selectedPath.path_name}</h4>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
                    {selectedPath.path_details_json.analysis || 'No detailed analysis available.'}
                  </pre>
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
