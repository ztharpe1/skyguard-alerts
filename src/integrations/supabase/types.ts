export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alert_recipients: {
        Row: {
          alert_id: string
          created_at: string
          delivered_at: string | null
          delivery_method: string
          delivery_status: string
          id: string
          read_at: string | null
          read_status: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_method: string
          delivery_status?: string
          id?: string
          read_at?: string | null
          read_status?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          delivery_status?: string
          id?: string
          read_at?: string | null
          read_status?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_recipients_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          priority: string
          recipients: string
          sent_at: string | null
          sent_by: string | null
          status: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          priority: string
          recipients: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          recipients?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      qa_answers: {
        Row: {
          answer: string
          answered_by: string
          attachments: Json | null
          created_at: string
          id: string
          is_official: boolean
          question_id: string
          updated_at: string
        }
        Insert: {
          answer: string
          answered_by: string
          attachments?: Json | null
          created_at?: string
          id?: string
          is_official?: boolean
          question_id: string
          updated_at?: string
        }
        Update: {
          answer?: string
          answered_by?: string
          attachments?: Json | null
          created_at?: string
          id?: string
          is_official?: boolean
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "qa_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_questions: {
        Row: {
          asked_by: string
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          id: string
          job_number: string | null
          job_site: string | null
          priority: string
          question: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asked_by: string
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          id?: string
          job_number?: string | null
          job_site?: string | null
          priority?: string
          question: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asked_by?: string
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          id?: string
          job_number?: string | null
          job_site?: string | null
          priority?: string
          question?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          ip_address: unknown | null
          operation: string
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation: string
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation?: string
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          company_alerts: boolean
          created_at: string
          email_enabled: boolean
          emergency_alerts: boolean
          id: string
          push_enabled: boolean
          sms_enabled: boolean
          system_alerts: boolean
          updated_at: string
          user_id: string
          weather_alerts: boolean
        }
        Insert: {
          company_alerts?: boolean
          created_at?: string
          email_enabled?: boolean
          emergency_alerts?: boolean
          id?: string
          push_enabled?: boolean
          sms_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id: string
          weather_alerts?: boolean
        }
        Update: {
          company_alerts?: boolean
          created_at?: string
          email_enabled?: boolean
          emergency_alerts?: boolean
          id?: string
          push_enabled?: boolean
          sms_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id?: string
          weather_alerts?: boolean
        }
        Relationships: []
      }
      weather_alert_logs: {
        Row: {
          affected_users_count: number
          alert_id: string | null
          created_at: string
          id: string
          weather_alert_id: string | null
          weather_data: Json
        }
        Insert: {
          affected_users_count?: number
          alert_id?: string | null
          created_at?: string
          id?: string
          weather_alert_id?: string | null
          weather_data: Json
        }
        Update: {
          affected_users_count?: number
          alert_id?: string | null
          created_at?: string
          id?: string
          weather_alert_id?: string | null
          weather_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "weather_alert_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_alert_logs_weather_alert_id_fkey"
            columns: ["weather_alert_id"]
            isOneToOne: false
            referencedRelation: "weather_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alerts: {
        Row: {
          alert_message: string
          alert_title: string
          alert_type: string
          condition_operator: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          location_filter: string | null
          threshold_value: number
          updated_at: string
        }
        Insert: {
          alert_message: string
          alert_title: string
          alert_type: string
          condition_operator: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          location_filter?: string | null
          threshold_value: number
          updated_at?: string
        }
        Update: {
          alert_message?: string
          alert_title?: string
          alert_type?: string
          condition_operator?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          location_filter?: string | null
          threshold_value?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_operation: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
