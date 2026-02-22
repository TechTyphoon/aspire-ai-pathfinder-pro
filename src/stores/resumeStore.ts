import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleSuggestion, AnalysisData, CareerExplorationResult, SavedPathData } from '@/types'

interface ResumeState {
  // Resume data
  resumeFile: File | null
  resumeFileName: string | null
  resumeText: string | null
  uploadedFilePath: string | null

  // Analysis results
  analysisResult: AnalysisData | null
  suggestionsResult: AnalysisData | null
  targetRole: string

  // Career exploration
  careerExplorationResult: CareerExplorationResult | null
  careerField: string

  // Saved paths cache
  savedPaths: SavedPathData[]
  savedPathsLoaded: boolean
  savedPathsLastFetch: number | null

  // Loading states
  isAnalyzing: boolean
  isExploring: boolean
  analyzeError: string | null
  exploreError: string | null

  // Actions
  setResumeFile: (file: File | null, filePath?: string | null) => void
  setResumeText: (text: string | null) => void
  setAnalysisResult: (result: AnalysisData | null) => void
  setSuggestionsResult: (result: AnalysisData | null) => void
  setTargetRole: (role: string) => void
  setCareerExplorationResult: (result: CareerExplorationResult | null) => void
  setCareerField: (field: string) => void
  setSavedPaths: (paths: SavedPathData[]) => void
  addSavedPath: (path: SavedPathData) => void
  removeSavedPath: (pathId: number) => void
  setIsAnalyzing: (loading: boolean) => void
  setIsExploring: (loading: boolean) => void
  setAnalyzeError: (error: string | null) => void
  setExploreError: (error: string | null) => void
  clearResume: () => void
  clearAll: () => void
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      // Initial state
      resumeFile: null,
      resumeFileName: null,
      resumeText: null,
      uploadedFilePath: null,
      analysisResult: null,
      suggestionsResult: null,
      targetRole: '',
      careerExplorationResult: null,
      careerField: '',
      savedPaths: [],
      savedPathsLoaded: false,
      savedPathsLastFetch: null,
      isAnalyzing: false,
      isExploring: false,
      analyzeError: null,
      exploreError: null,

      // Actions
      setResumeFile: (file, filePath = null) =>
        set({
          resumeFile: file,
          resumeFileName: file?.name || null,
          uploadedFilePath: filePath,
          // Clear previous results when new file uploaded
          analysisResult: null,
          suggestionsResult: null,
          analyzeError: null,
        }),

      setResumeText: (text) => set({ resumeText: text }),

      setAnalysisResult: (result) => set({ analysisResult: result, analyzeError: null }),

      setSuggestionsResult: (result) => set({ suggestionsResult: result, analyzeError: null }),

      setTargetRole: (role) => set({ targetRole: role }),

      setCareerExplorationResult: (result) => set({ careerExplorationResult: result, exploreError: null }),

      setCareerField: (field) => set({ careerField: field }),

      setSavedPaths: (paths) => set({ 
        savedPaths: paths, 
        savedPathsLoaded: true,
        savedPathsLastFetch: Date.now()
      }),

      addSavedPath: (path) => set((state) => ({ 
        savedPaths: [path, ...state.savedPaths]
      })),

      removeSavedPath: (pathId) => set((state) => ({
        savedPaths: state.savedPaths.filter(p => p.id !== pathId)
      })),

      setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),

      setIsExploring: (loading) => set({ isExploring: loading }),

      setAnalyzeError: (error) => set(error ? { analyzeError: error, isAnalyzing: false } : { analyzeError: null }),

      setExploreError: (error) => set(error ? { exploreError: error, isExploring: false } : { exploreError: null }),

      clearResume: () =>
        set({
          resumeFile: null,
          resumeFileName: null,
          resumeText: null,
          uploadedFilePath: null,
          analysisResult: null,
          suggestionsResult: null,
          targetRole: '',
          analyzeError: null,
        }),

      clearAll: () =>
        set({
          resumeFile: null,
          resumeFileName: null,
          resumeText: null,
          uploadedFilePath: null,
          analysisResult: null,
          suggestionsResult: null,
          targetRole: '',
          careerExplorationResult: null,
          careerField: '',
          savedPaths: [],
          savedPathsLoaded: false,
          savedPathsLastFetch: null,
          isAnalyzing: false,
          isExploring: false,
          analyzeError: null,
          exploreError: null,
        }),
    }),
    {
      name: 'aspiro-resume-storage',
      // Don't persist File objects (they can't be serialized)
      // Cache saved paths for 5 minutes to avoid re-fetching
      partialize: (state) => ({
        resumeFileName: state.resumeFileName,
        resumeText: state.resumeText,
        uploadedFilePath: state.uploadedFilePath,
        analysisResult: state.analysisResult,
        suggestionsResult: state.suggestionsResult,
        targetRole: state.targetRole,
        careerExplorationResult: state.careerExplorationResult,
        careerField: state.careerField,
        savedPaths: state.savedPaths,
        savedPathsLoaded: state.savedPathsLoaded,
        savedPathsLastFetch: state.savedPathsLastFetch,
      }),
    }
  )
)
