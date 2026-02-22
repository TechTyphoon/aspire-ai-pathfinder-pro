import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { AnalysisCardSkeleton, RoleSuggestionSkeleton } from '@/components/ui/loading-skeletons'

interface AnalysisProgressProps {
  loadingMessage: string
  loadingMessageIndex: number
}

export const AnalysisProgress = memo(({
  loadingMessage,
  loadingMessageIndex
}: AnalysisProgressProps) => {
  return (
    <div 
      className="space-y-6 animate-fade-in-up"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Analysis in progress"
    >
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center animate-pulse" aria-hidden="true">
            <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground transition-all duration-300">
              {loadingMessage}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1" aria-hidden="true">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm text-muted-foreground">Usually takes ~10 seconds</p>
            </div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div 
          className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(95, (loadingMessageIndex + 1) * 12)}
          aria-label="Analysis progress"
        >
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"
            style={{ 
              width: `${Math.min(95, (loadingMessageIndex + 1) * 12)}%`,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>
      {/* Skeleton placeholders - hidden from screen readers */}
      <div aria-hidden="true">
        <AnalysisCardSkeleton />
        <div className="space-y-4 mt-4">
          <RoleSuggestionSkeleton />
          <RoleSuggestionSkeleton />
          <RoleSuggestionSkeleton />
        </div>
      </div>
    </div>
  )
})

AnalysisProgress.displayName = 'AnalysisProgress'
