import { useState, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, TrendingUp, BookOpen, Loader2, Sparkles, Save, ArrowRight, AlertTriangle, RefreshCw, FileText, Upload, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStreamingAI } from '@/hooks/useStreamingAI'
import { supabase } from '@/integrations/supabase/client'
import { useResumeStore } from '@/stores/resumeStore'
import { CareerExplorationSkeleton, LoadingIndicator } from '@/components/ui/loading-skeletons'

// Quick explore field type
interface QuickExploreField {
  name: string
  icon: string
}

// Memoized Quick Explore Card
const QuickExploreCard = memo(({
  field,
  onClick,
  disabled
}: {
  field: QuickExploreField
  onClick: () => void
  disabled: boolean
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="quick-action group relative"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{field.icon}</span>
        <div className="text-left">
          <span className="text-sm font-medium text-foreground block">{field.name}</span>
          <span className="text-xs text-muted-foreground">Explore path</span>
        </div>
      </div>
      <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
})

QuickExploreCard.displayName = 'QuickExploreCard'

export const CareerExplorer = () => {
  // Global store
  const {
    resumeFileName,
    resumeFile,
    careerExplorationResult,
    careerField,
    isExploring,
    exploreError,
    setCareerExplorationResult,
    setCareerField,
    setIsExploring,
    setExploreError,
  } = useResumeStore()

  // Local state
  const [loadingPhase, setLoadingPhase] = useState<'preparing' | 'exploring' | 'finalizing' | null>(null)
  
  const { toast } = useToast()
  const { stream } = useStreamingAI()
  const resultsRef = useRef<HTMLDivElement>(null)

  const hasResume = resumeFile !== null || resumeFileName !== null

  const handleExplore = useCallback(async (fieldOverride?: string) => {
    const fieldToExplore = fieldOverride ?? careerField
    
    if (!fieldToExplore.trim()) {
      toast({
        title: "Field required",
        description: "Please enter a career field to explore",
        variant: "destructive"
      })
      return
    }

    // Update the field in store if using override
    if (fieldOverride) {
      setCareerField(fieldOverride)
    }

    setIsExploring(true)
    setExploreError(null)
    setLoadingPhase('preparing')
    setCareerExplorationResult(null)
    
    let hasScrolled = false
    const streamStartTime = new Date()

    try {
      setLoadingPhase('exploring')
      
      await stream({
        endpoint: 'career-mentor',
        body: {
          question: `I want to explore a career in ${fieldToExplore}. Can you provide me with a comprehensive career path analysis including job responsibilities, required skills, salary expectations, career progression, and market outlook?`
        },
        onChunk: (_, accumulated) => {
          setCareerExplorationResult({
            field: fieldToExplore,
            content: accumulated,
            timestamp: streamStartTime
          })
          
          // Scroll to results on first content chunk
          if (!hasScrolled && accumulated.length > 10 && resultsRef.current) {
            hasScrolled = true
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              })
            }, 100)
          }
        }
      })

      setLoadingPhase('finalizing')
      
      toast({
        title: "Exploration complete",
        description: `Career insights for ${fieldToExplore} are ready`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to explore career field. Please try again.'
      setExploreError(errorMessage)
      toast({
        title: "Exploration failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsExploring(false)
      setLoadingPhase(null)
    }
  }, [careerField, setCareerField, setIsExploring, setExploreError, setCareerExplorationResult, toast, stream])

  const handleSavePath = async () => {
    if (!careerExplorationResult) {
      toast({
        title: "Nothing to save",
        description: "Please explore a career path first",
        variant: "destructive"
      })
      return
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save career paths",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('saved_paths')
        .insert({
          user_id: user.id,
          path_name: `${careerField} Career Path`,
          path_details_json: {
            field: careerField,
            analysis: careerExplorationResult.content,
            saved_at: new Date().toISOString()
          }
        })

      if (error) throw error

      toast({
        title: "Path saved",
        description: `${careerField} career path saved to your collection`,
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save career path. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleQuickExplore = useCallback((fieldName: string) => {
    // Pass field directly to avoid stale closure issue
    handleExplore(fieldName)
  }, [handleExplore])

  const getLoadingMessage = () => {
    switch (loadingPhase) {
      case 'preparing':
        return 'Preparing career analysis...'
      case 'exploring':
        return 'AI is researching career insights'
      case 'finalizing':
        return 'Finalizing results...'
      default:
        return 'Processing...'
    }
  }

  const quickExploreFields: QuickExploreField[] = [
    { name: 'Data Science', icon: '📊' },
    { name: 'Software Engineering', icon: '💻' },
    { name: 'Product Management', icon: '🚀' },
    { name: 'UX Design', icon: '🎨' },
    { name: 'Digital Marketing', icon: '📱' },
    { name: 'Cybersecurity', icon: '🔐' }
  ]

  // Button state explanations
  const exploreButtonDisabled = isExploring || !careerField.trim()
  const exploreButtonHint = !careerField.trim() 
    ? 'Enter a career field above to explore' 
    : isExploring 
      ? 'Exploration in progress...'
      : null

  return (
    <article className="space-y-8" aria-labelledby="career-explorer-heading">
      {/* Header */}
      <header className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4" aria-hidden="true">
          <TrendingUp className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-secondary">Career Explorer</span>
        </div>
        <h2 id="career-explorer-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Discover Your Next Career Move
        </h2>
        <p className="text-muted-foreground">
          Discover career paths that match your skills and experience.
        </p>
      </header>

      {/* Resume Context Indicator */}
      {hasResume && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">
            Your resume "{resumeFileName}" is available for personalized insights
          </span>
        </div>
      )}

      {/* Error State */}
      {exploreError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20" role="alert">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <span className="text-sm font-medium text-destructive block">Couldn't explore this career path</span>
              <span className="text-xs text-destructive/80">
                Check your connection and try again, or try a different career field.
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExploreError(null)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
        </div>
      )}

      {/* Search Section */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="career-field" className="text-sm font-medium text-foreground">Career Field or Role</Label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="career-field"
                placeholder="e.g., Data Science, UX Design, Digital Marketing"
                value={careerField}
                onChange={(e) => setCareerField(e.target.value)}
                className="input-modern pl-12"
                onKeyPress={(e) => e.key === 'Enter' && !isExploring && careerField.trim() && handleExplore()}
                disabled={isExploring}
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter a job title, industry, or field you're curious about</p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => handleExplore()}
              disabled={exploreButtonDisabled}
              className="w-full btn-primary"
            >
              {isExploring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingPhase === 'preparing' ? 'Preparing...' : 'Exploring...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Career Insights
                </>
              )}
            </Button>
            {exploreButtonHint && !isExploring && (
              <p className="text-xs text-muted-foreground text-center">{exploreButtonHint}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Explore Options */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Popular Career Paths</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickExploreFields.map((field) => (
            <QuickExploreCard
              key={field.name}
              field={field}
              onClick={() => handleQuickExplore(field.name)}
              disabled={isExploring}
            />
          ))}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isExploring && !careerExplorationResult && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-secondary animate-spin" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usually takes ~10 seconds</p>
              </div>
            </div>
            <LoadingIndicator 
              message={getLoadingMessage()} 
              estimatedTime="usually ~10 seconds" 
            />
          </div>
          <CareerExplorationSkeleton />
        </div>
      )}

      {/* Results Display */}
      {careerExplorationResult && (
        <div ref={resultsRef} className="glass-card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                {isExploring ? (
                  <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                ) : (
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {isExploring ? 'Generating insights...' : `Career Insights: ${careerExplorationResult.field}`}
                </h3>
                {!isExploring && (
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(careerExplorationResult.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {!isExploring && (
              <Button 
                onClick={handleSavePath}
                className="btn-ghost"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Path
              </Button>
            )}
          </div>
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50 mb-5">
            <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-sans">
              {careerExplorationResult.content}
            </pre>
          </div>
          
          {/* Next Steps */}
          {!isExploring && (
            <div className="pt-5 border-t border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-3">What's Next?</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSavePath}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save this path
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'chat' }))}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuss with AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'saved' }))}
                  className="gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  View saved paths
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!careerExplorationResult && !isExploring && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <TrendingUp className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to explore career paths</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Enter a career field above or click on a popular path to get comprehensive insights about job responsibilities, skills, salaries, and growth opportunities.
          </p>
          {!hasResume && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
              <Upload className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                Tip: Upload your resume in the Resume Analyzer tab for personalized career recommendations
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
