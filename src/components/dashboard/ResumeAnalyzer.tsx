
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
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
      setSelectedFile(file)
      toast({
        title: "File selected",
        description: `${file.name} is ready for analysis`,
      })
    }
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
    
    // Simulate API call
    setTimeout(() => {
      setAnalysisResult(`Analysis for ${targetRole} role:

Based on your resume, here are key insights:

✅ Strengths:
- Strong technical background
- Relevant experience in the field
- Good educational foundation

🔧 Areas for improvement:
- Add more quantifiable achievements
- Include relevant keywords for ${targetRole}
- Strengthen the summary section

📊 Match Score: 78%

Recommendations:
1. Highlight specific projects related to ${targetRole}
2. Add metrics to demonstrate impact
3. Include relevant certifications`)
      
      setIsAnalyzing(false)
      toast({
        title: "Analysis complete",
        description: "Your resume has been analyzed successfully",
      })
    }, 3000)
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
    
    // Simulate API call
    setTimeout(() => {
      setAnalysisResult(`Based on your resume, here are suggested roles:

🎯 Highly Recommended:
• Software Engineer - 92% match
• Frontend Developer - 89% match
• Full Stack Developer - 85% match

💼 Good Fit:
• Product Manager - 76% match
• Technical Lead - 73% match
• DevOps Engineer - 71% match

🚀 Growth Opportunities:
• Solutions Architect - 68% match
• Engineering Manager - 65% match

Each role is matched based on your skills, experience, and career progression potential.`)
      
      setIsAnalyzing(false)
      toast({
        title: "Role suggestions generated",
        description: "Check out the recommended career paths",
      })
    }, 2500)
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
              {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
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
            {isAnalyzing ? 'Analyzing...' : 'Suggest Roles'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Analyzing your resume...</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {analysisResult && !isAnalyzing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Analysis Results</h3>
          </div>
          <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
            {analysisResult}
          </pre>
        </div>
      )}
    </div>
  )
}
