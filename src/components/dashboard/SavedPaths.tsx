
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SavedPath {
  id: number
  path_name: string
  path_details_json: any
  created_at: string
}

export const SavedPaths = () => {
  const [paths, setPaths] = useState<SavedPath[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchSavedPaths()
  }, [user])

  const fetchSavedPaths = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('saved_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPaths(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch saved paths')
    } finally {
      setLoading(false)
    }
  }

  const deletePath = async (id: number) => {
    setDeleting(id)
    try {
      const { error } = await supabase
        .from('saved_paths')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPaths(paths.filter(path => path.id !== id))
      toast.success('Path deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete path')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Saved Career Paths</h2>
        <p className="text-gray-400">View and manage your saved career analyses</p>
      </div>

      {paths.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No saved paths yet</p>
            <p className="text-gray-500">Explore career paths to save them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paths.map((path) => (
            <Card key={path.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span>{path.path_name}</span>
                  </div>
                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                    {new Date(path.created_at).toLocaleDateString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedPath(path)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    onClick={() => deletePath(path.id)}
                    disabled={deleting === path.id}
                    size="sm"
                    variant="destructive"
                  >
                    {deleting === path.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPath} onOpenChange={() => setSelectedPath(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedPath?.path_name}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
              {selectedPath?.path_details_json?.analysis}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
