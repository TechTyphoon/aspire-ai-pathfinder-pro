import { useState, useCallback, useMemo, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useStreamingAI } from '@/hooks/useStreamingAI'
import { useResumeStore } from '@/stores/resumeStore'
import { supabase } from '@/integrations/supabase/client'
import type { RoleSuggestion, AnalysisData, AnalysisType, LoadingPhase } from '@/types'

// Re-export types for consumers
export type { RoleSuggestion, AnalysisData, AnalysisType, LoadingPhase }

// ─────────────────────────────────────────────────────────────────────────────
// Loading Messages
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_ANALYSIS_MESSAGES = [
  "Parsing your resume content...",
  "Identifying key skills and experiences...",
  "Analyzing technical competencies...",
  "Evaluating work history patterns...",
  "Matching against role requirements...",
  "Assessing strengths and growth areas...",
  "Generating personalized insights...",
  "Preparing your career analysis..."
] as const

const SUGGESTIONS_MESSAGES = [
  "Reading your professional background...",
  "Mapping your skill landscape...",
  "Discovering career possibilities...",
  "Analyzing industry fit patterns...",
  "Evaluating growth trajectories...",
  "Finding your best-fit roles...",
  "Calculating match percentages...",
  "Crafting personalized recommendations..."
] as const

// ─────────────────────────────────────────────────────────────────────────────
// JSON Parsing Utilities
// ─────────────────────────────────────────────────────────────────────────────

