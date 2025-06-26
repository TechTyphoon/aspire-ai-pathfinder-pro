
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, TrendingUp, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
    
    // Simulate API call
    setTimeout(() => {
      setExplorationResult(`Career Path Report: ${careerField}

🚀 Overview:
${careerField} is a rapidly growing field with excellent career prospects and competitive salaries.

📈 Market Outlook:
• Job Growth: 15-25% over next 5 years
• Average Salary: $75,000 - $150,000
• Remote Work: 70% of positions offer remote options

🛤️ Career Progression:
1. Entry Level → Junior ${careerField} Professional
2. Mid Level → Senior ${careerField} Specialist  
3. Senior Level → ${careerField} Lead/Manager
4. Executive → Director of ${careerField}

🎯 Key Skills Needed:
• Technical proficiency in relevant tools
• Problem-solving and analytical thinking
• Communication and collaboration
• Continuous learning mindset

💼 Top Companies Hiring:
• Tech giants (Google, Microsoft, Amazon)
• Startups and scale-ups
• Consulting firms
• Fortune 500 companies

📚 Recommended Learning Path:
1. Complete online courses and certifications
2. Build portfolio projects
3. Gain hands-on experience through internships
4. Network with professionals in the field`)
      
      setIsExploring(false)
      toast({
        title: "Exploration complete",
        description: `Career insights for ${careerField} are ready`,
      })
    }, 2500)
  }

  const handleSavePath = () => {
    if (!explorationResult) {
      toast({
        title: "Nothing to save",
        description: "Please explore a career path first",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Path saved",
      description: `${careerField} career path saved to your collection`,
    })
  }

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
              onKeyPress={(e) => e.key === 'Enter' && handleExplore()}
            />
          </div>
          <Button 
            onClick={handleExplore}
            disabled={isExploring || !careerField.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-4 h-4 mr-2" />
            {isExploring ? 'Exploring...' : 'Explore Career Path'}
          </Button>
        </div>
      </div>

      {/* Quick Explore Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Data Science', 'Software Engineering', 'Product Management', 'UX Design'].map((field) => (
          <Button
            key={field}
            variant="outline"
            onClick={() => {
              setCareerField(field)
              setTimeout(() => handleExplore(), 100)
            }}
            className="p-4 h-auto flex-col space-y-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">{field}</span>
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isExploring && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Exploring {careerField}...</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {explorationResult && !isExploring && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Career Insights</h3>
            </div>
            <Button 
              onClick={handleSavePath}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Save Path
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-md">
            {explorationResult}
          </pre>
        </div>
      )}
    </div>
  )
}
