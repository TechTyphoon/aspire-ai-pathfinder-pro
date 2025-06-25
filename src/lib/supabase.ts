
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      saved_paths: {
        Row: {
          id: number
          user_id: string
          path_name: string
          path_details_json: any
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          path_name: string
          path_details_json: any
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          path_name?: string
          path_details_json?: any
          created_at?: string
        }
      }
    }
  }
}
