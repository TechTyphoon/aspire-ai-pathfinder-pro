
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Career Dashboard</h1>
          <p className="text-gray-600 text-lg">AI-powered insights for your professional journey</p>
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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {activeTab === 'resume' && <ResumeAnalyzer />}
          {activeTab === 'career' && <CareerExplorer />}
          {activeTab === 'saved' && <SavedPaths />}
          {activeTab === 'chat' && <AIAssistantChat />}
        </div>
      </div>
    </div>
  )
}
