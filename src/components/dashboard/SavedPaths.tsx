import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Trash2, Eye, Plus, Loader2, FolderOpen, Calendar, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface SavedPath {
  id: number
  path_name: string
  path_details_json: any
  created_at: string
  user_id: string | null
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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">Loading your saved paths...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
          <BookOpen className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">Saved Paths</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Your Career Collection
        </h2>
        <p className="text-muted-foreground">
          Access and manage all your explored career opportunities in one place
        </p>
      </div>

      {savedPaths.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No saved paths yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start exploring career paths and save the ones that interest you to build your collection
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Explore Careers
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Paths List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Your Saved Paths</h3>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {savedPaths.length} paths
              </span>
            </div>
            <div className="space-y-3">
              {savedPaths.map((path) => (
                <div 
                  key={path.id} 
                  className={`glass-card-hover p-5 cursor-pointer ${
                    selectedPath?.id === path.id ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => handleViewPath(path)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{path.path_name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{path.path_details_json.field || 'Career Path'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {path.path_details_json.analysis?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/70">
                        <Calendar className="w-3 h-3" />
                        <span>Saved {new Date(path.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewPath(path)
                        }}
                        className="btn-ghost h-9 w-9 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePath(path.id)
                        }}
                        className="h-9 w-9 p-0 text-destructive bg-destructive/10 hover:bg-destructive/20 border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Path Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Path Details</h3>
            {selectedPath ? (
              <div className="glass-card p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground">{selectedPath.path_name}</h4>
                </div>
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-sans">
                    {selectedPath.path_details_json.analysis || 'No detailed analysis available.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Select a saved path to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
