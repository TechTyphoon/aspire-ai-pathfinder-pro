// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } // Removed ChangeEvent as it's moved
from 'react';
import clsx from 'clsx';
import { DocumentTextIcon, MagnifyingGlassIcon, BookmarkIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
// Removed API client, useAuth from here as they will be used in child components primarily
// However, useAuth might be needed if DashboardPage itself needs userId for some reason. Let's keep it for now.
import { useAuth } from '../context/AuthContext';

// Import new view components
import ResumeAnalyzerView from '../components/dashboard/ResumeAnalyzerView';
import CareerExplorerView from '../components/dashboard/CareerExplorerView';
import SavedPathsView from '../components/dashboard/SavedPathsView';
import AiAssistantView from '../components/dashboard/AiAssistantView';


export type TabName = 'Resume Analyzer' | 'Career Explorer' | 'Saved Paths' | 'AI Assistant'; // Export for SavedPathsView

// Removed SavedPathData interface, it's now in SavedPathsView or relevant components

const DashboardPage: React.FC = () => {
  const { isLoggedIn } = useAuth(); // Keep to check if user is logged in for general page access
  const [activeTab, setActiveTab] = useState<TabName>('Resume Analyzer');

  // State related to specific tabs has been moved to respective child components:
  // - savedPaths, isLoadingPaths, pathsError -> SavedPathsView
  // - selectedFile, targetRole, analysisResult, suggestionsResult, isLoadingAi, aiError -> ResumeAnalyzerView
  // - careerFieldInput, exploredPathData, isReportModalOpen, isLoadingReport, reportError -> CareerExplorerView

  const tabs: { name: TabName; icon: React.ElementType }[] = [
    { name: 'Resume Analyzer', icon: DocumentTextIcon },
    { name: 'Career Explorer', icon: MagnifyingGlassIcon },
    { name: 'Saved Paths', icon: BookmarkIcon },
    { name: 'AI Assistant', icon: ChatBubbleLeftEllipsisIcon },
  ];

  // Callback for CareerExplorerView to trigger navigation to SavedPaths, which will then refetch.
  const handlePathSavedInExplorer = () => {
    setActiveTab('Saved Paths');
  };

  const renderContent = () => {
    if (!isLoggedIn) { // Should ideally be handled by App.tsx routing, but good failsafe
      return <div className="text-center py-12 text-xl">Please log in to access the dashboard.</div>;
    }

    switch (activeTab) {
      case 'Resume Analyzer':
        return <ResumeAnalyzerView />;
      case 'Career Explorer':
        return <CareerExplorerView onPathSaved={handlePathSavedInExplorer} />;
      case 'Saved Paths':
        // Pass isActive to ensure it fetches data when tab becomes active
        // Pass setActiveTab for the "Explore Careers" button within SavedPathsView
        return <SavedPathsView isActive={activeTab === 'Saved Paths'} setActiveTab={setActiveTab} />;
      case 'AI Assistant':
        return <AiAssistantView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-DEFAULT">
      {/* Spacer for fixed header */}
      <div className="h-20" />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-DEFAULT mb-10">Your Career Dashboard</h1>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-surface/50">
            <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={clsx(
                    'group inline-flex items-center py-4 px-1 sm:px-3 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-all duration-300 focus:outline-none',
                    activeTab === tab.name
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-DEFAULT hover:border-gray-500'
                  )}
                >
                  <tab.icon className={clsx(
                    'mr-2 h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300',
                    activeTab === tab.name ? 'text-primary' : 'text-text-secondary group-hover:text-text-DEFAULT'
                  )} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>{renderContent()}</div>
      </main>

      {/* Basic Footer */}
      <footer className="py-8 bg-surface text-center mt-16 border-t border-background/50">
        <p className="text-text-secondary">&copy; {new Date().getFullYear()} ASPIRO AI Dashboard</p>
      </footer>

      {/* Keyframes for fadeIn animation - can be moved to global index.css */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
