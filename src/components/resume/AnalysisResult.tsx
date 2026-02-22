import { memo, useState, useCallback } from 'react'
import { CheckCircle2, Loader2, Target, Star, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ArrowRight, Compass, MessageCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnalysisData, RoleSuggestion } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Role Suggestion Card
// ─────────────────────────────────────────────────────────────────────────────

interface RoleSuggestionCardProps {
  suggestion: RoleSuggestion
  index: number
  isExpanded: boolean
  onToggle: () => void
}

const RoleSuggestionCard = memo(({ 
  suggestion, 
  index, 
  isExpanded, 
  onToggle 
}: RoleSuggestionCardProps) => {
  const matchColor = suggestion.match >= 90 ? '#10b981' 
    : suggestion.match >= 80 ? '#3b82f6' 
    : '#f59e0b'

  const matchBgColor = suggestion.match >= 90 ? 'rgba(16, 185, 129, 0.2)' 
    : suggestion.match >= 80 ? 'rgba(59, 130, 246, 0.2)' 
    : 'rgba(245, 158, 11, 0.2)'

  return (
    <div className="bg-muted/20 rounded-xl border border-border/50 overflow-hidden transition-all duration-200">
      <div 
        className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: matchColor }}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h5 className="text-lg font-semibold text-foreground">{suggestion.role}</h5>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: matchBgColor, color: matchColor }}
                >
                  {suggestion.match}% Match
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">{suggestion.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center relative"
              style={{
                background: `conic-gradient(${matchColor} ${suggestion.match * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
              }}
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: matchColor }}>
                  {suggestion.match}%
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
          {suggestion.whyItFits && (
            <div>
              <h6 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Why This Role Fits
              </h6>
              <p className="text-muted-foreground text-sm leading-relaxed pl-6">
                {suggestion.whyItFits}
              </p>
            </div>
          )}

          {suggestion.skillsToHighlight && suggestion.skillsToHighlight.length > 0 && (
            <div>
              <h6 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Skills to Highlight
              </h6>
              <ul className="space-y-1 pl-6">
                {suggestion.skillsToHighlight.map((skill, skillIndex) => (
                  <li key={skillIndex} className="text-muted-foreground text-sm flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestion.skillsToDevelop && suggestion.skillsToDevelop.length > 0 && (
            <div>
              <h6 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                Skills to Develop
              </h6>
              <ul className="space-y-1 pl-6">
                {suggestion.skillsToDevelop.map((skill, skillIndex) => (
                  <li key={skillIndex} className="text-muted-foreground text-sm flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

RoleSuggestionCard.displayName = 'RoleSuggestionCard'

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Result
// ─────────────────────────────────────────────────────────────────────────────

interface AnalysisResultProps {
  analysisResult: AnalysisData | null
  suggestionsResult: AnalysisData | null
  targetRole: string
  isAnalyzing: boolean
  loadingMessage: string
  headerRef?: React.RefObject<HTMLDivElement>
}

export const AnalysisResult = memo(({
  analysisResult,
  suggestionsResult,
  targetRole,
  isAnalyzing,
  loadingMessage,
  headerRef
}: AnalysisResultProps) => {
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set([0]))

  const toggleRoleExpansion = useCallback((index: number) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const suggestions = (analysisResult?.suggestions?.length ? analysisResult.suggestions : null) ?? suggestionsResult?.suggestions
  const analysis = analysisResult?.analysis || suggestionsResult?.analysis
  const strengths = (analysisResult?.overallStrengths?.length ? analysisResult.overallStrengths : null) ?? suggestionsResult?.overallStrengths
  const improvements = (analysisResult?.improvementsToConsider?.length ? analysisResult.improvementsToConsider : null) ?? suggestionsResult?.improvementsToConsider

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div ref={headerRef} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            {isAnalyzing 
              ? loadingMessage 
              : analysisResult 
                ? `Analysis Results for ${targetRole}` 
                : 'Career Analysis Report'}
          </h3>
        </div>
        
        {/* Analysis Summary */}
        {analysis && (
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {analysis}
            </p>
          </div>
        )}
      </div>

      {/* Role Suggestion Cards */}
      {suggestions && suggestions.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            {isAnalyzing 
              ? 'Generating Recommendations...' 
              : `Top ${suggestions.length} Recommended Roles`}
          </h4>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <RoleSuggestionCard
                key={index}
                suggestion={suggestion}
                index={index}
                isExpanded={expandedRoles.has(index)}
                onToggle={() => toggleRoleExpansion(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overall Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            Resume Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements to Consider */}
      {improvements && improvements.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Improvements to Consider
          </h4>
          <ul className="space-y-2">
            {improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps - Only show when analysis is complete */}
      {!isAnalyzing && (analysis || suggestions) && (
        <div className="glass-card p-6 border-t-2 border-primary/20">
          <h4 className="text-lg font-semibold text-foreground mb-4">What's Next?</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 px-4 justify-start gap-3 text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'career' }))}
            >
              <Compass className="w-5 h-5 text-secondary flex-shrink-0" />
              <div>
                <span className="font-medium text-foreground block">Explore Career Paths</span>
                <span className="text-xs text-muted-foreground">Dive deeper into matching roles</span>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-4 justify-start gap-3 text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'chat' }))}
            >
              <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium text-foreground block">Chat with AI</span>
                <span className="text-xs text-muted-foreground">Ask about improving gaps</span>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-4 justify-start gap-3 text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'saved' }))}
            >
              <BookOpen className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <span className="font-medium text-foreground block">View Saved Paths</span>
                <span className="text-xs text-muted-foreground">Track your career collection</span>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})

AnalysisResult.displayName = 'AnalysisResult'
