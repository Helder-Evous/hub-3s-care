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
      alerts: {
        Row: {
          alert_type: string
          channel_id: string | null
          clinic_id: string | null
          created_at: string
          id: string
          message: string
          notes: string | null
          resolved_at: string | null
          responsible: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
        }
        Insert: {
          alert_type: string
          channel_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          message: string
          notes?: string | null
          resolved_at?: string | null
          responsible?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Update: {
          alert_type?: string
          channel_id?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          message?: string
          notes?: string | null
          resolved_at?: string | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      channel_monitoring: {
        Row: {
          channel_id: string
          connected: boolean | null
          created_at: string
          data_origin: Database["public"]["Enums"]["data_origin"]
          has_restriction: boolean | null
          id: string
          last_check: string
          last_message_received: string | null
          last_message_sent: string | null
          message_limit: number | null
          number_status: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected: boolean | null
          quality_rating: Database["public"]["Enums"]["quality_rating"] | null
          receiving_messages: boolean | null
          sending_messages: boolean | null
          session_expired: boolean | null
        }
        Insert: {
          channel_id: string
          connected?: boolean | null
          created_at?: string
          data_origin?: Database["public"]["Enums"]["data_origin"]
          has_restriction?: boolean | null
          id?: string
          last_check?: string
          last_message_received?: string | null
          last_message_sent?: string | null
          message_limit?: number | null
          number_status?: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected?: boolean | null
          quality_rating?: Database["public"]["Enums"]["quality_rating"] | null
          receiving_messages?: boolean | null
          sending_messages?: boolean | null
          session_expired?: boolean | null
        }
        Update: {
          channel_id?: string
          connected?: boolean | null
          created_at?: string
          data_origin?: Database["public"]["Enums"]["data_origin"]
          has_restriction?: boolean | null
          id?: string
          last_check?: string
          last_message_received?: string | null
          last_message_sent?: string | null
          message_limit?: number | null
          number_status?: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected?: boolean | null
          quality_rating?: Database["public"]["Enums"]["quality_rating"] | null
          receiving_messages?: boolean | null
          sending_messages?: boolean | null
          session_expired?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_monitoring_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          activated_at: string | null
          carrier: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          clinic_id: string
          created_at: string
          device: string | null
          id: string
          notes: string | null
          phone_number: string
          responsible: string | null
          status: Database["public"]["Enums"]["channel_status"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          carrier?: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          clinic_id: string
          created_at?: string
          device?: string | null
          id?: string
          notes?: string | null
          phone_number: string
          responsible?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          carrier?: string | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          clinic_id?: string
          created_at?: string
          device?: string | null
          id?: string
          notes?: string | null
          phone_number?: string
          responsible?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          responsible: string | null
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          responsible?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
        }
        Relationships: []
      }
      contingency_items: {
        Row: {
          clinic_id: string
          has_approved_template: boolean
          has_backup_api: boolean
          has_backup_chip: boolean
          has_backup_device: boolean
          has_backup_number: boolean
          id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          has_approved_template?: boolean
          has_backup_api?: boolean
          has_backup_chip?: boolean
          has_backup_device?: boolean
          has_backup_number?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          has_approved_template?: boolean
          has_backup_api?: boolean
          has_backup_chip?: boolean
          has_backup_device?: boolean
          has_backup_number?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contingency_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
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
      alert_severity: "baixa" | "media" | "alta" | "critica"
      alert_status: "aberto" | "em_tratamento" | "resolvido"
      channel_status:
        | "ativo"
        | "em_atencao"
        | "critico"
        | "livre"
        | "bloqueado"
        | "desconectado"
      channel_type:
        | "api_oficial"
        | "whatsapp_comum"
        | "numero_reserva"
        | "api_reserva"
      clinic_status: "ativa" | "pausada" | "cancelada"
      data_origin: "meta_api" | "plataforma" | "manual" | "robo_tela"
      number_status:
        | "conectado"
        | "restrito"
        | "banido"
        | "pendente"
        | "desconhecido"
      quality_rating: "alto" | "medio" | "baixo" | "desconhecido"
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
      alert_severity: ["baixa", "media", "alta", "critica"],
      alert_status: ["aberto", "em_tratamento", "resolvido"],
      channel_status: [
        "ativo",
        "em_atencao",
        "critico",
        "livre",
        "bloqueado",
        "desconectado",
      ],
      channel_type: [
        "api_oficial",
        "whatsapp_comum",
        "numero_reserva",
        "api_reserva",
      ],
      clinic_status: ["ativa", "pausada", "cancelada"],
      data_origin: ["meta_api", "plataforma", "manual", "robo_tela"],
      number_status: [
        "conectado",
        "restrito",
        "banido",
        "pendente",
        "desconhecido",
      ],
      quality_rating: ["alto", "medio", "baixo", "desconhecido"],
    },
  },
} as const
