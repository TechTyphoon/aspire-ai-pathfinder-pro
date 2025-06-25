
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Target, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface AnalysisResult {
  type: 'target-role' | 'best-fit'
  content: string
  atsScore?: number
}

export const ResumeAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileType = selectedFile.type
      if (fileType === 'application/pdf' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile)
        setResult(null)
      } else {
        toast.error('Please upload a PDF or DOCX file')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file)
    
    if (error) throw error
    return fileName
  }

  const analyzeForRole = async () => {
    if (!file || !targetRole.trim()) {
      toast.error('Please upload a resume and enter a target role')
      return
    }

    setLoading(true)
    try {
      const filePath = await uploadFile(file)
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          filePath, 
          analysisType: 'target-role',
          targetRole: targetRole.trim()
        }
      })

      if (error) throw error

      setResult({
        type: 'target-role',
        content: data.analysis,
        atsScore: data.atsScore
      })
      
      toast.success('Analysis complete!')
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const discoverBestFit = async () => {
    if (!file) {
      toast.error('Please upload a resume')
      return
    }

    setLoading(true)
    try {
      const filePath = await uploadFile(file)
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { 
          filePath, 
          analysisType: 'best-fit'
        }
      })

      if (error) throw error

      setResult({
        type: 'best-fit',
        content: data.analysis
      })
      
      toast.success('Analysis complete!')
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Resume Analyzer</h2>
        <p className="text-gray-400">Upload your resume for AI-powered analysis and insights</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="resume" className="text-gray-300">Choose File (PDF or DOCX)</Label>
            <Input
              ref={fileInputRef}
              id="resume"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="bg-gray-700 border-gray-600 text-white mt-2"
            />
            {file && (
              <p className="text-green-400 text-sm mt-2">✓ {file.name} selected</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetRole" className="text-gray-300">Target Job Role (Optional)</Label>
                <Input
                  id="targetRole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Data Scientist"
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>
              <Button
                onClick={analyzeForRole}
                disabled={loading || !file || !targetRole.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Analyze for Specific Role
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="pt-6">
                <Button
                  onClick={discoverBestFit}
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Discover Best Fit Roles
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Analysis Results</span>
              {result.atsScore && (
                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  ATS Score: {result.atsScore}/100
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                {result.content}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
