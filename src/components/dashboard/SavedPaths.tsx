import { useState, useEffect, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Trash2, 
  Eye, 
  Loader2, 
  FolderOpen, 
  Calendar, 
  Sparkles,
  AlertCircle,
  RefreshCw,
  Compass,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useResumeStore } from '@/stores/resumeStore'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SavedPath {
  id: number
  path_name: string
  path_details_json: Record<string, unknown>
  created_at: string
  user_id: string | null
}

// Helper to safely extract string properties from path_details_json
const getPathField = (json: Record<string, unknown>, key: string): string | undefined => {
  const value = json?.[key]
  return typeof value === 'string' ? value : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PathCardSkeleton = memo(() => (
  <div className="glass-card p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
      <div className="flex gap-2 ml-4">
        <div className="h-9 w-9 bg-muted rounded" />
        <div className="h-9 w-9 bg-muted rounded" />
      </div>
    </div>
  </div>
))
PathCardSkeleton.displayName = 'PathCardSkeleton'

const DetailsSkeleton = memo(() => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-muted" />
      <div className="h-6 bg-muted rounded w-1/2" />
    </div>
    <div className="bg-muted/30 rounded-xl p-5 space-y-3">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
  </div>
))
DetailsSkeleton.displayName = 'DetailsSkeleton'

// ─────────────────────────────────────────────────────────────────────────────
// PATH CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface PathCardProps {
  path: SavedPath
  isSelected: boolean
  onView: (path: SavedPath) => void
  onDelete: (pathId: number) => void
  isDeleting: boolean
}

const PathCard = memo<PathCardProps>(({ path, isSelected, onView, onDelete, isDeleting }) => (
  <div 
    className={`glass-card-hover p-5 cursor-pointer transition-all ${
      isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''
    }`}
    onClick={() => onView(path)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onView(path)}
    aria-selected={isSelected}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{path.path_name}</h4>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>{getPathField(path.path_details_json, 'field') || 'Career Path'}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {getPathField(path.path_details_json, 'analysis')?.substring(0, 100) || 'No description available'}...
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
            onView(path)
          }}
          className="btn-ghost h-9 w-9 p-0"
          aria-label={`View ${path.path_name}`}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(path.id)
          }}
          disabled={isDeleting}
          className="h-9 w-9 p-0 text-destructive bg-destructive/10 hover:bg-destructive/20 border-0"
          aria-label={`Delete ${path.path_name}`}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  </div>
))
PathCard.displayName = 'PathCard'

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasResume: boolean
  hasAnalysis: boolean
  onNavigateToExplorer: () => void
  onNavigateToAnalyzer: () => void
}

