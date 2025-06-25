
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ResumeAnalyzer } from './ResumeAnalyzer'
import { CareerExplorer } from './CareerExplorer'
import { SavedPaths } from './SavedPaths'
import { AIAssistantChat } from './AIAssistantChat'
import { Button } from '@/components/ui/button'
import { FileText, Compass, BookOpen, MessageCircle } from 'lucide-react'

type ActiveTab = 'resume' | 'career' | 'saved' | 'chat'

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resume')

  const tabs = [
    { id: 'resume' as const, label: 'Resume Analyzer', icon: FileText },
    { id: 'career' as const, label: 'Career Explorer', icon: Compass },
    { id: 'saved' as const, label: 'Saved Paths', icon: BookOpen },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Career Dashboard</h1>
          <p className="text-gray-400 text-lg">AI-powered insights for your professional journey</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          {activeTab === 'resume' && <ResumeAnalyzer />}
          {activeTab === 'career' && <CareerExplorer />}
          {activeTab === 'saved' && <SavedPaths />}
          {activeTab === 'chat' && <AIAssistantChat />}
        </div>
      </div>
    </div>
  )
}
