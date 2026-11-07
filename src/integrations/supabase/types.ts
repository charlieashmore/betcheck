export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bc_checks: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          market_title: string | null
          platform: string | null
          result: Json
          rules_version: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs: Json
          market_title?: string | null
          platform?: string | null
          result: Json
          rules_version: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          market_title?: string | null
          platform?: string | null
          result?: Json
          rules_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_classifications: {
        Row: {
          category: string
          confidence: number
          label: string
          reasons: Json
          source: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          confidence: number
          label: string
          reasons?: Json
          source: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          confidence?: number
          label?: string
          reasons?: Json
          source?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_classifications_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "bc_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bc_classifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_coach_messages: {
        Row: {
          created_at: string
          facts: Json
          id: string
          message: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          facts: Json
          id?: string
          message: Json
          user_id: string
        }
        Update: {
          created_at?: string
          facts?: Json
          id?: string
          message?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_coach_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_demo_resets: {
        Row: {
          id: string
          reset_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reset_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reset_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bc_limits: {
        Row: {
          pending_effective_at: string | null
          pending_increase: Json | null
          per_bet_max: number | null
          self_exclusion_until: string | null
          updated_at: string
          user_id: string
          weekly_gambling_limit: number | null
        }
        Insert: {
          pending_effective_at?: string | null
          pending_increase?: Json | null
          per_bet_max?: number | null
          self_exclusion_until?: string | null
          updated_at?: string
          user_id: string
          weekly_gambling_limit?: number | null
        }
        Update: {
          pending_effective_at?: string | null
          pending_increase?: Json | null
          per_bet_max?: number | null
          self_exclusion_until?: string | null
          updated_at?: string
          user_id?: string
          weekly_gambling_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bc_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_merchant_feedback: {
        Row: {
          is_gambling: boolean
          merchant_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          is_gambling: boolean
          merchant_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          is_gambling?: boolean
          merchant_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_merchant_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_profiles: {
        Row: {
          created_at: string
          current_balance: number
          first_name: string | null
          id: string
          language: string
          plain_language: boolean
        }
        Insert: {
          created_at?: string
          current_balance?: number
          first_name?: string | null
          id: string
          language?: string
          plain_language?: boolean
        }
        Update: {
          created_at?: string
          current_balance?: number
          first_name?: string | null
          id?: string
          language?: string
          plain_language?: boolean
        }
        Relationships: []
      }
      bc_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          mcc: string | null
          posted_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          mcc?: string | null
          posted_at: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          mcc?: string | null
          posted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bc_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          affordability_result: Json
          benchmark_result: Json
          created_at: string
          fixture_id: string
          id: string
          inputs: Json
          rules_version: string
          side: string
          stake: number
          user_id: string
        }
        Insert: {
          affordability_result: Json
          benchmark_result: Json
          created_at?: string
          fixture_id: string
          id?: string
          inputs?: Json
          rules_version: string
          side: string
          stake: number
          user_id: string
        }
        Update: {
          affordability_result?: Json
          benchmark_result?: Json
          created_at?: string
          fixture_id?: string
          id?: string
          inputs?: Json
          rules_version?: string
          side?: string
          stake?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusions: {
        Row: {
          created_at: string
          id: string
          until: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          until: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          until?: string
          user_id?: string
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away: string
          home: string
          id: string
          kalshi_ticker: string
          settlement_rules: Json
          sport: string
          start_time: string
        }
        Insert: {
          away: string
          home: string
          id: string
          kalshi_ticker: string
          settlement_rules?: Json
          sport: string
          start_time: string
        }
        Update: {
          away?: string
          home?: string
          id?: string
          kalshi_ticker?: string
          settlement_rules?: Json
          sport?: string
          start_time?: string
        }
        Relationships: []
      }
      limits: {
        Row: {
          effective_at: string | null
          monthly_income_after_essentials: number
          monthly_loss_limit: number
          monthly_stake_limit: number
          pending_increase: Json | null
          per_bet_max: number
          updated_at: string
          user_id: string
        }
        Insert: {
          effective_at?: string | null
          monthly_income_after_essentials: number
          monthly_loss_limit: number
          monthly_stake_limit: number
          pending_increase?: Json | null
          per_bet_max: number
          updated_at?: string
          user_id: string
        }
        Update: {
          effective_at?: string | null
          monthly_income_after_essentials?: number
          monthly_loss_limit?: number
          monthly_stake_limit?: number
          pending_increase?: Json | null
          per_bet_max?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_mappings: {
        Row: {
          book_market_id: string
          fixture_id: string
          id: string
          kalshi_ticker: string
          source: string
          verified: boolean
        }
        Insert: {
          book_market_id: string
          fixture_id: string
          id?: string
          kalshi_ticker: string
          source: string
          verified?: boolean
        }
        Update: {
          book_market_id?: string
          fixture_id?: string
          id?: string
          kalshi_ticker?: string
          source?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "market_mappings_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      placed_trades: {
        Row: {
          check_id: string
          outcome: string | null
          placed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          check_id: string
          outcome?: string | null
          placed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          check_id?: string
          outcome?: string | null
          placed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placed_trades_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: true
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      price_snapshots: {
        Row: {
          fetched_at: string
          id: number
          market_id: string
          outcome: string
          price_or_odds: number
          source: string
        }
        Insert: {
          fetched_at?: string
          id?: never
          market_id: string
          outcome: string
          price_or_odds: number
          source: string
        }
        Update: {
          fetched_at?: string
          id?: never
          market_id?: string
          outcome?: string
          price_or_odds?: number
          source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string
          created_at: string
          dob_confirmed: boolean
          id: string
        }
        Insert: {
          country: string
          created_at?: string
          dob_confirmed?: boolean
          id: string
        }
        Update: {
          country?: string
          created_at?: string
          dob_confirmed?: boolean
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
