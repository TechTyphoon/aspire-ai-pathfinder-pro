// src/pages/DashboardPage.tsx
/**
 * DashboardPage component - the main interface for authenticated users.
 *
 * This component provides a tabbed navigation to different a_i_features:
 * - Resume Analyzer
 * - Career Explorer
 * - Saved Paths
 * - AI Assistant
 *
 * It manages the active tab state and renders the corresponding view component.
 * Most data fetching and state management specific to each feature are delegated
 * to these child view components.
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    BookmarkIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext'; // Used for basic login check

// Import view components for each tab
import ResumeAnalyzerView from '../components/dashboard/ResumeAnalyzerView';
import CareerExplorerView from '../components/dashboard/CareerExplorerView';
import SavedPathsView from '../components/dashboard/SavedPathsView';
import AiAssistantView from '../components/dashboard/AiAssistantView';

/**
 * Type definition for the names of the tabs available on the dashboard.
 * Exported because `SavedPathsView` uses it for its `setActiveTab` prop type.
 */
export type TabName = 'Resume Analyzer' | 'Career Explorer' | 'Saved Paths' | 'AI Assistant';

/**
 * DashboardPage functional component.
 * Renders the main dashboard UI with tab navigation.
 */
const DashboardPage: React.FC = () => {
  const { isLoggedIn } = useAuth(); // Check if user is logged in for general page access
  const [activeTab, setActiveTab] = useState<TabName>('Resume Analyzer'); // Default active tab

  // Configuration for the dashboard tabs: name and corresponding icon.
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

  /**
   * Renders the content for the currently active tab.
   * Delegates rendering to specific view components based on `activeTab` state.
   * Includes a check for `isLoggedIn` as a failsafe, though routing in `App.tsx`
   * should primarily handle access control to the dashboard.
   * @returns {React.ReactNode} The JSX content for the active tab.
   */
  const renderContent = () => {
    if (!isLoggedIn) {
      return <div className="text-center py-12 text-xl">Please log in to access the dashboard.</div>;
    }

    switch (activeTab) {
      case 'Resume Analyzer':
        return <ResumeAnalyzerView />;
      case 'Career Explorer':
        // onPathSaved callback allows CareerExplorerView to trigger a tab change after saving a path.
        return <CareerExplorerView onPathSaved={handlePathSavedInExplorer} />;
      case 'Saved Paths':
        // isActive prop helps SavedPathsView determine when to fetch its data.
        // setActiveTab prop allows SavedPathsView to navigate to other tabs (e.g., "Explore Careers" button).
        return <SavedPathsView isActive={activeTab === 'Saved Paths'} setActiveTab={setActiveTab} />;
      case 'AI Assistant':
        return <AiAssistantView />;
      default:
        // Should not happen if TabName type is correctly used.
        return <div className="text-center py-12 text-xl">Unknown tab selected.</div>;
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