const EmptyState = memo<EmptyStateProps>(({ 
  hasResume, 
  hasAnalysis, 
  onNavigateToExplorer,
  onNavigateToAnalyzer 
}) => {
  // Determine what the user should do next
  const getGuidance = () => {
    if (!hasResume) {
      return {
        title: "Start with your resume",
        description: "Upload your resume first to get personalized career suggestions, then explore and save paths that interest you.",
        action: "Upload Resume",
        onClick: onNavigateToAnalyzer,
        icon: Sparkles
      }
    }
    
    if (!hasAnalysis) {
      return {
        title: "Analyze your resume",
        description: "Your resume is uploaded! Run the analysis to get AI-powered career suggestions you can explore and save.",
        action: "Analyze Resume",
        onClick: onNavigateToAnalyzer,
        icon: Sparkles
      }
    }
    
    return {
      title: "Explore career paths",
      description: "You have career suggestions ready! Explore them in detail and save the ones that match your goals.",
      action: "Explore Careers",
      onClick: onNavigateToExplorer,
      icon: Compass
    }
  }

  const guidance = getGuidance()
  const Icon = guidance.icon

  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
        <FolderOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No saved paths yet</h3>
      <p className="text-muted-foreground mb-6">
        {guidance.description}
      </p>
      
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-3 h-3 rounded-full ${hasResume ? 'bg-green-500' : 'bg-muted'}`} />
        <div className="w-8 h-0.5 bg-muted" />
        <div className={`w-3 h-3 rounded-full ${hasAnalysis ? 'bg-green-500' : 'bg-muted'}`} />
        <div className="w-8 h-0.5 bg-muted" />
        <div className="w-3 h-3 rounded-full bg-muted" />
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {hasResume && hasAnalysis ? 'Step 3: Explore & save' : hasResume ? 'Step 2: Analyze resume' : 'Step 1: Upload resume'}
      </p>

      <Button 
        onClick={guidance.onClick}
        className="btn-primary"
      >
        <Icon className="w-4 h-4 mr-2" />
        {guidance.action}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
})
EmptyState.displayName = 'EmptyState'

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string
  onRetry: () => void
  isRetrying: boolean
}

const ErrorState = memo<ErrorStateProps>(({ message, onRetry, isRetrying }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="w-8 h-8 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load saved paths</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
    <Button onClick={onRetry} disabled={isRetrying} className="btn-secondary">
      {isRetrying ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </>
      )}
    </Button>
  </div>
))
ErrorState.displayName = 'ErrorState'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000

export const SavedPaths = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedPath, setSelectedPath] = useState<SavedPath | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deletingPathId, setDeletingPathId] = useState<number | null>(null)
  
  const { toast } = useToast()
  
  // Get global state for context awareness and caching
  const { 
    resumeFileName, 
    analysisResult,
    savedPaths: cachedPaths,
    savedPathsLoaded,
    savedPathsLastFetch,
    setSavedPaths: setCachedPaths,
    removeSavedPath: removeCachedPath
  } = useResumeStore()
  
  const hasResume = !!resumeFileName
  const hasAnalysis = !!analysisResult

  // Use cached paths
  const savedPaths = cachedPaths as SavedPath[]

  // Check if cache is still valid
  const isCacheValid = savedPathsLoaded && 
    savedPathsLastFetch && 
    (Date.now() - savedPathsLastFetch) < CACHE_DURATION_MS

  // ─────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────
  const loadSavedPaths = useCallback(async (forceRefresh = false) => {
    // Skip if cache is valid and not forcing refresh
    if (isCacheValid && !forceRefresh) {
      return
    }

    setIsLoading(true)
    setLoadError(null)
    
    try {
      const { data, error } = await supabase
        .from('saved_paths')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Cast the data to our interface - path_details_json comes as Json from Supabase
      const typedData: SavedPath[] = (data || []).map(item => ({
        ...item,
        user_id: item.user_id,
        path_details_json: (typeof item.path_details_json === 'object' && item.path_details_json !== null)
          ? item.path_details_json as Record<string, unknown>
          : {}
      }))
      setCachedPaths(typedData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load saved paths'
      console.error('Load paths error:', error)
      setLoadError(message)
      toast({
        title: "Load failed",
        description: message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [isCacheValid, setCachedPaths, toast])

  useEffect(() => {
    loadSavedPaths()
  }, [loadSavedPaths])

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleViewPath = useCallback((path: SavedPath) => {
    setSelectedPath(path)
  }, [])

  const handleDeletePath = useCallback(async (pathId: number) => {
    if (!confirm('Are you sure you want to delete this career path?')) return

    setDeletingPathId(pathId)
    
    try {
      const { error } = await supabase
        .from('saved_paths')
        .delete()
        .eq('id', pathId)

      if (error) throw error

      // Update cached store
      removeCachedPath(pathId)
      if (selectedPath?.id === pathId) {
        setSelectedPath(null)
      }
      toast({
        title: "Path deleted",
        description: "Career path removed from your collection",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete career path'
      console.error('Delete path error:', error)
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive"
      })
    } finally {
      setDeletingPathId(null)
    }
  }, [selectedPath?.id, removeCachedPath, toast])

  // Navigation handlers for empty state CTAs
  const handleNavigateToExplorer = useCallback(() => {
    // This will need to be connected to parent Dashboard component
    // For now, dispatch a custom event that Dashboard can listen to
    window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'career' }))
  }, [])

  const handleNavigateToAnalyzer = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'resume' }))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE - Only show skeleton if no cached data and actively loading
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading && savedPaths.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-muted rounded-full w-32 mx-auto mb-4" />
          <div className="h-8 bg-muted rounded w-64 mx-auto mb-3" />
          <div className="h-4 bg-muted rounded w-96 mx-auto" />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="h-6 bg-muted rounded-full w-20" />
            </div>
            <PathCardSkeleton />
            <PathCardSkeleton />
            <PathCardSkeleton />
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-28" />
            <DetailsSkeleton />
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Loading your saved career paths...
        </p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loadError && savedPaths.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Saved Paths</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Your Career Collection
          </h2>
        </div>
        
        <ErrorState 
          message={loadError} 
          onRetry={() => loadSavedPaths(true)}
          isRetrying={isLoading}
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <article className="space-y-8" aria-labelledby="saved-paths-heading">
      {/* Header */}
      <header className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4" aria-hidden="true">
          <BookOpen className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">Saved Paths</span>
        </div>
        <h2 id="saved-paths-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Your Career Collection
        </h2>
        <p className="text-muted-foreground">
          Keep track of career paths you want to explore later.
        </p>
      </header>

      {savedPaths.length === 0 ? (
        <EmptyState 
          hasResume={hasResume}
          hasAnalysis={hasAnalysis}
          onNavigateToExplorer={handleNavigateToExplorer}
          onNavigateToAnalyzer={handleNavigateToAnalyzer}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Paths List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Your Saved Paths</h3>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {savedPaths.length} path{savedPaths.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {savedPaths.map((path) => (
                <PathCard
                  key={path.id}
                  path={path}
                  isSelected={selectedPath?.id === path.id}
                  onView={handleViewPath}
                  onDelete={handleDeletePath}
                  isDeleting={deletingPathId === path.id}
                />
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
                    {getPathField(selectedPath.path_details_json, 'analysis') || 'No detailed analysis available.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">Select a saved path to view details</p>
                <p className="text-xs text-muted-foreground/70">
                  Click any path on the left to see the full analysis
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
