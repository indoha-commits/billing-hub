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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          end_time: string | null
          google_event_id: string | null
          id: string
          is_attended: boolean | null
          meeting_link: string | null
          start_time: string
          tenant_id: string | null
          title: string
          walkthrough_complete: boolean | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          is_attended?: boolean | null
          meeting_link?: string | null
          start_time: string
          tenant_id?: string | null
          title: string
          walkthrough_complete?: boolean | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          is_attended?: boolean | null
          meeting_link?: string | null
          start_time?: string
          tenant_id?: string | null
          title?: string
          walkthrough_complete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          payment_link: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          payment_link?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          is_resolved: boolean
          metadata: Json | null
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          metadata?: Json | null
          tenant_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          metadata?: Json | null
          tenant_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          external_reference: string | null
          id: string
          intent_type: string
          last_error: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          external_reference?: string | null
          id?: string
          intent_type?: string
          last_error?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          external_reference?: string | null
          id?: string
          intent_type?: string
          last_error?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      provisioning_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          logs: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["provisioning_status"]
          tenant_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          logs?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["provisioning_status"]
          tenant_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          logs?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["provisioning_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          monthly_amount: number
          next_charge_at: string
          retry_count: number
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          monthly_amount: number
          next_charge_at: string
          retry_count?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          monthly_amount?: number
          next_charge_at?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          admin_email: string
          admin_phone: string | null
          cargo_limit: number
          cargo_usage: number
          company_logo_url: string | null
          company_name: string
          country: string | null
          created_at: string
          currency: string | null
          id: string
          monthly_plan_price: number
          next_billing_date: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          admin_email: string
          admin_phone?: string | null
          cargo_limit?: number
          cargo_usage?: number
          company_logo_url?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          monthly_plan_price?: number
          next_billing_date?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string
          admin_phone?: string | null
          cargo_limit?: number
          cargo_usage?: number
          company_logo_url?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          monthly_plan_price?: number
          next_billing_date?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          provider: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          provider: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible"
      notification_type:
        | "payment_confirmed"
        | "provisioning_failed"
        | "payment_failed"
        | "webhook_issue"
        | "cargo_limit_exceeded"
      payment_provider: "momo" | "mpesa" | "stripe" | "manual"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      provisioning_status: "queued" | "running" | "completed" | "failed"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
        | "trialing"
      tenant_status:
        | "pending_payment"
        | "ready_to_provision"
        | "provisioning"
        | "active"
        | "past_due"
        | "suspended"
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
      app_role: ["admin", "operator", "viewer"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      notification_type: [
        "payment_confirmed",
        "provisioning_failed",
        "payment_failed",
        "webhook_issue",
        "cargo_limit_exceeded",
      ],
      payment_provider: ["momo", "mpesa", "stripe", "manual"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      provisioning_status: ["queued", "running", "completed", "failed"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "paused",
        "trialing",
      ],
      tenant_status: [
        "pending_payment",
        "ready_to_provision",
        "provisioning",
        "active",
        "past_due",
        "suspended",
      ],
    },
  },
} as const
