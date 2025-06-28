
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Brain, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [suggestionsResult, setSuggestionsResult] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
      setAnalysisResult(null)
      setSuggestionsResult(null)
    }
  }

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

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
      // Upload file to storage
      const filePath = await uploadFile(selectedFile)

      // Call analyze-resume function
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
      // Upload file to storage
      const filePath = await uploadFile(selectedFile)

      // Call analyze-resume function
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
    } catch (error) {
      console.error('Suggestions error:', error)
      toast({
        title: "Suggestions failed",
        description: "Unable to generate role suggestions. Please try again.",
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
          Get AI-powered insights about your resume and discover career opportunities
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <Label htmlFor="resume-upload">Upload Resume</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="resume-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="resume-upload"
                      name="resume-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOCX, TXT up to 10MB</p>
              </div>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600">
                File selected: {selectedFile.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Target Role Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analyze for Specific Role</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g., Software Engineer, Data Scientist"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleAnalyzeForRole}
              disabled={isAnalyzing || !selectedFile || !targetRole.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing && !suggestionsResult ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Role Suggestions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Discover Best Fit Roles</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Let AI analyze your resume and suggest the most suitable career roles
          </p>
          <Button 
            onClick={handleSuggestRoles}
            disabled={isAnalyzing || !selectedFile}
            className="w-full bg-purple-600 hover:bg-purple-700"
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
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {analysisResult ? `Analysis Results for ${targetRole}` : 'Role Suggestions'}
          </h3>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
              {analysisResult || suggestionsResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
