// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { DocumentTextIcon, MagnifyingGlassIcon, BookmarkIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '../api'; // Import the configured axios instance
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

type TabName = 'Resume Analyzer' | 'Career Explorer' | 'Saved Paths' | 'AI Assistant';

interface SavedPathData {
  id: number;
  path_name: string;
  path_details_json: any; // Can be more specific if the structure is known
  user_id: number;
}

// const API_BASE_URL = 'http://localhost:5000'; // No longer needed, using apiClient

const DashboardPage: React.FC = () => {
  const { userId, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('Resume Analyzer');
  const [savedPaths, setSavedPaths] = useState<SavedPathData[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(false);
  const [pathsError, setPathsError] = useState<string | null>(null);

  const tabs: { name: TabName; icon: React.ElementType }[] = [
    { name: 'Resume Analyzer', icon: DocumentTextIcon },
    { name: 'Career Explorer', icon: MagnifyingGlassIcon },
    { name: 'Saved Paths', icon: BookmarkIcon },
    { name: 'AI Assistant', icon: ChatBubbleLeftEllipsisIcon },
  ];

  // Fetch saved paths
  const fetchSavedPaths = useCallback(async () => {
    if (!userId || !isLoggedIn) {
      setSavedPaths([]); // Clear paths if user logs out or no userId
      return;
    }
    setIsLoadingPaths(true);
    setPathsError(null);
    try {
      const response = await apiClient.get(`/user/${userId}/paths`); // Use apiClient
      setSavedPaths(response.data);
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching saved paths:', error);
      setPathsError('Failed to load saved paths.');
      setSavedPaths([]);
    } finally {
      setIsLoadingPaths(false);
    }
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (activeTab === 'Saved Paths' && userId) { // Ensure userId is present before fetching
      fetchSavedPaths();
    }
  }, [activeTab, fetchSavedPaths, userId]); // Added userId to dependency array


  const handleDeletePath = async (pathId: number) => {
    if (!window.confirm('Are you sure you want to delete this path?')) return;
    try {
      await apiClient.delete(`/delete-path/${pathId}`); // Use apiClient
      setSavedPaths(prevPaths => prevPaths.filter(path => path.id !== pathId));
      alert('Path deleted successfully!');
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error deleting path:', error);
      alert(`Failed to delete path: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSaveSamplePath = async () => {
    if (!userId) {
      alert('You must be logged in to save a path.');
      return;
    }
    const samplePath = {
      user_id: userId,
      path_name: `Sample Path - ${new Date().toLocaleTimeString()}`,
      path_details_json: {
        description: "This is a sample career path saved from Career Explorer.",
        steps: ["Research roles", "Network", "Apply"],
        estimated_time: "6 months"
      }
    };
    try {
      const response = await apiClient.post(`/save-path`, samplePath); // Use apiClient
      alert(`Path "${samplePath.path_name}" saved successfully! Path ID: ${response.data.path_id}`);
      if (activeTab === 'Saved Paths') {
        fetchSavedPaths();
      }
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error saving sample path:', error);
      alert(`Failed to save sample path: ${error.response?.data?.error || error.message}`);
    }
  };


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
              {['Explore Example Path', 'Market Trends', 'Network Opportunities'].map((cardTitle) => (
                <div key={cardTitle} className="bg-surface p-6 rounded-xl shadow-xl hover:shadow-primary/30 transition-shadow duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-primary mb-3">{cardTitle}</h3>
                    <p className="text-text-secondary mb-4">Details about {cardTitle.toLowerCase()} will be shown here. Engage with interactive tools and insights.</p>
                  </div>
                  <div className="mt-auto">
                    {cardTitle === 'Explore Example Path' && ( // Add save button to one card for example
                       <button
                        onClick={handleSaveSamplePath}
                        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                      >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Save Sample Path
                      </button>
                    )}
                     <button className="w-full mt-2 bg-primary/20 hover:bg-primary/40 text-primary font-medium py-2 px-4 rounded-lg transition-colors duration-300">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Saved Paths':
        if (isLoadingPaths) return <div className="text-center py-12 animate-fadeIn">Loading saved paths...</div>;
        if (pathsError) return <div className="text-center py-12 animate-fadeIn text-red-400">{pathsError}</div>;

        return (
          <div className="animate-fadeIn space-y-6">
            <h2 className="text-3xl font-semibold text-text-DEFAULT mb-6">My Saved Career Paths</h2>
            {savedPaths.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-lg shadow-xl">
                <BookmarkIcon className="h-20 w-20 text-primary mx-auto mb-6" />
                <p className="text-text-secondary text-lg">No saved paths yet. Explore careers and save them here!</p>
                <button
                  onClick={() => setActiveTab('Career Explorer')}
                  className="mt-8 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Explore Careers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPaths.map(path => (
                  <div key={path.id} className="bg-surface p-6 rounded-xl shadow-xl hover:shadow-primary/30 transition-shadow duration-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-2">{path.path_name}</h3>
                      {path.path_details_json && typeof path.path_details_json === 'object' && (
                        <div className="text-sm text-text-secondary space-y-1 mb-4">
                          {Object.entries(path.path_details_json).map(([key, value]) => (
                            <p key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePath(path.id)}
                      className="w-full mt-auto bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
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
