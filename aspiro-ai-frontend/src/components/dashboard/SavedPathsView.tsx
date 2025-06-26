// src/components/dashboard/SavedPathsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AxiosError } from 'axios';

interface SavedPathData {
  id: number;
  path_name: string;
  path_details_json: any;
  user_id: number;
}

interface SavedPathsViewProps {
  isActive: boolean; // To trigger fetch only when tab is active
  setActiveTab: (tabName: any) // Type should match TabName from DashboardPage
    => void;
}

const SavedPathsView: React.FC<SavedPathsViewProps> = ({ isActive, setActiveTab }) => {
  const { userId, isLoggedIn } = useAuth();
  const [savedPaths, setSavedPaths] = useState<SavedPathData[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(false);
  const [pathsError, setPathsError] = useState<string | null>(null);

  const fetchSavedPaths = useCallback(async () => {
    if (!userId || !isLoggedIn) {
      setSavedPaths([]);
      return;
    }
    setIsLoadingPaths(true);
    setPathsError(null);
    try {
      const response = await apiClient.get(`/user/${userId}/paths`);
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
    if (isActive && userId) {
      fetchSavedPaths();
    }
  }, [isActive, userId, fetchSavedPaths]);

  const handleDeletePath = async (pathId: number) => {
    if (!window.confirm('Are you sure you want to delete this path?')) return;
    try {
      await apiClient.delete(`/delete-path/${pathId}`);
      setSavedPaths(prevPaths => prevPaths.filter(path => path.id !== pathId));
      alert('Path deleted successfully!');
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error deleting path:', error);
      alert(`Failed to delete path: ${error.response?.data?.error || error.message}`);
    }
  };

  if (!isLoggedIn) {
    return <div className="text-center py-12">Please log in to view your saved paths.</div>;
  }
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
            onClick={() => setActiveTab('Career Explorer')} // Use prop to switch tab
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
                {path.path_details_json && (
                  <div className="text-sm text-text-secondary space-y-1 mb-4">
                    {typeof path.path_details_json === 'string' ? (
                       <pre className="whitespace-pre-wrap text-xs">{path.path_details_json}</pre>
                    ) : typeof path.path_details_json === 'object' && path.path_details_json.ai_report ? (
                       <pre className="whitespace-pre-wrap text-xs">{path.path_details_json.ai_report.substring(0,150)}...</pre>
                    ) : (
                      Object.entries(path.path_details_json).map(([key, value]) => (
                        <p key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}</p>
                      ))
                    )}
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
};

export default SavedPathsView;
