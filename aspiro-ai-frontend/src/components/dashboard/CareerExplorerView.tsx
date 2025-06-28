// src/components/dashboard/CareerExplorerView.tsx
import React, { useState } from 'react';
import { PlusCircleIcon, XMarkIcon, MagnifyingGlassIcon as ExploreIcon } from '@heroicons/react/24/outline'; // Renamed MagnifyingGlassIcon to avoid conflict
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AxiosError } from 'axios';

interface CareerExplorerViewProps {
  onPathSaved: () => void; // Callback to refresh saved paths list in parent
}

const CareerExplorerView: React.FC<CareerExplorerViewProps> = ({ onPathSaved }) => {
  const { userId, isLoggedIn } = useAuth();

  const [careerFieldInput, setCareerFieldInput] = useState<string>('');
  const [exploredPathData, setExploredPathData] = useState<{ name: string; report: string } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleExploreCareerField = async () => {
    if (!isLoggedIn) {
      setReportError('Please log in to explore career fields.');
      return;
    }
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
        name: careerFieldInput,
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

  const handleSaveExploredPath = async () => {
    if (!exploredPathData || !userId || !isLoggedIn) {
      alert('No report data to save or user not logged in.');
      return;
    }
    // user_id is now taken from JWT on the backend, no need to send it in payload.
    const pathPayload = {
      path_name: exploredPathData.name,
      path_details_json: {
        ai_report: exploredPathData.report,
        source: "AI Career Explorer",
        explored_at: new Date().toISOString(),
       },
    };
    try {
      const response = await apiClient.post('/save-path', pathPayload);
      alert(`Career path "${exploredPathData.name}" saved successfully! Path ID: ${response.data.path_id}`);
      setIsReportModalOpen(false);
      setExploredPathData(null);
      setCareerFieldInput(''); // Clear input after successful save
      onPathSaved(); // Call the callback to refresh parent's list
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error saving explored path:', error);
      alert(`Failed to save explored path: ${error.response?.data?.error || error.message}`);
    }
  };

  if (!isLoggedIn) {
    return <div className="text-center py-12">Please log in to use the Career Explorer.</div>;
  }

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
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ExploreIcon className="h-5 w-5 mr-2"/>
            {isLoadingReport ? 'Exploring...' : 'Explore Field'}
          </button>
        </div>
        {reportError && (
          <p className="mt-3 text-sm text-red-400">{reportError}</p>
        )}
      </div>

      {/* Placeholder cards for other features */}
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
                onClick={() => {setIsReportModalOpen(false); setExploredPathData(null); setReportError(null);}}
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
                onClick={() => {setIsReportModalOpen(false); setExploredPathData(null); setReportError(null);}}
                className="px-6 py-2 rounded-lg text-text-DEFAULT bg-background/50 hover:bg-background/80 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSaveExploredPath}
                disabled={!userId}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
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
};

export default CareerExplorerView;