function parsePartialJSON(text: string): Partial<AnalysisData> {
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // Continue to partial extraction
      }
    }

    const partial: Partial<AnalysisData> = {}
    
    // Extract "analysis" value — handles escaped quotes and unicode
    // First try: properly terminated string
    let analysisContent: string | null = null
    const analysisMatch = cleaned.match(/"analysis"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
    if (analysisMatch) {
      analysisContent = analysisMatch[1]
    } else {
      // Fallback: unterminated string (truncated stream)
      const unterminatedMatch = cleaned.match(/"analysis"\s*:\s*"((?:[^"\\]|\\.)*)/s)
      if (unterminatedMatch) {
        analysisContent = unterminatedMatch[1]
      }
    }
    if (analysisContent) {
      partial.analysis = analysisContent
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
    
    // Extract suggestions array — works even if truncated
    const suggestionsMatch = cleaned.match(/"suggestions"\s*:\s*\[([\s\S]*?)(?:\]|$)/s)
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1]
      const suggestions: RoleSuggestion[] = []
      
      // Extract individual role objects with all available fields
      const roleBlocks = suggestionsText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || []
      for (const block of roleBlocks) {
        try {
          // Try full parse of each suggestion block
          const parsed = JSON.parse(block)
          if (parsed.role && typeof parsed.match === 'number') {
            suggestions.push(parsed)
            continue
          }
        } catch {
          // Fall back to regex extraction
        }
        
        const roleMatch = block.match(/"role"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
        const matchMatch = block.match(/"match"\s*:\s*(\d+)/)
        const descMatch = block.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
        const whyMatch = block.match(/"whyItFits"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
        
        if (roleMatch && matchMatch) {
          const suggestion: RoleSuggestion = {
            role: roleMatch[1].replace(/\\"/g, '"'),
            match: parseInt(matchMatch[1]),
            description: descMatch?.[1]?.replace(/\\"/g, '"') || ''
          }
          if (whyMatch) {
            suggestion.whyItFits = whyMatch[1].replace(/\\"/g, '"')
          }
          
          // Extract array fields
          const highlightMatch = block.match(/"skillsToHighlight"\s*:\s*\[([\s\S]*?)(?:\]|$)/)
          if (highlightMatch) {
            const skills = highlightMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)
            if (skills) {
              suggestion.skillsToHighlight = skills.map(s => s.slice(1, -1).replace(/\\"/g, '"'))
            }
          }
          
          const developMatch = block.match(/"skillsToDevelop"\s*:\s*\[([\s\S]*?)(?:\]|$)/)
          if (developMatch) {
            const skills = developMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)
            if (skills) {
              suggestion.skillsToDevelop = skills.map(s => s.slice(1, -1).replace(/\\"/g, '"'))
            }
          }
          
          suggestions.push(suggestion)
        }
      }
      
      if (suggestions.length > 0) {
        partial.suggestions = suggestions
      }
    }
    
    // Extract strengths and improvements
    const strengthsMatch = cleaned.match(/"overallStrengths"\s*:\s*\[([\s\S]*?)(?:\]|$)/)
    if (strengthsMatch) {
      const items = strengthsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)
      if (items) {
        partial.overallStrengths = items.map(s => s.slice(1, -1).replace(/\\"/g, '"'))
      }
    }
    
    const improvementsMatch = cleaned.match(/"improvementsToConsider"\s*:\s*\[([\s\S]*?)(?:\]|$)/)
    if (improvementsMatch) {
      const items = improvementsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)
      if (items) {
        partial.improvementsToConsider = items.map(s => s.slice(1, -1).replace(/\\"/g, '"'))
      }
    }
    
    return partial
  } catch {
    return {}
  }
}

function parseFinalJSON(text: string): AnalysisData {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  
  // Try to find a complete JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // JSON is malformed (likely truncated stream) — try partial extraction
      const partial = parsePartialJSON(jsonMatch[0])
      if (partial.analysis || partial.suggestions) {
        return partial as AnalysisData
      }
    }
  }
  
  // No closing brace found (severely truncated) — try partial extraction on raw text
  if (cleaned.startsWith('{')) {
    const partial = parsePartialJSON(cleaned)
    if (partial.analysis || partial.suggestions) {
      return partial as AnalysisData
    }
  }
  
  // Last resort: the text itself is the analysis content
  return { analysis: text }
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Utility
// ─────────────────────────────────────────────────────────────────────────────

async function uploadResumeFile(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to upload files')

  const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file)

  if (error) throw error
  return filePath
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useResumeAnalysis() {
  const { toast } = useToast()
  const { stream } = useStreamingAI()

  // Global store
  const {
    resumeFile,
    resumeFileName,
    uploadedFilePath,
    analysisResult,
    suggestionsResult,
    targetRole,
    isAnalyzing,
    analyzeError,
    setResumeFile,
    setAnalysisResult,
    setSuggestionsResult,
    setTargetRole,
    setIsAnalyzing,
    setAnalyzeError,
    clearResume,
  } = useResumeStore()

  // Local UI state
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null)
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // Rotate loading messages
  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingMessageIndex(0)
      return
    }

    const messages = analysisType === 'suggestions' ? SUGGESTIONS_MESSAGES : ROLE_ANALYSIS_MESSAGES
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isAnalyzing, analysisType])

  // Derived state
  const hasResume = resumeFile !== null || resumeFileName !== null

  const loadingMessage = useMemo(() => {
    const messages = analysisType === 'suggestions' ? SUGGESTIONS_MESSAGES : ROLE_ANALYSIS_MESSAGES
    return messages[loadingMessageIndex] || 'Processing...'
  }, [analysisType, loadingMessageIndex])

  // Memoized partial JSON parser
  const memoizedParsePartial = useCallback((text: string) => {
    return parsePartialJSON(text)
  }, [])

  // Analyze for specific role
  const analyzeForRole = useCallback(async () => {
    if ((!resumeFile && !uploadedFilePath) || !targetRole.trim()) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisType('role')
    setAnalyzeError(null)
    setLoadingPhase('preparing')
    setAnalysisResult(null)
    setSuggestionsResult(null) // Clear both to show loading skeleton

    try {
      let filePath = uploadedFilePath
      if (!filePath && resumeFile) {
        filePath = await uploadResumeFile(resumeFile)
        setResumeFile(resumeFile, filePath)
      }

      if (!filePath) {
        throw new Error('No resume file available')
      }

      setLoadingPhase('analyzing')

      const fullText = await stream({
        endpoint: 'analyze-resume',
        body: {
          filePath,
          analysisType: 'target-role',
          targetRole
        },
        onChunk: (_, accumulated) => {
          // Only show partial results after meaningful content (100+ chars)
          // This ensures the loading skeleton displays for a reasonable duration
          if (accumulated.length < 100) return
          
          const partialResult = memoizedParsePartial(accumulated)
          if (Object.keys(partialResult).length > 0 && partialResult.analysis) {
            setAnalysisResult(partialResult as AnalysisData)
          }
        }
      })

      setLoadingPhase('finalizing')
      const finalResult = parseFinalJSON(fullText)
      setAnalysisResult(finalResult)

      toast({
        title: "Analysis complete",
        description: `Resume analyzed for ${targetRole} role`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to analyze resume. Please try again.'
      setAnalyzeError(errorMessage)
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setLoadingPhase(null)
      setAnalysisType(null)
    }
  }, [resumeFile, uploadedFilePath, targetRole, stream, memoizedParsePartial, setIsAnalyzing, setAnalyzeError, setAnalysisResult, setSuggestionsResult, setResumeFile, toast])

  // Suggest best-fit roles
  const suggestRoles = useCallback(async () => {
    if (!resumeFile && !uploadedFilePath) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisType('suggestions')
    setAnalyzeError(null)
    setLoadingPhase('preparing')
    setAnalysisResult(null) // Clear both to show loading skeleton
    setSuggestionsResult(null)

    try {
      let filePath = uploadedFilePath
      if (!filePath && resumeFile) {
        filePath = await uploadResumeFile(resumeFile)
        setResumeFile(resumeFile, filePath)
      }

      if (!filePath) {
        throw new Error('No resume file available')
      }

      setLoadingPhase('analyzing')

      const fullText = await stream({
        endpoint: 'analyze-resume',
        body: {
          filePath,
          analysisType: 'best-fit'
        },
        onChunk: (_, accumulated) => {
          // Only show partial results after meaningful content (100+ chars)
          // This ensures the loading skeleton displays for a reasonable duration
          if (accumulated.length < 100) return
          
          const partialResult = memoizedParsePartial(accumulated)
          if (Object.keys(partialResult).length > 0 && partialResult.analysis) {
            setSuggestionsResult(partialResult as AnalysisData)
          }
        }
      })

      setLoadingPhase('finalizing')
      const finalResult = parseFinalJSON(fullText)
      setSuggestionsResult(finalResult)

      toast({
        title: "Suggestions ready",
        description: "Career role suggestions generated",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to generate role suggestions. Please try again.'
      setAnalyzeError(errorMessage)
      toast({
        title: "Suggestions failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setLoadingPhase(null)
      setAnalysisType(null)
    }
  }, [resumeFile, uploadedFilePath, stream, memoizedParsePartial, setIsAnalyzing, setAnalyzeError, setAnalysisResult, setSuggestionsResult, setResumeFile, toast])

  // Button states
  const analyzeButtonDisabled = !hasResume || !targetRole.trim() || isAnalyzing
  const analyzeButtonHint = useMemo(() => {
    if (!hasResume) return 'Upload a resume first to analyze'
    if (!targetRole.trim()) return 'Enter a target role above'
    if (isAnalyzing) return 'Analysis in progress...'
    return null
  }, [hasResume, targetRole, isAnalyzing])

  const suggestButtonDisabled = !hasResume || isAnalyzing
  const suggestButtonHint = useMemo(() => {
    if (!hasResume) return 'Upload a resume first to get suggestions'
    if (isAnalyzing) return 'Analysis in progress...'
    return null
  }, [hasResume, isAnalyzing])

  return {
    // State
    resumeFile,
    resumeFileName,
    uploadedFilePath,
    analysisResult,
    suggestionsResult,
    targetRole,
    isAnalyzing,
    analyzeError,
    hasResume,
    loadingPhase,
    analysisType,
    loadingMessage,
    loadingMessageIndex,

    // Actions
    setResumeFile,
    setTargetRole,
    setAnalyzeError,
    clearResume,
    analyzeForRole,
    suggestRoles,

    // Button states
    analyzeButtonDisabled,
    analyzeButtonHint,
    suggestButtonDisabled,
    suggestButtonHint,
  }
}
