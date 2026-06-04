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
      ai_audit_log: {
        Row: {
          action: string
          approved_by: string | null
          created_at: string
          data_after: Json | null
          data_before: Json | null
          description: string
          entity: string
          entity_id: string | null
          human_approved: boolean | null
          id: string
          triggered_by: string
        }
        Insert: {
          action: string
          approved_by?: string | null
          created_at?: string
          data_after?: Json | null
          data_before?: Json | null
          description: string
          entity: string
          entity_id?: string | null
          human_approved?: boolean | null
          id?: string
          triggered_by?: string
        }
        Update: {
          action?: string
          approved_by?: string | null
          created_at?: string
          data_after?: Json | null
          data_before?: Json | null
          description?: string
          entity?: string
          entity_id?: string | null
          human_approved?: boolean | null
          id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_log_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_source: string | null
          alert_type: string
          auto_generated: boolean | null
          channel_id: string | null
          clinic_id: string | null
          created_at: string
          escalated_at: string | null
          escalated_to: string | null
          id: string
          message: string
          notes: string | null
          resolution_notes: string | null
          resolved_at: string | null
          responsible: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_source?: string | null
          alert_type: string
          auto_generated?: boolean | null
          channel_id?: string | null
          clinic_id?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          message: string
          notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responsible?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_source?: string | null
          alert_type?: string
          auto_generated?: boolean | null
          channel_id?: string | null
          clinic_id?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          message?: string
          notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_volume_snapshots: {
        Row: {
          channel_id: string
          clinic_id: string
          cost_brl: number
          created_at: string
          delivered: number
          exchange_rate: number | null
          failed: number
          id: string
          period: string
          read: number
          received: number
          sent: number
          snapshot_date: string
          source: string
        }
        Insert: {
          channel_id: string
          clinic_id: string
          cost_brl?: number
          created_at?: string
          delivered?: number
          exchange_rate?: number | null
          failed?: number
          id?: string
          period?: string
          read?: number
          received?: number
          sent?: number
          snapshot_date?: string
          source?: string
        }
        Update: {
          channel_id?: string
          clinic_id?: string
          cost_brl?: number
          created_at?: string
          delivered?: number
          exchange_rate?: number | null
          failed?: number
          id?: string
          period?: string
          read?: number
          received?: number
          sent?: number
          snapshot_date?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_volume_snapshots_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_volume_snapshots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_volume_snapshots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
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
          collector: string | null
          connected: boolean | null
          created_at: string
          data_origin: Database["public"]["Enums"]["data_origin"]
          has_restriction: boolean | null
          id: string
          is_latest: boolean
          last_check: string
          last_message_received: string | null
          last_message_sent: string | null
          message_limit: number | null
          number_status: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected: boolean | null
          quality_rating: Database["public"]["Enums"]["quality_rating"] | null
          raw_payload: Json | null
          receiving_messages: boolean | null
          sending_messages: boolean | null
          session_expired: boolean | null
        }
        Insert: {
          channel_id: string
          collector?: string | null
          connected?: boolean | null
          created_at?: string
          data_origin?: Database["public"]["Enums"]["data_origin"]
          has_restriction?: boolean | null
          id?: string
          is_latest?: boolean
          last_check?: string
          last_message_received?: string | null
          last_message_sent?: string | null
          message_limit?: number | null
          number_status?: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected?: boolean | null
          quality_rating?: Database["public"]["Enums"]["quality_rating"] | null
          raw_payload?: Json | null
          receiving_messages?: boolean | null
          sending_messages?: boolean | null
          session_expired?: boolean | null
        }
        Update: {
          channel_id?: string
          collector?: string | null
          connected?: boolean | null
          created_at?: string
          data_origin?: Database["public"]["Enums"]["data_origin"]
          has_restriction?: boolean | null
          id?: string
          is_latest?: boolean
          last_check?: string
          last_message_received?: string | null
          last_message_sent?: string | null
          message_limit?: number | null
          number_status?: Database["public"]["Enums"]["number_status"] | null
          qr_disconnected?: boolean | null
          quality_rating?: Database["public"]["Enums"]["quality_rating"] | null
          raw_payload?: Json | null
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
          access_token_hint: string | null
          activated_at: string | null
          carrier: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          chip_iccid: string | null
          clinic_id: string
          created_at: string
          deactivated_at: string | null
          device: string | null
          external_id: string | null
          id: string
          last_status_change: string | null
          notes: string | null
          phone_number: string
          phone_number_id: string | null
          platform_name: string | null
          purchase_date: string | null
          responsible: string | null
          status: Database["public"]["Enums"]["channel_status"]
          updated_at: string
          waba_id: string | null
        }
        Insert: {
          access_token_hint?: string | null
          activated_at?: string | null
          carrier?: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          chip_iccid?: string | null
          clinic_id: string
          created_at?: string
          deactivated_at?: string | null
          device?: string | null
          external_id?: string | null
          id?: string
          last_status_change?: string | null
          notes?: string | null
          phone_number: string
          phone_number_id?: string | null
          platform_name?: string | null
          purchase_date?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          waba_id?: string | null
        }
        Update: {
          access_token_hint?: string | null
          activated_at?: string | null
          carrier?: string | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          chip_iccid?: string | null
          clinic_id?: string
          created_at?: string
          deactivated_at?: string | null
          device?: string | null
          external_id?: string | null
          id?: string
          last_status_change?: string | null
          notes?: string | null
          phone_number?: string
          phone_number_id?: string | null
          platform_name?: string | null
          purchase_date?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["channel_status"]
          updated_at?: string
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          clinic_id: string
          confirmed_by: string | null
          contract_id: string
          created_at: string
          due_date: string
          external_id: string | null
          id: string
          paid_at: string | null
          status: string
          type: string
        }
        Insert: {
          amount: number
          clinic_id: string
          confirmed_by?: string | null
          contract_id: string
          created_at?: string
          due_date: string
          external_id?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          confirmed_by?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string
          external_id?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_assignments: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_assignments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_assignments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_products: {
        Row: {
          active: boolean
          clinic_id: string
          ended_at: string | null
          id: string
          product: Database["public"]["Enums"]["product_type"]
          sale_id: string | null
          started_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          ended_at?: string | null
          id?: string
          product: Database["public"]["Enums"]["product_type"]
          sale_id?: string | null
          started_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          ended_at?: string | null
          id?: string
          product?: Database["public"]["Enums"]["product_type"]
          sale_id?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_products_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          external_id: string | null
          external_ref: string | null
          id: string
          name: string
          nome_fantasia: string | null
          notes: string | null
          phone: string | null
          plan: string | null
          razao_social: string | null
          responsible: string | null
          segment: string | null
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_ref?: string | null
          id?: string
          name: string
          nome_fantasia?: string | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          razao_social?: string | null
          responsible?: string | null
          segment?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_ref?: string | null
          id?: string
          name?: string
          nome_fantasia?: string | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          razao_social?: string | null
          responsible?: string | null
          segment?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
          website?: string | null
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
          {
            foreignKeyName: "contingency_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clinic_id: string
          contract_months: number
          created_at: string
          end_date: string | null
          id: string
          pdf_url: string | null
          product: Database["public"]["Enums"]["product_type"]
          sale_id: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          value_monthly: number
          value_setup: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clinic_id: string
          contract_months: number
          created_at?: string
          end_date?: string | null
          id?: string
          pdf_url?: string | null
          product: Database["public"]["Enums"]["product_type"]
          sale_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          value_monthly: number
          value_setup?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clinic_id?: string
          contract_months?: number
          created_at?: string
          end_date?: string | null
          id?: string
          pdf_url?: string | null
          product?: Database["public"]["Enums"]["product_type"]
          sale_id?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          value_monthly?: number
          value_setup?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_users: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["hub_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["hub_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["hub_role"]
          updated_at?: string
        }
        Relationships: []
      }
      meta_template_metrics: {
        Row: {
          clinic_id: string
          cost_brl: number
          cost_usd: number
          created_at: string
          delivered: number
          failed: number
          id: string
          metric_date: string
          read: number
          sent: number
          template_id: string
        }
        Insert: {
          clinic_id: string
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          delivered?: number
          failed?: number
          id?: string
          metric_date?: string
          read?: number
          sent?: number
          template_id: string
        }
        Update: {
          clinic_id?: string
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          delivered?: number
          failed?: number
          id?: string
          metric_date?: string
          read?: number
          sent?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_template_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_template_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_template_metrics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "meta_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_templates: {
        Row: {
          body_text: string | null
          category: Database["public"]["Enums"]["template_category"]
          channel_id: string
          clinic_id: string
          created_at: string
          footer_text: string | null
          header_type: string | null
          id: string
          language: string
          last_synced_at: string | null
          meta_template_id: string | null
          name: string
          previous_category:
            | Database["public"]["Enums"]["template_category"]
            | null
          status: Database["public"]["Enums"]["template_status"]
          updated_at: string
        }
        Insert: {
          body_text?: string | null
          category: Database["public"]["Enums"]["template_category"]
          channel_id: string
          clinic_id: string
          created_at?: string
          footer_text?: string | null
          header_type?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name: string
          previous_category?:
            | Database["public"]["Enums"]["template_category"]
            | null
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
        }
        Update: {
          body_text?: string | null
          category?: Database["public"]["Enums"]["template_category"]
          channel_id?: string
          clinic_id?: string
          created_at?: string
          footer_text?: string | null
          header_type?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name?: string
          previous_category?:
            | Database["public"]["Enums"]["template_category"]
            | null
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_templates_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          completed_at: string | null
          description: string | null
          due_at: string | null
          id: string
          notes: string | null
          onboarding_id: string
          order_index: number
          responsible_id: string | null
          sla_hours: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
          step_key: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          onboarding_id: string
          order_index: number
          responsible_id?: string | null
          sla_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_key: string
          title: string
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          onboarding_id?: string
          order_index?: number
          responsible_id?: string | null
          sla_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_key?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboardings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_steps_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboardings: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          id: string
          product: Database["public"]["Enums"]["product_type"]
          responsible_id: string | null
          sale_id: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          product: Database["public"]["Enums"]["product_type"]
          responsible_id?: string | null
          sale_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          product?: Database["public"]["Enums"]["product_type"]
          responsible_id?: string | null
          sale_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
        }
        Relationships: [
          {
            foreignKeyName: "onboardings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_approvals: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          payload: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_approvals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          clinic_id: string
          contract_months: number | null
          created_at: string
          external_ref: string | null
          id: string
          notes: string | null
          origin: string
          product: Database["public"]["Enums"]["product_type"]
          sold_at: string
          sold_by: string | null
          value_monthly: number | null
          value_setup: number | null
        }
        Insert: {
          clinic_id: string
          contract_months?: number | null
          created_at?: string
          external_ref?: string | null
          id?: string
          notes?: string | null
          origin?: string
          product: Database["public"]["Enums"]["product_type"]
          sold_at?: string
          sold_by?: string | null
          value_monthly?: number | null
          value_setup?: number | null
        }
        Update: {
          clinic_id?: string
          contract_months?: number | null
          created_at?: string
          external_ref?: string | null
          id?: string
          notes?: string | null
          origin?: string
          product?: Database["public"]["Enums"]["product_type"]
          sold_at?: string
          sold_by?: string | null
          value_monthly?: number | null
          value_setup?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vw_clinic_scores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_clinic_scores: {
        Row: {
          active_channels_count: number | null
          city: string | null
          contingency_class: string | null
          contingency_score: number | null
          critical_alerts_count: number | null
          health_status: string | null
          id: string | null
          name: string | null
          open_alerts_count: number | null
          responsible: string | null
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_user_can_access_clinic: {
        Args: { p_clinic_id: string }
        Returns: boolean
      }
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
      hub_role: "admin" | "gestor" | "operador"
      number_status:
        | "conectado"
        | "restrito"
        | "banido"
        | "pendente"
        | "desconhecido"
      onboarding_status:
        | "aguardando_dados"
        | "em_execucao"
        | "pausado"
        | "concluido"
        | "cancelado"
      product_type:
        | "crm"
        | "trafego_pago"
        | "trafego_com_agendamento"
        | "gestao_consultoria"
        | "projeto_escola"
      quality_rating: "alto" | "medio" | "baixo" | "desconhecido"
      step_status:
        | "pendente"
        | "em_andamento"
        | "concluido"
        | "bloqueado"
        | "pulado"
      template_category: "utility" | "marketing" | "authentication"
      template_status:
        | "aprovado"
        | "pendente"
        | "reprovado"
        | "pausado"
        | "desativado"
        | "em_revisao"
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
      hub_role: ["admin", "gestor", "operador"],
      number_status: [
        "conectado",
        "restrito",
        "banido",
        "pendente",
        "desconhecido",
      ],
      onboarding_status: [
        "aguardando_dados",
        "em_execucao",
        "pausado",
        "concluido",
        "cancelado",
      ],
      product_type: [
        "crm",
        "trafego_pago",
        "trafego_com_agendamento",
        "gestao_consultoria",
        "projeto_escola",
      ],
      quality_rating: ["alto", "medio", "baixo", "desconhecido"],
      step_status: [
        "pendente",
        "em_andamento",
        "concluido",
        "bloqueado",
        "pulado",
      ],
      template_category: ["utility", "marketing", "authentication"],
      template_status: [
        "aprovado",
        "pendente",
        "reprovado",
        "pausado",
        "desativado",
        "em_revisao",
      ],
    },
  },
} as const
