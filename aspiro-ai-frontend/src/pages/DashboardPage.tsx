// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import clsx from 'clsx';
import { DocumentTextIcon, MagnifyingGlassIcon, BookmarkIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, TrashIcon, PlusCircleIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

type TabName = 'Resume Analyzer' | 'Career Explorer' | 'Saved Paths' | 'AI Assistant';

interface SavedPathData {
  id: number;
  path_name: string;
  path_details_json: any;
  user_id: number;
}

const DashboardPage: React.FC = () => {
  const { userId, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('Resume Analyzer');

  // States for Saved Paths
  const [savedPaths, setSavedPaths] = useState<SavedPathData[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(false);
  const [pathsError, setPathsError] = useState<string | null>(null);

  // States for Resume Analyzer Tab
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // States for Career Explorer Tab
  const [careerFieldInput, setCareerFieldInput] = useState<string>('');
  const [exploredPathData, setExploredPathData] = useState<{ name: string; report: string } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);


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

  // Career Explorer: Explore a specific career field
  const handleExploreCareerField = async () => {
    if (!careerFieldInput.trim()) {
      setReportError('Please enter a career field to explore.');
      return;
    }
    setIsLoadingReport(true);
    setReportError(null);
    setExploredPathData(null);
    try {
      const response = await apiClient.post('/explore-path', { career_field: careerFieldInput });
      setExploredPathData({
        name: careerFieldInput, // Use the input name for saving
        report: response.data.report,
      });
      setIsReportModalOpen(true);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('Error exploring career field:', err);
      setReportError(error.response?.data?.error || 'Failed to explore career field.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Career Explorer: Save the explored AI-generated report
  const handleSaveExploredPath = async () => {
    if (!exploredPathData || !userId) {
      alert('No report data to save or user not logged in.');
      return;
    }
    const pathPayload = {
      user_id: userId,
      path_name: exploredPathData.name, // Use the career field name as path_name
      path_details_json: {
        ai_report: exploredPathData.report, // Store the full report
        source: "AI Career Explorer",
        explored_at: new Date().toISOString(),
       },
    };
    try {
      const response = await apiClient.post('/save-path', pathPayload);
      alert(`Career path "${exploredPathData.name}" saved successfully! Path ID: ${response.data.path_id}`);
      setIsReportModalOpen(false); // Close modal on success
      setExploredPathData(null); // Clear explored data
      if (activeTab === 'Saved Paths') {
        fetchSavedPaths(); // Refresh saved paths list if currently viewing it
      }
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error saving explored path:', error);
      alert(`Failed to save explored path: ${error.response?.data?.error || error.message}`);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'Resume Analyzer':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* File Upload Section */}
            <div className="bg-surface p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-primary mb-4">Upload Your Resume</h3>
              <div className="mb-4">
                <label htmlFor="resume-file-upload-input" className="block text-sm font-medium text-text-secondary mb-1">
                  Select Resume File (PDF, DOCX, TXT accepted)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-background/50 border-dashed rounded-md hover:border-primary transition-colors">
                  <div className="space-y-1 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-text-secondary" />
                    <div className="flex text-sm text-text-secondary">
                      <label
                        htmlFor="resume-file-upload-input"
                        className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-light px-1"
                      >
                        <span>Upload a file</span>
                        <input id="resume-file-upload-input" name="resume_file" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx,.txt"/>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-text-secondary/80">Max. 10MB</p>
                  </div>
                </div>
                {selectedFile && <p className="mt-2 text-sm text-green-400">File selected: {selectedFile.name}</p>}
              </div>
            </div>

            {/* Analysis Options */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Option A: Analyze for Specific Role */}
              <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Option A: Analyze for a Specific Role</h3>
                <div className="mb-4">
                  <label htmlFor="target-role" className="block text-sm font-medium text-text-secondary mb-1">Target Role</label>
                  <input
                    id="target-role"
                    type="text"
                    placeholder="E.g., Software Engineer, Product Manager"
                    className="w-full p-3 bg-background/30 border-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAnalyzeResume}
                  disabled={isLoadingAi || !selectedFile || !targetRole.trim()}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAi && analysisResult === null && !suggestionsResult ? 'Analyzing...' : 'Analyze for Role'}
                </button>
              </div>

              {/* Option B: Discover Best Fit */}
              <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Option B: Discover Your Best Fit</h3>
                <p className="text-text-secondary mb-4 text-sm">Let our AI analyze your resume and suggest suitable career roles.</p>
                <button
                  onClick={handleSuggestRoles}
                  disabled={isLoadingAi || !selectedFile}
                  className="w-full bg-accent hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAi && suggestionsResult === null && !analysisResult ? 'Suggesting...' : 'Suggest Roles'}
                </button>
              </div>
            </div>

            {/* AI Error Display */}
            {aiError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                <h4 className="font-bold mb-1">AI Processing Error:</h4>
                <pre className="whitespace-pre-wrap text-sm">{aiError}</pre>
              </div>
            )}

            {/* Analysis Result Display */}
            {analysisResult && !isLoadingAi && (
              <div className="mt-6 p-6 bg-surface rounded-lg shadow-xl">
                <h3 className="text-2xl font-semibold text-primary mb-4">Resume Analysis Result:</h3>
                {/* Using <pre> for now as react-markdown installation failed */}
                <pre className="whitespace-pre-wrap bg-background/30 p-4 rounded-md text-text-DEFAULT text-sm overflow-x-auto">{analysisResult}</pre>
              </div>
            )}

            {/* Suggestions Result Display */}
            {suggestionsResult && !isLoadingAi && (
              <div className="mt-6 p-6 bg-surface rounded-lg shadow-xl">
                <h3 className="text-2xl font-semibold text-primary mb-4">Suggested Roles:</h3>
                {/* Using <pre> for now */}
                <pre className="whitespace-pre-wrap bg-background/30 p-4 rounded-md text-text-DEFAULT text-sm overflow-x-auto">{suggestionsResult}</pre>
              </div>
            )}
          </div>
        );
      case 'Career Explorer':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Custom Career Field Exploration Section */}
            <div className="bg-surface p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-primary mb-4">Explore a Custom Career Field</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label htmlFor="career-field-input" className="block text-sm font-medium text-text-secondary mb-1">
                    Enter Career Field Name
                  </label>
                  <input
                    id="career-field-input"
                    type="text"
                    placeholder="E.g., Data Scientist, UX Designer, AI Ethicist"
                    className="w-full p-3 bg-background/30 border-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
                    value={careerFieldInput}
                    onChange={(e) => setCareerFieldInput(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleExploreCareerField}
                  disabled={isLoadingReport || !careerFieldInput.trim()}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingReport ? 'Exploring...' : 'Explore Field'}
                </button>
              </div>
              {reportError && (
                <p className="mt-3 text-sm text-red-400">{reportError}</p>
              )}
            </div>

            {/* Placeholder cards for other features - can be developed further */}
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
              {['Market Trends', 'Network Opportunities'].map((cardTitle) => (
                <div key={cardTitle} className="bg-surface p-6 rounded-xl shadow-xl hover:shadow-primary/30 transition-shadow duration-300 transform hover:-translate-y-1">
                  <h3 className="text-2xl font-semibold text-primary mb-3">{cardTitle}</h3>
                  <p className="text-text-secondary">Insights and tools for {cardTitle.toLowerCase()} will be available here.</p>
                   <button className="mt-4 w-full bg-primary/20 hover:bg-primary/40 text-primary font-medium py-2 px-4 rounded-lg transition-colors duration-300">
                    Learn More
                  </button>
                </div>
              ))}
            </div>

            {/* Modal for Displaying Career Report */}
            {isReportModalOpen && exploredPathData && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                <div className="bg-surface rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-background/50">
                    <h2 className="text-2xl font-semibold text-primary">{exploredPathData.name} - AI Report</h2>
                    <button
                      onClick={() => setIsReportModalOpen(false)}
                      className="text-text-secondary hover:text-text-DEFAULT"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="h-7 w-7" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-grow">
                    <pre className="whitespace-pre-wrap bg-background/30 p-4 rounded-md text-text-DEFAULT text-sm">
                      {exploredPathData.report || "No report content available."}
                    </pre>
                  </div>
                  <div className="p-6 border-t border-background/50 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => setIsReportModalOpen(false)}
                      className="px-6 py-2 rounded-lg text-text-DEFAULT bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSaveExploredPath}
                      disabled={!userId} // Disable if not logged in
                      className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                       <PlusCircleIcon className="inline h-5 w-5 mr-2" />
                      Save This Path
                    </button>
                  </div>
                </div>
              </div>
            )}
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
