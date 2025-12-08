import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, TrendingUp, BookOpen, Loader2, Sparkles, Save, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
      const { error } = await supabase
        .from('saved_paths')
        .insert({
          user_id: null,
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

  const quickExploreFields = [
    { name: 'Data Science', icon: '📊' },
    { name: 'Software Engineering', icon: '💻' },
    { name: 'Product Management', icon: '🚀' },
    { name: 'UX Design', icon: '🎨' },
    { name: 'Digital Marketing', icon: '📱' },
    { name: 'Cybersecurity', icon: '🔐' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
          <TrendingUp className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-secondary">Career Explorer</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Discover Your Next Career Move
        </h2>
        <p className="text-muted-foreground">
          Explore career paths, market trends, and growth opportunities tailored to your interests
        </p>
      </div>

      {/* Search Section */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="career-field" className="text-sm font-medium text-foreground">Career Field or Role</Label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="career-field"
                placeholder="e.g., Data Science, UX Design, Digital Marketing"
                value={careerField}
                onChange={(e) => setCareerField(e.target.value)}
                className="input-modern pl-12"
                onKeyPress={(e) => e.key === 'Enter' && !isExploring && handleExplore()}
              />
            </div>
          </div>
          <Button 
            onClick={handleExplore}
            disabled={isExploring || !careerField.trim()}
            className="w-full btn-primary"
          >
            {isExploring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exploring...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Explore Career Path
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Explore Options */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Popular Career Paths</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickExploreFields.map((field) => (
            <button
              key={field.name}
              onClick={() => {
                setCareerField(field.name)
                setTimeout(() => {
                  if (!isExploring) {
                    handleExplore()
                  }
                }, 100)
              }}
              disabled={isExploring}
              className="quick-action group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{field.icon}</span>
                <div className="text-left">
                  <span className="text-sm font-medium text-foreground block">{field.name}</span>
                  <span className="text-xs text-muted-foreground">Explore path</span>
                </div>
              </div>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {explorationResult && !isExploring && (
        <div className="glass-card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Career Insights: {careerField}</h3>
            </div>
            <Button 
              onClick={handleSavePath}
              className="btn-ghost"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Path
            </Button>
          </div>
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed font-sans">
              {explorationResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
