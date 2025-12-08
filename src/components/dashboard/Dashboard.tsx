import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ResumeAnalyzer } from './ResumeAnalyzer'
import { CareerExplorer } from './CareerExplorer'
import { SavedPaths } from './SavedPaths'
import { AIAssistantChat } from './AIAssistantChat'
import { FileText, Compass, BookOpen, MessageCircle, Sparkles } from 'lucide-react'

type ActiveTab = 'resume' | 'career' | 'saved' | 'chat'

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resume')

  const tabs = [
    { id: 'resume' as const, label: 'Resume Analyzer', icon: FileText, description: 'AI-powered resume insights' },
    { id: 'career' as const, label: 'Career Explorer', icon: Compass, description: 'Discover opportunities' },
    { id: 'saved' as const, label: 'Saved Paths', icon: BookOpen, description: 'Your career collection' },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageCircle, description: 'Get instant answers' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs */}
      <div className="floating-orb w-96 h-96 bg-primary/20 -top-48 -left-48" />
      <div className="floating-orb w-80 h-80 bg-secondary/20 top-1/3 -right-40" style={{ animationDelay: '2s' }} />
      <div className="floating-orb w-64 h-64 bg-accent/20 bottom-20 left-1/4" style={{ animationDelay: '4s' }} />
      
      <Header />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glow-md">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Your Career Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                AI-powered insights for your professional journey
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-wrap gap-3 p-2 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 inline-flex">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="glass-card p-6 md:p-8 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {activeTab === 'resume' && <ResumeAnalyzer />}
          {activeTab === 'career' && <CareerExplorer />}
          {activeTab === 'saved' && <SavedPaths />}
          {activeTab === 'chat' && <AIAssistantChat />}
        </div>
      </div>
    </div>
  )
}
