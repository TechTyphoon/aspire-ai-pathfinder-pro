// src/pages/DashboardPage.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { DocumentTextIcon, MagnifyingGlassIcon, BookmarkIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

type TabName = 'Resume Analyzer' | 'Career Explorer' | 'Saved Paths' | 'AI Assistant';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Resume Analyzer');

  const tabs: { name: TabName; icon: React.ElementType }[] = [
    { name: 'Resume Analyzer', icon: DocumentTextIcon },
    { name: 'Career Explorer', icon: MagnifyingGlassIcon },
    { name: 'Saved Paths', icon: BookmarkIcon },
    { name: 'AI Assistant', icon: ChatBubbleLeftEllipsisIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Resume Analyzer':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label htmlFor="resume-text" className="block text-lg font-semibold text-text-DEFAULT mb-2">
                Paste Your Resume
              </label>
              <textarea
                id="resume-text"
                rows={12}
                className="w-full p-4 bg-surface border border-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70 shadow-inner"
                placeholder="Paste your full resume text here..."
              ></textarea>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Option A: Analyze for a Specific Role</h3>
                <input
                  type="text"
                  placeholder="Enter job title or description"
                  className="w-full p-3 bg-background/30 border border-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70 mb-4"
                />
                <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  Analyze
                </button>
              </div>
              <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Option B: Discover Your Best Fit</h3>
                <p className="text-text-secondary mb-4 text-sm">Let our AI analyze your resume and suggest roles you're well-suited for.</p>
                <button className="w-full bg-accent hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  Suggest Roles & Analyze
                </button>
              </div>
            </div>
          </div>
        );
      case 'Career Explorer':
        return (
          <div className="space-y-8 animate-fadeIn">
            <input
              type="search"
              placeholder="Explore Career Paths (e.g., 'Software Engineer in New York')"
              className="w-full p-4 bg-surface border border-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70 text-lg shadow-md"
            />
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
              {['Explore Paths', 'Market Trends', 'Network'].map((cardTitle) => (
                <div key={cardTitle} className="bg-surface p-6 rounded-xl shadow-xl hover:shadow-primary/30 transition-shadow duration-300 transform hover:-translate-y-1">
                  <h3 className="text-2xl font-semibold text-primary mb-3">{cardTitle}</h3>
                  <p className="text-text-secondary">Details about {cardTitle.toLowerCase()} will be shown here. Engage with interactive tools and insights.</p>
                  <button className="mt-4 bg-primary/20 hover:bg-primary/40 text-primary font-medium py-2 px-4 rounded-lg transition-colors duration-300">
                    Learn More
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Saved Paths':
        return (
          <div className="text-center py-12 animate-fadeIn bg-surface rounded-lg shadow-xl">
            <BookmarkIcon className="h-20 w-20 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-semibold text-text-DEFAULT mb-3">My Saved Career Paths</h3>
            <p className="text-text-secondary text-lg">No saved paths yet. Explore careers and save them here for future reference!</p>
            <button
              onClick={() => setActiveTab('Career Explorer')}
              className="mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Explore Careers
            </button>
          </div>
        );
      case 'AI Assistant':
        return (
          <div className="flex flex-col h-[calc(100vh-20rem)] bg-surface rounded-xl shadow-2xl animate-fadeIn"> {/* Adjust height as needed */}
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
              {/* Example Messages */}
              <div className="flex justify-start">
                <div className="bg-background/50 text-text-DEFAULT p-3 rounded-lg max-w-xs lg:max-w-md shadow">
                  Hello! How can I assist with your career today?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-white p-3 rounded-lg max-w-xs lg:max-w-md shadow">
                  I'm looking for advice on switching to a product management role.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-background/50 text-text-DEFAULT p-3 rounded-lg max-w-xs lg:max-w-md shadow">
                  Great! Tell me a bit about your current experience and skills.
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-background">
              <div className="flex items-center bg-background/30 rounded-lg shadow-inner">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-grow p-3 bg-transparent focus:outline-none placeholder-text-secondary/70 text-text-DEFAULT"
                />
                <button className="p-3 text-primary hover:text-primary-dark transition-colors duration-300">
                  <PaperAirplaneIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        );
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

      {/* Keyframes for fadeIn animation - will be in global CSS or styled-components if preferred, here for simplicity */}
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
