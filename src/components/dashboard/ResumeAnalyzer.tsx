import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Brain, Loader2, CheckCircle2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis'
import { UploadZone, AnalysisProgress, AnalysisResult } from '@/components/resume'

export const ResumeAnalyzer = () => {
  const {
    // State
    resumeFile,
    resumeFileName,
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
  } = useResumeAnalysis()

  // Local UI state only
  const [isDragActive, setIsDragActive] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Ref to track and cancel ongoing scroll animations
  const scrollAnimationRef = useRef<number | null>(null)

  // Premium smooth scroll with easing - cancellable
  const smoothScrollTo = useCallback((element: HTMLElement, offset = 0) => {
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }

    const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset
    const startPosition = window.scrollY
    const distance = targetPosition - startPosition

    if (Math.abs(distance) < 5) return

    const duration = Math.min(600, Math.max(300, Math.abs(distance) * 0.5))
    let startTime: number | null = null

    const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      const easeProgress = easeOutExpo(progress)

      window.scrollTo({
        top: startPosition + distance * easeProgress,
        behavior: 'instant'
      })

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animation)
      } else {
        scrollAnimationRef.current = null
      }
    }

    scrollAnimationRef.current = requestAnimationFrame(animation)
  }, [])

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }
    }
  }, [])

  // Auto-scroll to loading indicator when analysis starts
  useEffect(() => {
    if (isAnalyzing && loadingRef.current) {
      const timeoutId = setTimeout(() => {
        if (loadingRef.current) {
          smoothScrollTo(loadingRef.current, 100)
        }
      }, 80)
      return () => clearTimeout(timeoutId)
    }
  }, [isAnalyzing, smoothScrollTo])

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if (!isAnalyzing && (analysisResult || suggestionsResult) && resultsRef.current) {
      const timeoutId = setTimeout(() => {
        if (resultsRef.current) {
          smoothScrollTo(resultsRef.current, 60)
        }
      }, 120)
      return () => clearTimeout(timeoutId)
    }
  }, [isAnalyzing, analysisResult, suggestionsResult, smoothScrollTo])

  // Drag and drop handlers
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setResumeFile(event.target.files[0])
    }
  }, [setResumeFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0])
    }
  }, [setResumeFile])

  return (
    <article className="space-y-8" aria-labelledby="resume-analyzer-heading">
      {/* Header */}
      <header className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4" aria-hidden="true">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Resume Analysis</span>
        </div>
        <h2 id="resume-analyzer-heading" className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Unlock Your Resume's Potential
        </h2>
        <p className="text-muted-foreground">
          Analyze your resume against target roles and identify gaps.
        </p>
      </header>

      {/* File Upload Section */}
      <div className="relative">
        <UploadZone
          selectedFile={resumeFile}
          resumeFileName={resumeFileName}
          isDragActive={isDragActive}
          onFileChange={handleFileChange}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClear={clearResume}
        />
      </div>

      {/* Resume uploaded indicator */}
      {resumeFileName && !resumeFile && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Using previously uploaded resume: "{resumeFileName}"</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearResume}
            className="ml-2 h-7 px-2 text-muted-foreground hover:text-destructive"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Analysis already exists indicator */}
      {(analysisResult || suggestionsResult) && !isAnalyzing && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Analysis completed • Scroll down to view results or run a new analysis
          </span>
        </div>
      )}

      {/* Error State */}
      {analyzeError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20" role="alert">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <span className="text-sm font-medium text-destructive block">Analysis couldn't be completed</span>
              <span className="text-xs text-destructive/80">
                {analyzeError.toLowerCase().includes('network') || analyzeError.toLowerCase().includes('fetch')
                  ? 'Check your internet connection and try again.'
                  : analyzeError.toLowerCase().includes('file') || analyzeError.toLowerCase().includes('upload')
                    ? 'There was an issue with your file. Try re-uploading your resume.'
                    : 'Try again, or upload a different resume file.'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnalyzeError(null)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
        </div>
      )}

      {/* Analysis Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Target Role Analysis */}
        <div className="glass-card-hover p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Analyze for Specific Role</h3>
              <p className="text-sm text-muted-foreground">Match your resume to a target position</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-role" className="text-sm font-medium text-foreground">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g., Software Engineer, Data Scientist"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-2 input-modern"
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground mt-1.5">Enter the job title you're applying for</p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={analyzeForRole}
                disabled={analyzeButtonDisabled}
                className="w-full btn-primary"
              >
                {isAnalyzing && analysisType === 'role' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {loadingPhase === 'preparing' ? 'Preparing...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze for This Role
                  </>
                )}
              </Button>
              {analyzeButtonHint && !isAnalyzing && (
                <p className="text-xs text-muted-foreground text-center">{analyzeButtonHint}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role Suggestions */}
        <div className="glass-card-hover p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Discover Best Fit Roles</h3>
              <p className="text-sm text-muted-foreground">Let AI suggest career paths for you</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Our AI will analyze your skills and experience to recommend the most suitable career paths
          </p>
          <div className="space-y-2">
            <Button 
              onClick={suggestRoles}
              disabled={suggestButtonDisabled}
              className="w-full btn-secondary"
            >
              {isAnalyzing && analysisType === 'suggestions' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingPhase === 'preparing' ? 'Preparing...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Suggest Roles
                </>
              )}
            </Button>
            {suggestButtonHint && !isAnalyzing && (
              <p className="text-xs text-muted-foreground text-center">{suggestButtonHint}</p>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isAnalyzing && !analysisResult && !suggestionsResult && (
        <div ref={loadingRef}>
          <AnalysisProgress
            loadingMessage={loadingMessage}
            loadingMessageIndex={loadingMessageIndex}
          />
        </div>
      )}

      {/* Results Display */}
      {(analysisResult || suggestionsResult) && (
        <div ref={resultsRef}>
          <AnalysisResult
            analysisResult={analysisResult}
            suggestionsResult={suggestionsResult}
            targetRole={targetRole}
            isAnalyzing={isAnalyzing}
            loadingMessage={loadingMessage}
            headerRef={headerRef}
          />
        </div>
      )}
    </article>
  )
}
