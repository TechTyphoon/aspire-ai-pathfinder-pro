// ─────────────────────────────────────────────────────────────────────────────
// Resume & Analysis Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RoleSuggestion {
  role: string
  match: number
  description: string
  whyItFits?: string
  skillsToHighlight?: string[]
  skillsToDevelop?: string[]
}

export interface AnalysisData {
  analysis: string
  suggestions?: RoleSuggestion[]
  overallStrengths?: string[]
  improvementsToConsider?: string[]
}

export interface CareerExplorationResult {
  field: string
  content: string
  timestamp: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved Paths Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedPathData {
  id: number
  path_name: string
  path_details_json: Record<string, unknown>
  created_at: string
  user_id: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// UI State Types
// ─────────────────────────────────────────────────────────────────────────────

export type AnalysisType = 'role' | 'suggestions' | null
export type LoadingPhase = 'preparing' | 'analyzing' | 'finalizing' | null
