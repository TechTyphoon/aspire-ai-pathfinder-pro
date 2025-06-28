
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, TrendingUp, BookOpen, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export const CareerExplorer = () => {
  const [careerField, setCareerField] = useState('')
  const [isExploring, setIsExploring] = useState(false)
  const [explorationResult, setExplorationResult] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExplore = async () => {
    if (!careerField.trim()) {
      toast({
        title: "Field required",
        description: "Please enter a career field to explore",
        variant: "destructive"
      })
      return
    }

    setIsExploring(true)
    setExplorationResult(null)
    
    try {
      // Call the career-mentor edge function
      const { data, error } = await supabase.functions.invoke('career-mentor', {
        body: {
          question: `I want to explore a career in ${careerField}. Can you provide me with a comprehensive career path analysis including job responsibilities, required skills, salary expectations, career progression, and market outlook?`
        }
      })

      if (error) throw error

      setExplorationResult(data.response)
      
      toast({
        title: "Exploration complete",
        description: `Career insights for ${careerField} are ready`,
      })
    } catch (error) {
      console.error('Career exploration error:', error)
      toast({
        title: "Exploration failed",
        description: "Unable to explore career field. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExploring(false)
    }
  }

  const handleSavePath = async () => {
    if (!explorationResult) {
      toast({
        title: "Nothing to save",
        description: "Please explore a career path first",
        variant: "destructive"
      })
      return
    }

    try {
      // Save to Supabase database without user authentication
      const { error } = await supabase
        .from('saved_paths')
        .insert({
          user_id: null, // No authentication required
          path_name: `${careerField} Career Path`,
          path_details_json: {
            field: careerField,
            analysis: explorationResult,
            saved_at: new Date().toISOString()
          }
        })

      if (error) throw error

      toast({
        title: "Path saved",
        description: `${careerField} career path saved to your collection`,
      })
    } catch (error) {
      console.error('Save path error:', error)
      toast({
        title: "Save failed",
        description: "Unable to save career path. Please try again.",
        variant: "destructive"
      })
    }
  }

  const quickExploreFields = ['Data Science', 'Software Engineering', 'Product Management', 'UX Design', 'Digital Marketing', 'Cybersecurity']

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Career Explorer</h2>
        <p className="text-gray-600 mb-6">
          Discover career paths, market trends, and growth opportunities
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <Label htmlFor="career-field">Career Field or Role</Label>
            <Input
              id="career-field"
              placeholder="e.g., Data Science, UX Design, Digital Marketing"
              value={careerField}
              onChange={(e) => setCareerField(e.target.value)}
              className="mt-1"
              onKeyPress={(e) => e.key === 'Enter' && !isExploring && handleExplore()}
            />
          </div>
          <Button 
            onClick={handleExplore}
            disabled={isExploring || !careerField.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isExploring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exploring...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Explore Career Path
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Explore Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickExploreFields.map((field) => (
          <Button
            key={field}
            variant="outline"
            onClick={() => {
              setCareerField(field)
              setTimeout(() => {
                if (!isExploring) {
                  handleExplore()
                }
              }, 100)
            }}
            disabled={isExploring}
            className="p-4 h-auto flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{field}</span>
          </Button>
        ))}
      </div>

      {/* Results Display */}
      {explorationResult && !isExploring && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Career Insights: {careerField}</h3>
            </div>
            <Button 
              onClick={handleSavePath}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Save Path
            </Button>
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
              {explorationResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
