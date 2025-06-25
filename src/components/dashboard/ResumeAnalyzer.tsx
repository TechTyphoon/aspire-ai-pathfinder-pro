
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText } from 'lucide-react'

export const ResumeAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Resume Analyzer</h2>
        <p className="text-gray-400 mb-6">
          Upload your resume to get AI-powered insights and improvement suggestions
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-800 rounded-full">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-white font-medium mb-2">Drop your resume here</p>
            <p className="text-gray-400 text-sm">Supports PDF and DOCX files</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
            Choose File
          </Button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
            <span className="text-white">Analyzing your resume...</span>
          </div>
        </div>
      )}
    </div>
  )
}
