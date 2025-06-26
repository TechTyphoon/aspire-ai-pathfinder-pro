// src/components/dashboard/ResumeAnalyzerView.tsx
import React, { useState, ChangeEvent } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext'; // Assuming useAuth can be used here
import { AxiosError } from 'axios';

const ResumeAnalyzerView: React.FC = () => {
  const { userId, isLoggedIn } = useAuth(); // Check if needed, or pass userId as prop

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setAnalysisResult(null);
      setSuggestionsResult(null);
      setAiError(null);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!isLoggedIn || !userId) {
        setAiError('You must be logged in to analyze a resume.');
        return;
    }
    if (!selectedFile) {
      setAiError('Please select a resume file.');
      return;
    }
    if (!targetRole.trim()) {
      setAiError('Please enter a target role.');
      return;
    }
    setIsLoadingAi(true);
    setAiError(null);
    setAnalysisResult(null); // Clear previous analysis
    setSuggestionsResult(null); // Clear previous suggestions

    const formData = new FormData();
    formData.append('resume_file', selectedFile);
    formData.append('target_role', targetRole);

    try {
      const response = await apiClient.post('/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisResult(response.data.analysis);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('Error analyzing resume:', error);
      setAiError(error.response?.data?.error || 'Failed to analyze resume.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSuggestRoles = async () => {
    if (!isLoggedIn || !userId) {
        setAiError('You must be logged in to get role suggestions.');
        return;
    }
    if (!selectedFile) {
      setAiError('Please select a resume file to get role suggestions.');
      return;
    }
    setIsLoadingAi(true);
    setAiError(null);
    setSuggestionsResult(null); // Clear previous suggestions
    setAnalysisResult(null); // Clear previous analysis


    const formData = new FormData();
    formData.append('resume_file', selectedFile);

    try {
      const response = await apiClient.post('/suggest-roles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuggestionsResult(response.data.suggestions);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      console.error('Error suggesting roles:', error);
      setAiError(error.response?.data?.error || 'Failed to suggest roles.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!isLoggedIn) {
    return <div className="text-center py-12">Please log in to use the Resume Analyzer.</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* File Upload Section */}
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-primary mb-4">Upload Your Resume</h3>
        <div className="mb-4">
          <label htmlFor="resume-file-upload-input-analyzer" className="block text-sm font-medium text-text-secondary mb-1">
            Select Resume File (PDF, DOCX, TXT accepted)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-background/50 border-dashed rounded-md hover:border-primary transition-colors">
            <div className="space-y-1 text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-text-secondary" />
              <div className="flex text-sm text-text-secondary">
                <label
                  htmlFor="resume-file-upload-input-analyzer"
                  className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-light px-1"
                >
                  <span>Upload a file</span>
                  <input id="resume-file-upload-input-analyzer" name="resume_file_analyzer" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx,.txt"/>
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
              disabled={!isLoggedIn}
            />
          </div>
          <button
            onClick={handleAnalyzeResume}
            disabled={isLoadingAi || !selectedFile || !targetRole.trim() || !isLoggedIn}
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
            disabled={isLoadingAi || !selectedFile || !isLoggedIn}
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
          <pre className="whitespace-pre-wrap bg-background/30 p-4 rounded-md text-text-DEFAULT text-sm overflow-x-auto">{analysisResult}</pre>
        </div>
      )}

      {/* Suggestions Result Display */}
      {suggestionsResult && !isLoadingAi && (
        <div className="mt-6 p-6 bg-surface rounded-lg shadow-xl">
          <h3 className="text-2xl font-semibold text-primary mb-4">Suggested Roles:</h3>
          <pre className="whitespace-pre-wrap bg-background/30 p-4 rounded-md text-text-DEFAULT text-sm overflow-x-auto">{suggestionsResult}</pre>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerView;
