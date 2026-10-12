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
      advances: {
        Row: {
          amount: number
          applied_amount: number
          created_at: string
          id: string
          issued_on: string
          purpose: string
          recorded_by: string | null
          student_id: string
          version: number
        }
        Insert: {
          amount: number
          applied_amount?: number
          created_at?: string
          id?: string
          issued_on?: string
          purpose: string
          recorded_by?: string | null
          student_id: string
          version?: number
        }
        Update: {
          amount?: number
          applied_amount?: number
          created_at?: string
          id?: string
          issued_on?: string
          purpose?: string
          recorded_by?: string | null
          student_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "advances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiary_profiles: {
        Row: {
          account_holder: string
          account_identifier: string
          bank_name: string
          change_note: string | null
          created_at: string
          created_by: string | null
          id: string
          ifsc: string
          is_current: boolean
          student_id: string
          version: number
        }
        Insert: {
          account_holder: string
          account_identifier: string
          bank_name: string
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ifsc: string
          is_current?: boolean
          student_id: string
          version: number
        }
        Update: {
          account_holder?: string
          account_identifier?: string
          bank_name?: string
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ifsc?: string
          is_current?: boolean
          student_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "beneficiary_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_events: {
        Row: {
          action: string
          actor_id: string | null
          claim_id: string
          comment: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["claim_status"] | null
          id: string
          java_trace: string | null
          to_status: Database["public"]["Enums"]["claim_status"] | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          claim_id: string
          comment?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["claim_status"] | null
          id?: string
          java_trace?: string | null
          to_status?: Database["public"]["Enums"]["claim_status"] | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          claim_id?: string
          comment?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["claim_status"] | null
          id?: string
          java_trace?: string | null
          to_status?: Database["public"]["Enums"]["claim_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_events_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          advance_id: string | null
          assigned_faculty: string | null
          claim_no: string
          created_at: string
          created_by: string
          id: string
          purpose: string
          revision: number
          status: Database["public"]["Enums"]["claim_status"]
          student_id: string
          submitted_at: string | null
          title: string
          total_approved: number | null
          total_claimed: number | null
          updated_at: string
          version: number
        }
        Insert: {
          advance_id?: string | null
          assigned_faculty?: string | null
          claim_no?: string
          created_at?: string
          created_by: string
          id?: string
          purpose: string
          revision?: number
          status?: Database["public"]["Enums"]["claim_status"]
          student_id: string
          submitted_at?: string | null
          title: string
          total_approved?: number | null
          total_claimed?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          advance_id?: string | null
          assigned_faculty?: string | null
          claim_no?: string
          created_at?: string
          created_by?: string
          id?: string
          purpose?: string
          revision?: number
          status?: Database["public"]["Enums"]["claim_status"]
          student_id?: string
          submitted_at?: string | null
          title?: string
          total_approved?: number | null
          total_claimed?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "claims_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          approved_amount: number | null
          category: Database["public"]["Enums"]["expense_category"]
          claim_id: string
          claimed_amount: number
          created_at: string
          description: string
          expense_date: string
          id: string
          position: number
          reduction_reason: string | null
          vendor_name: string | null
        }
        Insert: {
          approved_amount?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          claim_id: string
          claimed_amount: number
          created_at?: string
          description: string
          expense_date: string
          id?: string
          position?: number
          reduction_reason?: string | null
          vendor_name?: string | null
        }
        Update: {
          approved_amount?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          claim_id?: string
          claimed_amount?: number
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          position?: number
          reduction_reason?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          department: string
          division: string
          email: string
          full_name: string
          id: string
          is_demo: boolean
          prn: string
          user_id: string | null
          year: string
        }
        Insert: {
          created_at?: string
          department: string
          division: string
          email: string
          full_name: string
          id?: string
          is_demo?: boolean
          prn: string
          user_id?: string | null
          year: string
        }
        Update: {
          created_at?: string
          department?: string
          division?: string
          email?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          prn?: string
          user_id?: string | null
          year?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_claim_transition: {
        Args: {
          _action: string
          _actor: string
          _claim_id: string
          _comment: string
          _expected_version: number
          _java_trace: string
          _to_status: Database["public"]["Enums"]["claim_status"]
          _total_claimed: number
        }
        Returns: number
      }
      can_edit_claim: { Args: { _claim_id: string }; Returns: boolean }
      can_view_claim: { Args: { _claim_id: string }; Returns: boolean }
      current_student_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "faculty" | "finance"
      claim_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "changes_requested"
        | "rejected"
        | "approved"
      expense_category:
        | "stationery"
        | "refreshment"
        | "rent"
        | "design_material"
        | "printing"
        | "travel"
        | "equipment"
        | "other"
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
    Enums: {
      app_role: ["student", "faculty", "finance"],
      claim_status: [
        "draft",
        "submitted",
        "under_review",
        "changes_requested",
        "rejected",
        "approved",
      ],
      expense_category: [
        "stationery",
        "refreshment",
        "rent",
        "design_material",
        "printing",
        "travel",
        "equipment",
        "other",
      ],
    },
  },
} as const
