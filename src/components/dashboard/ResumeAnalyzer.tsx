import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Brain, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [suggestionsResult, setSuggestionsResult] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
      setAnalysisResult(null)
      setSuggestionsResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setAnalysisResult(null)
      setSuggestionsResult(null)
    }
  }

  const uploadFile = async (file: File) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to upload files')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    // File path includes user ID as folder prefix for RLS policy compliance
    const filePath = `${user.id}/${fileName}`

    const { error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file)

    if (error) throw error
    return filePath
  }

  const handleAnalyzeForRole = async () => {
    if (!selectedFile || !targetRole.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a target role",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSuggestionsResult(null)

    try {
      const filePath = await uploadFile(selectedFile)

      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          filePath,
          analysisType: 'target-role',
          targetRole
        }
      })

      if (error) throw error

      setAnalysisResult(data.analysis)
      
      toast({
        title: "Analysis complete",
        description: `Resume analyzed for ${targetRole} role`,
      })
    } catch (error: any) {
      console.error('Analysis error:', error)
      const errorMessage = error?.message || error?.context?.body?.error || 'Unable to analyze resume. Please try again.'
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSuggestRoles = async () => {
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a resume file",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSuggestionsResult(null)

    try {
      const filePath = await uploadFile(selectedFile)

      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          filePath,
          analysisType: 'best-fit'
        }
      })

      if (error) throw error

      setSuggestionsResult(data.analysis)
      
      toast({
        title: "Suggestions ready",
        description: "Career role suggestions generated",
      })
    } catch (error: any) {
      console.error('Suggestions error:', error)
      const errorMessage = error?.message || error?.context?.body?.error || 'Unable to generate role suggestions. Please try again.'
      toast({
        title: "Suggestions failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Resume Analysis</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Unlock Your Resume's Potential
        </h2>
        <p className="text-muted-foreground">
          Get AI-powered insights about your resume and discover career opportunities tailored to your experience
        </p>
      </div>

      {/* File Upload Section */}
      <div 
        className={`upload-zone ${isDragActive ? 'active' : ''} ${selectedFile ? 'border-primary/50 bg-primary/5' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id="resume-upload"
          type="file"
          className="sr-only"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
        />
        <label htmlFor="resume-upload" className="cursor-pointer block">
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">Click or drag to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">Upload your resume</p>
              <p className="text-sm text-muted-foreground mb-2">Drag and drop or click to browse</p>
              <p className="text-xs text-muted-foreground/70">PDF, DOCX, TXT up to 10MB</p>
            </div>
          )}
        </label>
      </div>

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
              />
            </div>
            <Button 
              onClick={handleAnalyzeForRole}
              disabled={isAnalyzing || !selectedFile || !targetRole.trim()}
              className="w-full btn-primary"
            >
              {isAnalyzing && !suggestionsResult ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Resume
                </>
              )}
            </Button>
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
          <Button 
            onClick={handleSuggestRoles}
            disabled={isAnalyzing || !selectedFile}
            className="w-full btn-secondary"
          >
            {isAnalyzing && !analysisResult ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Suggest Roles
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {(analysisResult || suggestionsResult) && !isAnalyzing && (
        <div className="glass-card p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {analysisResult ? `Analysis Results for ${targetRole}` : 'Role Suggestions'}
            </h3>
          </div>
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-sans">
              {analysisResult || suggestionsResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
