// src/components/dashboard/SavedPathsView.tsx
/**
 * SavedPathsView component.
 *
 * Displays a list of career paths saved by the authenticated user.
 * Allows users to view details (summary) and delete saved paths.
 * Fetches saved paths when the tab becomes active and the user is logged in.
 *
 * Features:
 * - Fetches saved paths from `/api/user/paths`.
 * - Allows deletion of paths via `/api/delete-path/:id`.
 * - Uses `useAuth` for login status and `userId` for data fetching.
 * - Shows loading and error states.
 * - Provides a button to navigate to "Career Explorer" if no paths are saved.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AxiosError } from 'axios';
import { TabName } from '../../pages/DashboardPage'; // Import TabName for setActiveTab prop

/**
 * Interface for the structure of saved path data received from the backend.
 * @interface SavedPathData
 * @property {number} id - The unique identifier for the saved path.
 * @property {string} path_name - The user-defined name of the path.
 * @property {any} path_details_json - The detailed information about the path, stored as JSON.
 *                                      Can be a string or an object (e.g., AI report).
 * @property {number} user_id - The ID of the user who saved the path.
 */
interface SavedPathData {
  id: number;
  path_name: string;
  path_details_json: any;
  user_id: number;
}

/**
 * Props for the SavedPathsView component.
 * @interface SavedPathsViewProps
 * @property {boolean} isActive - True if this tab is currently active/visible. Used to trigger data fetching.
 * @property {(tabName: TabName) => void} setActiveTab - Callback to change the active tab in the parent DashboardPage.
 */
interface SavedPathsViewProps {
  isActive: boolean;
  setActiveTab: (tabName: TabName) => void;
}

/**
 * SavedPathsView functional component.
 * @param {SavedPathsViewProps} props - The props for the component.
 */
const SavedPathsView: React.FC<SavedPathsViewProps> = ({ isActive, setActiveTab }) => {
  const { userId, isLoggedIn } = useAuth(); // Auth context for user session

  // State variables
  const [savedPaths, setSavedPaths] = useState<SavedPathData[]>([]); // List of saved paths
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(false); // True when paths are being fetched
  const [pathsError, setPathsError] = useState<string | null>(null); // Error messages for path operations

  /**
   * Fetches the authenticated user's saved career paths from the backend.
   * Uses `useCallback` to memoize the function, preventing unnecessary re-creations.
   * Only fetches if `userId` and `isLoggedIn` are true.
   */
  const fetchSavedPaths = useCallback(async () => {
    if (!isLoggedIn) { // userId is implicitly checked by isLoggedIn from useAuth
      setSavedPaths([]); // Clear paths if user is not logged in
      return;
    }
    setIsLoadingPaths(true);
    setPathsError(null);
    try {
      // The backend route is now /user/paths and gets user_id from JWT
      const response = await apiClient.get('/user/paths');
      setSavedPaths(response.data);
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching saved paths:', error);
      setPathsError('Failed to load saved paths.');
      setSavedPaths([]);
    } finally {
      setIsLoadingPaths(false);
    }
  }, [isLoggedIn, fetchSavedPaths]); // Dependency on isLoggedIn and fetchSavedPaths (which includes userId)

  /**
   * Effect hook to trigger `fetchSavedPaths` when the tab becomes active
   * or when the `userId` changes (e.g., after login).
   */
  useEffect(() => {
    if (isActive && isLoggedIn) { // Ensure user is logged in before fetching
      fetchSavedPaths();
    }
  }, [isActive, isLoggedIn, fetchSavedPaths]); // Added isLoggedIn to dependencies

  /**
   * Handles the deletion of a saved path.
   * Prompts for confirmation, then calls the `/api/delete-path/:id` endpoint.
   * Updates the local state to remove the deleted path on success.
   * @param {number} pathId - The ID of the path to delete.
   */
  const handleDeletePath = async (pathId: number) => {
    if (!window.confirm('Are you sure you want to delete this path?')) return;

    // Optimistic UI update can be done here if preferred, or revert on error.
    // For now, updating after successful API call.
    setPathsError(null); // Clear previous errors
    try {
      await apiClient.delete(`/delete-path/${pathId}`);
      setSavedPaths(prevPaths => prevPaths.filter(path => path.id !== pathId));
      // Consider using a more integrated notification system instead of alert for success
      // For now, success alert is acceptable.
      alert('Path deleted successfully!');
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('Error deleting path:', error);
      setPathsError(error.response?.data?.error || `Failed to delete path: ${error.message}`);
    }
  };

  // Conditional rendering based on auth state, loading, and errors.
  // pathsError will now be displayed by the main error display logic below.
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
