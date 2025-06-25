
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Compass, Save, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export const CareerExplorer = () => {
  const [careerField, setCareerField] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { user } = useAuth()

  const exploreCareer = async () => {
    if (!careerField.trim()) {
      toast.error('Please enter a career field')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('career-mentor', {
        body: { question: careerField.trim() }
      })

      if (error) throw error

      setResult(data.response)
      toast.success('Career path analysis complete!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze career path')
    } finally {
      setLoading(false)
    }
  }

  const savePath = async () => {
    if (!result || !user) {
      toast.error('No analysis to save')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('saved_paths')
        .insert({
          user_id: user.id,
          path_name: careerField,
          path_details_json: { analysis: result, created_at: new Date().toISOString() }
        })

      if (error) throw error

      toast.success('Career path saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save career path')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Career Explorer</h2>
        <p className="text-gray-400">Discover detailed career paths and roadmaps with AI guidance</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Compass className="w-5 h-5 mr-2" />
            Explore Career Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="careerField" className="text-gray-300">Career Field or Role</Label>
            <Input
              id="careerField"
              value={careerField}
              onChange={(e) => setCareerField(e.target.value)}
              placeholder="e.g., Machine Learning Engineer, Product Manager, UX Designer"
              className="bg-gray-700 border-gray-600 text-white mt-2"
            />
          </div>

          <Button
            onClick={exploreCareer}
            disabled={loading || !careerField.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? <LoadingSpinner size="sm" /> : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Explore Career Path
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Career Path Analysis</span>
              <Button
                onClick={savePath}
                disabled={saving}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {saving ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Path
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                {result}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
