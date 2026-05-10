// Tipos de la base de datos Supabase (proyecto: rygnsemdmmbvnwecwvva).
//
// Para regenerar tras cambios de schema:
//   - vía MCP de Supabase: generate_typescript_types({ project_id: 'rygnsemdmmbvnwecwvva' })
//   - vía CLI: supabase gen types typescript --project-id rygnsemdmmbvnwecwvva
// y reemplazar el bloque `Database` de abajo (no toques los atajos al final).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata_json: Json | null
          plan_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata_json?: Json | null
          plan_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata_json?: Json | null
          plan_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plan_checklist_items: {
        Row: {
          assigned_to_participant_id: string | null
          created_at: string
          id: string
          is_done: boolean
          plan_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_participant_id?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          plan_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_participant_id?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          plan_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_comments: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          participant_id: string
          plan_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          participant_id: string
          plan_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          participant_id?: string
          plan_id?: string
        }
        Relationships: []
      }
      plan_options: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_winner: boolean
          label: string | null
          location_name: string | null
          option_type: Database['public']['Enums']['plan_option_type']
          plan_id: string
          starts_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_winner?: boolean
          label?: string | null
          location_name?: string | null
          option_type: Database['public']['Enums']['plan_option_type']
          plan_id: string
          starts_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_winner?: boolean
          label?: string | null
          location_name?: string | null
          option_type?: Database['public']['Enums']['plan_option_type']
          plan_id?: string
          starts_at?: string | null
        }
        Relationships: []
      }
      plan_participants: {
        Row: {
          created_at: string
          guest_name: string | null
          guest_token: string | null
          id: string
          plan_id: string
          status: Database['public']['Enums']['participant_status']
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_name?: string | null
          guest_token?: string | null
          id?: string
          plan_id: string
          status?: Database['public']['Enums']['participant_status']
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_name?: string | null
          guest_token?: string | null
          id?: string
          plan_id?: string
          status?: Database['public']['Enums']['participant_status']
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plan_reminders: {
        Row: {
          channel: Database['public']['Enums']['reminder_channel']
          created_at: string
          id: string
          participant_id: string | null
          plan_id: string
          remind_at: string
          status: Database['public']['Enums']['reminder_status']
        }
        Insert: {
          channel: Database['public']['Enums']['reminder_channel']
          created_at?: string
          id?: string
          participant_id?: string | null
          plan_id: string
          remind_at: string
          status?: Database['public']['Enums']['reminder_status']
        }
        Update: {
          channel?: Database['public']['Enums']['reminder_channel']
          created_at?: string
          id?: string
          participant_id?: string | null
          plan_id?: string
          remind_at?: string
          status?: Database['public']['Enums']['reminder_status']
        }
        Relationships: []
      }
      plan_sources: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          metadata_json: Json | null
          plan_id: string
          raw_text: string | null
          source_type: Database['public']['Enums']['plan_source_type']
          source_url: string | null
          storage_key: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          metadata_json?: Json | null
          plan_id: string
          raw_text?: string | null
          source_type: Database['public']['Enums']['plan_source_type']
          source_url?: string | null
          storage_key?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          metadata_json?: Json | null
          plan_id?: string
          raw_text?: string | null
          source_type?: Database['public']['Enums']['plan_source_type']
          source_url?: string | null
          storage_key?: string | null
        }
        Relationships: []
      }
      plan_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          participant_id: string
          plan_id: string
          vote_value: Database['public']['Enums']['vote_value']
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          participant_id: string
          plan_id: string
          vote_value: Database['public']['Enums']['vote_value']
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          participant_id?: string
          plan_id?: string
          vote_value?: Database['public']['Enums']['vote_value']
        }
        Relationships: []
      }
      plans: {
        Row: {
          address: string | null
          ai_confidence: number | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          expires_at: string | null
          id: string
          location_name: string | null
          missing_fields: string[] | null
          requirements: string[] | null
          source_url: string | null
          starts_at: string | null
          status: Database['public']['Enums']['plan_status']
          timezone: string | null
          title: string | null
          type: Database['public']['Enums']['plan_type'] | null
          updated_at: string
          visibility: Database['public']['Enums']['plan_visibility']
          warnings: string[] | null
        }
        Insert: {
          address?: string | null
          ai_confidence?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          location_name?: string | null
          missing_fields?: string[] | null
          requirements?: string[] | null
          source_url?: string | null
          starts_at?: string | null
          status?: Database['public']['Enums']['plan_status']
          timezone?: string | null
          title?: string | null
          type?: Database['public']['Enums']['plan_type'] | null
          updated_at?: string
          visibility?: Database['public']['Enums']['plan_visibility']
          warnings?: string[] | null
        }
        Update: {
          address?: string | null
          ai_confidence?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          location_name?: string | null
          missing_fields?: string[] | null
          requirements?: string[] | null
          source_url?: string | null
          starts_at?: string | null
          status?: Database['public']['Enums']['plan_status']
          timezone?: string | null
          title?: string | null
          type?: Database['public']['Enums']['plan_type'] | null
          updated_at?: string
          visibility?: Database['public']['Enums']['plan_visibility']
          warnings?: string[] | null
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          attempts: number
          cache_creation_tokens: number | null
          cache_read_tokens: number | null
          cost_usd: number | null
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          input_tokens: number | null
          input_url: string | null
          model_used: Database['public']['Enums']['ai_model'] | null
          output_json: Json | null
          output_tokens: number | null
          plan_id: string
          plan_source_id: string
          provider: Database['public']['Enums']['ai_provider'] | null
          started_at: string | null
          status: Database['public']['Enums']['processing_job_status']
          updated_at: string
        }
        Insert: {
          attempts?: number
          cache_creation_tokens?: number | null
          cache_read_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          input_url?: string | null
          model_used?: Database['public']['Enums']['ai_model'] | null
          output_json?: Json | null
          output_tokens?: number | null
          plan_id: string
          plan_source_id: string
          provider?: Database['public']['Enums']['ai_provider'] | null
          started_at?: string | null
          status?: Database['public']['Enums']['processing_job_status']
          updated_at?: string
        }
        Update: {
          attempts?: number
          cache_creation_tokens?: number | null
          cache_read_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_tokens?: number | null
          input_url?: string | null
          model_used?: Database['public']['Enums']['ai_model'] | null
          output_json?: Json | null
          output_tokens?: number | null
          plan_id?: string
          plan_source_id?: string
          provider?: Database['public']['Enums']['ai_provider'] | null
          started_at?: string | null
          status?: Database['public']['Enums']['processing_job_status']
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_id?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_public_plan: { Args: { p_token: string }; Returns: Json }
      guest_add_comment: {
        Args: { p_body: string; p_guest_token: string; p_token: string }
        Returns: string
      }
      guest_cast_vote: {
        Args: {
          p_guest_token: string
          p_option_id: string
          p_token: string
          p_vote: Database['public']['Enums']['vote_value']
        }
        Returns: undefined
      }
      guest_join_plan: {
        Args: { p_guest_name: string; p_guest_token: string; p_token: string }
        Returns: string
      }
      guest_set_rsvp: {
        Args: {
          p_guest_token: string
          p_status: Database['public']['Enums']['participant_status']
          p_token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      ai_model: 'claude-haiku-4-5' | 'claude-sonnet-4-6'
      ai_provider: 'anthropic'
      participant_status: 'invited' | 'maybe' | 'going' | 'not_going'
      plan_option_type: 'date_time' | 'location' | 'custom'
      plan_source_type: 'image' | 'link' | 'text' | 'manual'
      plan_status: 'draft' | 'voting' | 'confirmed' | 'cancelled' | 'archived'
      plan_type:
        | 'restaurant'
        | 'cafe'
        | 'cinema'
        | 'event'
        | 'concert'
        | 'activity'
        | 'birthday'
        | 'meetup'
        | 'walk'
        | 'casual_meeting'
        | 'class_workshop'
        | 'match'
        | 'short_trip'
        | 'other'
        | 'unknown'
      plan_visibility: 'public_link' | 'private'
      processing_job_status: 'pending' | 'processing' | 'completed' | 'failed'
      reminder_channel: 'push' | 'email' | 'calendar'
      reminder_status: 'scheduled' | 'sent' | 'failed' | 'cancelled'
      vote_value: 'yes' | 'maybe' | 'no'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update']
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T]

// ---------------------------------------------------------------------------
// Atajos por tabla / enum — para no escribir Tables<'plans'> en cada lugar
// ---------------------------------------------------------------------------
export type Profile = Tables<'profiles'>
export type Plan = Tables<'plans'>
export type PlanSource = Tables<'plan_sources'>
export type PlanOption = Tables<'plan_options'>
export type PlanParticipant = Tables<'plan_participants'>
export type PlanVote = Tables<'plan_votes'>
export type PlanComment = Tables<'plan_comments'>
export type PlanChecklistItem = Tables<'plan_checklist_items'>
export type PlanReminder = Tables<'plan_reminders'>
export type PublicLink = Tables<'public_links'>
export type ProcessingJob = Tables<'processing_jobs'>
export type AuditEvent = Tables<'audit_events'>

export type PlanStatus = Enums<'plan_status'>
export type PlanType = Enums<'plan_type'>
export type PlanSourceType = Enums<'plan_source_type'>
export type PlanOptionType = Enums<'plan_option_type'>
export type ParticipantStatus = Enums<'participant_status'>
export type VoteValue = Enums<'vote_value'>
export type ProcessingJobStatus = Enums<'processing_job_status'>
export type AiModel = Enums<'ai_model'>
export type AiProvider = Enums<'ai_provider'>
export type PlanVisibility = Enums<'plan_visibility'>
