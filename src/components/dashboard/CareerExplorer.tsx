
import { Button } from '@/components/ui/button'
import { Compass, TrendingUp, Users } from 'lucide-react'

export const CareerExplorer = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Career Explorer</h2>
        <p className="text-gray-400 mb-6">
          Discover new career paths and opportunities tailored to your skills
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="p-3 bg-purple-600 rounded-full w-fit mx-auto mb-4">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Explore Paths</h3>
          <p className="text-gray-400 text-sm mb-4">
            Find career paths that match your interests and skills
          </p>
          <Button variant="outline" size="sm">
            Start Exploring
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="p-3 bg-blue-600 rounded-full w-fit mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Market Trends</h3>
          <p className="text-gray-400 text-sm mb-4">
            Stay updated with the latest industry trends
          </p>
          <Button variant="outline" size="sm">
            View Trends
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="p-3 bg-green-600 rounded-full w-fit mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Network</h3>
          <p className="text-gray-400 text-sm mb-4">
            Connect with professionals in your field
          </p>
          <Button variant="outline" size="sm">
            Network
          </Button>
        </div>
      </div>
    </div>
  )
}
