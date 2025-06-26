
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pimvcujpkkndxjzhotwz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbXZjdWpwa2tuZHhqemhvdHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjM1MzMsImV4cCI6MjA2NTM5OTUzM30.w1l_oggEx6qdY9l9-jCZEW6tCcArFTffbohZj0bKPKE"

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

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
