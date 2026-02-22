import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { ResumeAnalyzer } from './ResumeAnalyzer'
import { CareerExplorer } from './CareerExplorer'
import { SavedPaths } from './SavedPaths'
import { AIAssistantChat } from './AIAssistantChat'
import { FileText, Compass, BookOpen, MessageCircle, Sparkles } from 'lucide-react'

type ActiveTab = 'resume' | 'career' | 'saved' | 'chat'

const TAB_STORAGE_KEY = 'aspire-dashboard-active-tab'

const getInitialTab = (): ActiveTab => {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    if (stored && ['resume', 'career', 'saved', 'chat'].includes(stored)) {
      return stored as ActiveTab
    }
  } catch {
    // localStorage may be unavailable (SSR, private browsing, etc.)
  }
  return 'resume'
}

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab)

  // Persist tab to localStorage
  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab)
  }, [activeTab])

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (event: CustomEvent<ActiveTab>) => {
      const tab = event.detail
      if (['resume', 'career', 'saved', 'chat'].includes(tab)) {
        setActiveTab(tab)
      }
    }

    window.addEventListener('navigate-tab', handleNavigate as EventListener)
    return () => {
      window.removeEventListener('navigate-tab', handleNavigate as EventListener)
    }
  }, [])

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
  }, [])

  const tabs = [
    { id: 'resume' as const, label: 'Resume Analyzer', icon: FileText, description: 'AI-powered resume insights' },
    { id: 'career' as const, label: 'Career Explorer', icon: Compass, description: 'Discover opportunities' },
    { id: 'saved' as const, label: 'Saved Paths', icon: BookOpen, description: 'Your career collection' },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageCircle, description: 'Get instant answers' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs */}
      <div className="floating-orb w-96 h-96 bg-primary/20 -top-48 -left-48" aria-hidden="true" />
      <div className="floating-orb w-80 h-80 bg-secondary/20 top-1/3 -right-40" style={{ animationDelay: '2s' }} aria-hidden="true" />
      <div className="floating-orb w-64 h-64 bg-accent/20 bottom-20 left-1/4" style={{ animationDelay: '4s' }} aria-hidden="true" />
      
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      <Header />
      
      <main id="main-content" className="container mx-auto py-8 relative z-10">
        {/* Hero Section */}
        <section className="mb-10 animate-fade-in" aria-labelledby="dashboard-heading">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glow-md" aria-hidden="true">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 id="dashboard-heading" className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Your Career Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                AI-powered insights for your professional journey
              </p>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }} aria-label="Dashboard sections">
          <div 
            className="flex flex-wrap gap-3 p-2 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 inline-flex"
            role="tablist"
            aria-label="Career tools"
          >
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  id={`${tab.id}-tab`}
                  tabIndex={isActive ? 0 : -1}
                  className={`group flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sr-only sm:hidden">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content Area */}
        <section 
          className="glass-card p-6 md:p-8 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
          tabIndex={0}
        >
          {activeTab === 'resume' && <ResumeAnalyzer />}
          {activeTab === 'career' && <CareerExplorer />}
          {activeTab === 'saved' && <SavedPaths />}
          {activeTab === 'chat' && <AIAssistantChat />}
        </section>
      </main>
    </div>
  )
}
