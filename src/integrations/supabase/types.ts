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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      countries: {
        Row: {
          border_disputes: string[]
          capital: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          corruption_rating: number
          created_at: string
          current_conflicts: string[]
          democracy_rating: number
          flag_emoji: string
          gdp_usd: number
          government_type: string
          head_of_government: string
          head_of_state: string
          historical_conflicts: string[]
          id: string
          ideologies: string[]
          importance: Database["public"]["Enums"]["importance_level"]
          insurgencies: string[]
          intl_organizations: string[]
          iso_a3: string
          iso_numeric: string
          key_allies: string[]
          key_rivals: string[]
          last_updated: string
          latitude: number
          longitude: number
          major_parties: Json
          military_info: string
          name: string
          political_issues: string[]
          political_system: string
          political_violence_risk:
            | Database["public"]["Enums"]["violence_risk"]
            | null
          population: number
          region: string
          research_notes: string
          stability_rating: number
          subregion: string
          tags: string[]
          terrorism_risk: string
          why_this_matters: string
        }
        Insert: {
          border_disputes?: string[]
          capital?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          corruption_rating?: number
          created_at?: string
          current_conflicts?: string[]
          democracy_rating?: number
          flag_emoji?: string
          gdp_usd?: number
          government_type?: string
          head_of_government?: string
          head_of_state?: string
          historical_conflicts?: string[]
          id?: string
          ideologies?: string[]
          importance?: Database["public"]["Enums"]["importance_level"]
          insurgencies?: string[]
          intl_organizations?: string[]
          iso_a3: string
          iso_numeric: string
          key_allies?: string[]
          key_rivals?: string[]
          last_updated?: string
          latitude?: number
          longitude?: number
          major_parties?: Json
          military_info?: string
          name: string
          political_issues?: string[]
          political_system?: string
          political_violence_risk?:
            | Database["public"]["Enums"]["violence_risk"]
            | null
          population?: number
          region?: string
          research_notes?: string
          stability_rating?: number
          subregion?: string
          tags?: string[]
          terrorism_risk?: string
          why_this_matters?: string
        }
        Update: {
          border_disputes?: string[]
          capital?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          corruption_rating?: number
          created_at?: string
          current_conflicts?: string[]
          democracy_rating?: number
          flag_emoji?: string
          gdp_usd?: number
          government_type?: string
          head_of_government?: string
          head_of_state?: string
          historical_conflicts?: string[]
          id?: string
          ideologies?: string[]
          importance?: Database["public"]["Enums"]["importance_level"]
          insurgencies?: string[]
          intl_organizations?: string[]
          iso_a3?: string
          iso_numeric?: string
          key_allies?: string[]
          key_rivals?: string[]
          last_updated?: string
          latitude?: number
          longitude?: number
          major_parties?: Json
          military_info?: string
          name?: string
          political_issues?: string[]
          political_system?: string
          political_violence_risk?:
            | Database["public"]["Enums"]["violence_risk"]
            | null
          population?: number
          region?: string
          research_notes?: string
          stability_rating?: number
          subregion?: string
          tags?: string[]
          terrorism_risk?: string
          why_this_matters?: string
        }
        Relationships: []
      }
      event_countries: {
        Row: {
          country_id: string
          event_id: string
          role: string
        }
        Insert: {
          country_id: string
          event_id: string
          role?: string
        }
        Update: {
          country_id?: string
          event_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_countries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "political_events"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_events: {
        Row: {
          event_id: string
          figure_id: string
          role: string
        }
        Insert: {
          event_id: string
          figure_id: string
          role?: string
        }
        Update: {
          event_id?: string
          figure_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "political_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_events_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "political_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_organizations: {
        Row: {
          figure_id: string
          organization_id: string
          role: string
        }
        Insert: {
          figure_id: string
          organization_id: string
          role?: string
        }
        Update: {
          figure_id?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "figure_organizations_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "political_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          correct: boolean
          flashcard_id: string
          id: string
          reviewed_at: string
        }
        Insert: {
          correct: boolean
          flashcard_id: string
          id?: string
          reviewed_at?: string
        }
        Update: {
          correct?: boolean
          flashcard_id?: string
          id?: string
          reviewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          category: string
          country_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          event_id: string | null
          figure_id: string | null
          id: string
          organization_id: string | null
          question: string
          tags: string[]
        }
        Insert: {
          answer: string
          category?: string
          country_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          event_id?: string | null
          figure_id?: string | null
          id?: string
          organization_id?: string | null
          question: string
          tags?: string[]
        }
        Update: {
          answer?: string
          category?: string
          country_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          event_id?: string | null
          figure_id?: string | null
          id?: string
          organization_id?: string | null
          question?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "political_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "political_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          country_id: string
          membership_status: string
          organization_id: string
        }
        Insert: {
          country_id: string
          membership_status?: string
          organization_id: string
        }
        Update: {
          country_id?: string
          membership_status?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          abbreviation: string
          created_at: string
          founded: string | null
          headquarters: string
          id: string
          importance: Database["public"]["Enums"]["importance_level"]
          last_updated: string
          leaders: string[]
          member_count: number
          name: string
          org_type: string
          purpose: string
          tags: string[]
          website: string
          why_this_matters: string
        }
        Insert: {
          abbreviation?: string
          created_at?: string
          founded?: string | null
          headquarters?: string
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          last_updated?: string
          leaders?: string[]
          member_count?: number
          name: string
          org_type?: string
          purpose?: string
          tags?: string[]
          website?: string
          why_this_matters?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          founded?: string | null
          headquarters?: string
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          last_updated?: string
          leaders?: string[]
          member_count?: number
          name?: string
          org_type?: string
          purpose?: string
          tags?: string[]
          website?: string
          why_this_matters?: string
        }
        Relationships: []
      }
      political_events: {
        Row: {
          causes: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          consequences: string
          created_at: string
          end_date: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          importance: Database["public"]["Enums"]["importance_level"]
          is_ongoing: boolean
          key_actors: string[]
          last_updated: string
          location: string
          name: string
          summary: string
          tags: string[]
          why_this_matters: string
        }
        Insert: {
          causes?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          consequences?: string
          created_at?: string
          end_date?: string | null
          event_date: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          is_ongoing?: boolean
          key_actors?: string[]
          last_updated?: string
          location?: string
          name: string
          summary?: string
          tags?: string[]
          why_this_matters?: string
        }
        Update: {
          causes?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          consequences?: string
          created_at?: string
          end_date?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          is_ongoing?: boolean
          key_actors?: string[]
          last_updated?: string
          location?: string
          name?: string
          summary?: string
          tags?: string[]
          why_this_matters?: string
        }
        Relationships: []
      }
      political_figures: {
        Row: {
          biography: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          country_id: string | null
          created_at: string
          id: string
          ideology: string
          importance: Database["public"]["Enums"]["importance_level"]
          important_actions: string[]
          in_office_since: string
          last_updated: string
          name: string
          party: string
          position: string
          tags: string[]
          why_this_matters: string
        }
        Insert: {
          biography?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          country_id?: string | null
          created_at?: string
          id?: string
          ideology?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          important_actions?: string[]
          in_office_since?: string
          last_updated?: string
          name: string
          party?: string
          position?: string
          tags?: string[]
          why_this_matters?: string
        }
        Update: {
          biography?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          country_id?: string | null
          created_at?: string
          id?: string
          ideology?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          important_actions?: string[]
          in_office_since?: string
          last_updated?: string
          name?: string
          party?: string
          position?: string
          tags?: string[]
          why_this_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "political_figures_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      record_sources: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note: string
          source_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note?: string
          source_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      research_notes: {
        Row: {
          body: string
          category: string
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          importance: Database["public"]["Enums"]["importance_level"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          importance?: Database["public"]["Enums"]["importance_level"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          accessed_date: string
          created_at: string
          id: string
          information_used: string
          notes: string
          published_date: string | null
          publisher: string
          reliability: Database["public"]["Enums"]["reliability_rating"]
          source_type: Database["public"]["Enums"]["source_type"]
          summary: string
          title: string
          url: string
        }
        Insert: {
          accessed_date?: string
          created_at?: string
          id?: string
          information_used?: string
          notes?: string
          published_date?: string | null
          publisher?: string
          reliability?: Database["public"]["Enums"]["reliability_rating"]
          source_type?: Database["public"]["Enums"]["source_type"]
          summary?: string
          title: string
          url?: string
        }
        Update: {
          accessed_date?: string
          created_at?: string
          id?: string
          information_used?: string
          notes?: string
          published_date?: string | null
          publisher?: string
          reliability?: Database["public"]["Enums"]["reliability_rating"]
          source_type?: Database["public"]["Enums"]["source_type"]
          summary?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      statistics: {
        Row: {
          category: string
          country_id: string | null
          created_at: string
          id: string
          methodology: string
          name: string
          source_id: string | null
          unit: string
          value: number
          why_this_matters: string
          year: number
        }
        Insert: {
          category?: string
          country_id?: string | null
          created_at?: string
          id?: string
          methodology?: string
          name: string
          source_id?: string | null
          unit?: string
          value?: number
          why_this_matters?: string
          year: number
        }
        Update: {
          category?: string
          country_id?: string | null
          created_at?: string
          id?: string
          methodology?: string
          name?: string
          source_id?: string | null
          unit?: string
          value?: number
          why_this_matters?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "statistics_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "statistics_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      confidence_level: "confirmed" | "likely" | "disputed" | "unknown"
      difficulty_level: "easy" | "medium" | "hard"
      event_type:
        | "election"
        | "protest"
        | "revolution"
        | "coup"
        | "war"
        | "treaty"
        | "crisis"
        | "sanction"
        | "referendum"
      importance_level: "critical" | "high" | "medium" | "low"
      reliability_rating: "high" | "medium" | "low"
      source_type:
        | "government_report"
        | "academic_paper"
        | "news_article"
        | "ngo_report"
        | "think_tank"
        | "database"
        | "book"
      violence_risk: "low" | "moderate" | "high" | "severe"
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
    Enums: {
      confidence_level: ["confirmed", "likely", "disputed", "unknown"],
      difficulty_level: ["easy", "medium", "hard"],
      event_type: [
        "election",
        "protest",
        "revolution",
        "coup",
        "war",
        "treaty",
        "crisis",
        "sanction",
        "referendum",
      ],
      importance_level: ["critical", "high", "medium", "low"],
      reliability_rating: ["high", "medium", "low"],
      source_type: [
        "government_report",
        "academic_paper",
        "news_article",
        "ngo_report",
        "think_tank",
        "database",
        "book",
      ],
      violence_risk: ["low", "moderate", "high", "severe"],
    },
  },
} as const
