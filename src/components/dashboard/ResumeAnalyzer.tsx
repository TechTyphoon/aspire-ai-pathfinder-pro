
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [suggestionsResult, setSuggestionsResult] = useState<string | null>(null)
  const [atsScore, setAtsScore] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        })
        return
      }
      if (!file.type.includes('pdf') && !file.type.includes('document') && !file.type.includes('text')) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, DOCX, or TXT file",
          variant: "destructive"
        })
        return
      }
      setSelectedFile(file)
      setAnalysisResult(null)
      setSuggestionsResult(null)
      setAtsScore(null)
      toast({
        title: "File selected",
        description: `${file.name} is ready for analysis`,
      })
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileName = `resume_${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file)
    
    if (error) throw error
    return data.path
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !targetRole.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a resume file and enter a target role",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSuggestionsResult(null)
    
    try {
      // Upload file to Supabase storage
      const filePath = await uploadFile(selectedFile)
      
      // Call the analyze-resume edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          filePath,
          analysisType: 'target-role',
          targetRole
        }
      })

      if (error) throw error

      setAnalysisResult(data.analysis)
      setAtsScore(data.atsScore)
      
      toast({
        title: "Analysis complete",
        description: "Your resume has been analyzed successfully",
      })
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: "Analysis failed",
        description: "Unable to analyze resume. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSuggestRoles = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file first",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSuggestionsResult(null)
    
    try {
      // Upload file to Supabase storage
      const filePath = await uploadFile(selectedFile)
      
      // Call the analyze-resume edge function for role suggestions
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          filePath,
          analysisType: 'best-fit'
        }
      })

      if (error) throw error

      setSuggestionsResult(data.analysis)
      
      toast({
        title: "Role suggestions generated",
        description: "Check out the recommended career paths",
      })
    } catch (error) {
      console.error('Role suggestion error:', error)
      toast({
        title: "Analysis failed",
        description: "Unable to suggest roles. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Resume Analyzer</h2>
        <p className="text-gray-600 mb-6">
          Upload your resume to get AI-powered insights and improvement suggestions
        </p>
      </div>

      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-900 font-medium mb-2">
              {selectedFile ? selectedFile.name : "Drop your resume here"}
            </p>
            <p className="text-gray-500 text-sm">Supports PDF, DOCX, and TXT files (max 10MB)</p>
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Analysis Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Option A: Analyze for Specific Role */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Analyze for Specific Role</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g., Software Engineer, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedFile || !targetRole.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Resume'
              )}
            </Button>
          </div>
        </div>

        {/* Option B: Suggest Roles */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover Best Fit Roles</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Let AI analyze your resume and suggest suitable career roles
          </p>
          <Button 
            onClick={handleSuggestRoles}
            disabled={isAnalyzing || !selectedFile}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Suggest Roles'
            )}
          </Button>
        </div>
      </div>

      {/* Results Display */}
      {analysisResult && !isAnalyzing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Analysis Results</h3>
            </div>
            {atsScore && (
              <div className="text-right">
                <p className="text-sm text-gray-600">ATS Score</p>
                <p className="text-2xl font-bold text-blue-600">{atsScore}%</p>
              </div>
            )}
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
              {analysisResult}
            </pre>
          </div>
        </div>
      )}

      {suggestionsResult && !isAnalyzing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Suggested Roles</h3>
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
              {suggestionsResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
