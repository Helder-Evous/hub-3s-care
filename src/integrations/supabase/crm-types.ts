/* ============================================================================
 * crm-types.ts — TIPOS MANUAIS DO SCHEMA `crm` (Controle de Lead)
 * ----------------------------------------------------------------------------
 * ⚠️  ARQUIVO MANUAL E TEMPORARIO.
 *     - Derivado das migrations 001–011 ja aplicadas (schema `crm`).
 *     - NAO foi gerado por `supabase gen types` (a geracao oficial public,crm
 *       falhou por permissao de conta / connection string indisponivel).
 *     - SUBSTITUIR este arquivo assim que a geracao oficial `--schema public,crm`
 *       funcionar (e entao remover este crm-types.ts).
 *     - Mantenha em sincronia manualmente se o schema `crm` mudar.
 * ============================================================================ */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* -------------------------------- Enums ----------------------------------- */
export type CrmRole =
  | "super_admin_3s"
  | "gestor_3s"
  | "cliente"
  | "gestor_unidade"
  | "crc";

export type PatientStatus = "prospecto" | "ativo" | "inativo" | "descartado";

export type LeadStage =
  | "novo"
  | "agendado"
  | "compareceu"
  | "em_avaliacao"
  | "orcamento"
  | "efetivado"
  | "pos_venda"
  | "perdido";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "remarcado"
  | "compareceu"
  | "faltou"
  | "cancelado";

export type BudgetStatus =
  | "rascunho"
  | "emitido"
  | "aceito"
  | "rejeitado"
  | "expirado"
  | "cancelado";

export type ActivityType =
  | "ligacao"
  | "whatsapp"
  | "nota"
  | "visita"
  | "email"
  | "outro";

export type SourceCategory =
  | "paga"
  | "organica"
  | "interna"
  | "importacao"
  | "sistema";

export type ReconciliationStatus =
  | "nao_aplicavel"
  | "pendente"
  | "conciliado"
  | "divergente"
  | "ignorado";

/* ----------------------------- CrmDatabase -------------------------------- */
export type CrmDatabase = {
  crm: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          role: CrmRole;
          full_name: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: CrmRole;
          full_name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: CrmRole;
          full_name?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      user_units: {
        Row: {
          id: string;
          user_id: string;
          clinic_id: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          clinic_id: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          clinic_id?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_units_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_units_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      module_clinics: {
        Row: {
          clinic_id: string;
          enabled: boolean;
          enabled_by: string | null;
          enabled_at: string;
        };
        Insert: {
          clinic_id: string;
          enabled?: boolean;
          enabled_by?: string | null;
          enabled_at?: string;
        };
        Update: {
          clinic_id?: string;
          enabled?: boolean;
          enabled_by?: string | null;
          enabled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_clinics_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: true;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_clinics_enabled_by_fkey";
            columns: ["enabled_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      lead_sources: {
        Row: {
          id: string;
          key: string;
          label: string;
          category: SourceCategory;
          managed_by: string;
          clinic_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          category: SourceCategory;
          managed_by?: string;
          clinic_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          category?: SourceCategory;
          managed_by?: string;
          clinic_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_sources_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      patients: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          cpf: string | null;
          phone: string | null;
          phone_normalized: string | null;
          email: string | null;
          birth_date: string | null;
          status: PatientStatus;
          notes: string | null;
          codefy_id: string | null;
          external_ref: string | null;
          source_system: string;
          synced_at: string | null;
          reconciliation_status: ReconciliationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          cpf?: string | null;
          phone?: string | null;
          phone_normalized?: string | null;
          email?: string | null;
          birth_date?: string | null;
          status?: PatientStatus;
          notes?: string | null;
          codefy_id?: string | null;
          external_ref?: string | null;
          source_system?: string;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          full_name?: string;
          cpf?: string | null;
          phone?: string | null;
          phone_normalized?: string | null;
          email?: string | null;
          birth_date?: string | null;
          status?: PatientStatus;
          notes?: string | null;
          codefy_id?: string | null;
          external_ref?: string | null;
          source_system?: string;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      leads: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          source_id: string | null;
          owner_id: string | null;
          current_stage: LeadStage;
          lost_at: string | null;
          lost_reason: string | null;
          lost_by: string | null;
          last_contact_at: string | null;
          last_activity_at: string | null;
          source_system: string;
          external_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          source_id?: string | null;
          owner_id?: string | null;
          current_stage?: LeadStage;
          lost_at?: string | null;
          lost_reason?: string | null;
          lost_by?: string | null;
          last_contact_at?: string | null;
          last_activity_at?: string | null;
          source_system?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          source_id?: string | null;
          owner_id?: string | null;
          current_stage?: LeadStage;
          lost_at?: string | null;
          lost_reason?: string | null;
          lost_by?: string | null;
          last_contact_at?: string | null;
          last_activity_at?: string | null;
          source_system?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_clinic_fk";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_patient_clinic_fk";
            columns: ["patient_id", "clinic_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id", "clinic_id"];
          },
          {
            foreignKeyName: "leads_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "lead_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_lost_by_fkey";
            columns: ["lost_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      lead_activities: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          lead_id: string;
          activity_type: ActivityType;
          occurred_at: string;
          performed_by: string;
          summary: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          lead_id: string;
          activity_type: ActivityType;
          occurred_at?: string;
          performed_by: string;
          summary?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          lead_id?: string;
          activity_type?: ActivityType;
          occurred_at?: string;
          performed_by?: string;
          summary?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_patient_fk";
            columns: ["lead_id", "patient_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "patient_id"];
          },
          {
            foreignKeyName: "lead_activities_patient_clinic_fk";
            columns: ["patient_id", "clinic_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id", "clinic_id"];
          },
          {
            foreignKeyName: "lead_activities_clinic_fk";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activities_performed_by_fk";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          lead_id: string | null;
          status: AppointmentStatus;
          scheduled_at: string;
          confirmed_at: string | null;
          attended_at: string | null;
          no_show_at: string | null;
          cancelled_at: string | null;
          rescheduled_from: string | null;
          professional_name: string | null;
          procedure_name: string | null;
          codefy_id: string | null;
          source_system: string;
          external_ref: string | null;
          synced_at: string | null;
          reconciliation_status: ReconciliationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          lead_id?: string | null;
          status?: AppointmentStatus;
          scheduled_at: string;
          confirmed_at?: string | null;
          attended_at?: string | null;
          no_show_at?: string | null;
          cancelled_at?: string | null;
          rescheduled_from?: string | null;
          professional_name?: string | null;
          procedure_name?: string | null;
          codefy_id?: string | null;
          source_system?: string;
          external_ref?: string | null;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          lead_id?: string | null;
          status?: AppointmentStatus;
          scheduled_at?: string;
          confirmed_at?: string | null;
          attended_at?: string | null;
          no_show_at?: string | null;
          cancelled_at?: string | null;
          rescheduled_from?: string | null;
          professional_name?: string | null;
          procedure_name?: string | null;
          codefy_id?: string | null;
          source_system?: string;
          external_ref?: string | null;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_fk";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_clinic_fk";
            columns: ["patient_id", "clinic_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id", "clinic_id"];
          },
          {
            foreignKeyName: "appointments_lead_patient_fk";
            columns: ["lead_id", "patient_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "patient_id"];
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fk";
            columns: ["rescheduled_from"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };

      budgets: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          lead_id: string | null;
          status: BudgetStatus;
          total_amount: number | null;
          currency: string;
          presented_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          expired_at: string | null;
          cancelled_at: string | null;
          valid_until: string | null;
          description: string | null;
          codefy_id: string | null;
          source_system: string;
          external_ref: string | null;
          synced_at: string | null;
          reconciliation_status: ReconciliationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          lead_id?: string | null;
          status?: BudgetStatus;
          total_amount?: number | null;
          currency?: string;
          presented_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          expired_at?: string | null;
          cancelled_at?: string | null;
          valid_until?: string | null;
          description?: string | null;
          codefy_id?: string | null;
          source_system?: string;
          external_ref?: string | null;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          lead_id?: string | null;
          status?: BudgetStatus;
          total_amount?: number | null;
          currency?: string;
          presented_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          expired_at?: string | null;
          cancelled_at?: string | null;
          valid_until?: string | null;
          description?: string | null;
          codefy_id?: string | null;
          source_system?: string;
          external_ref?: string | null;
          synced_at?: string | null;
          reconciliation_status?: ReconciliationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_clinic_fk";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_patient_clinic_fk";
            columns: ["patient_id", "clinic_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id", "clinic_id"];
          },
          {
            foreignKeyName: "budgets_lead_patient_fk";
            columns: ["lead_id", "patient_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "patient_id"];
          },
        ];
      };

      lead_stage_history: {
        Row: {
          id: string;
          clinic_id: string;
          lead_id: string;
          patient_id: string;
          from_stage: LeadStage | null;
          to_stage: LeadStage;
          reason: string | null;
          source_table: string | null;
          source_id: string | null;
          changed_at: string;
          changed_by: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          lead_id: string;
          patient_id: string;
          from_stage?: LeadStage | null;
          to_stage: LeadStage;
          reason?: string | null;
          source_table?: string | null;
          source_id?: string | null;
          changed_at?: string;
          changed_by?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          lead_id?: string;
          patient_id?: string;
          from_stage?: LeadStage | null;
          to_stage?: LeadStage;
          reason?: string | null;
          source_table?: string | null;
          source_id?: string | null;
          changed_at?: string;
          changed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_stage_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      crm_role: CrmRole;
      patient_status: PatientStatus;
      lead_stage: LeadStage;
      appointment_status: AppointmentStatus;
      budget_status: BudgetStatus;
      activity_type: ActivityType;
      source_category: SourceCategory;
      reconciliation_status: ReconciliationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/* ----------------------------- Helpers exportados ------------------------- */
type CrmSchema = CrmDatabase["crm"];

export type CrmTables<T extends keyof CrmSchema["Tables"]> =
  CrmSchema["Tables"][T]["Row"];

export type CrmTablesInsert<T extends keyof CrmSchema["Tables"]> =
  CrmSchema["Tables"][T]["Insert"];

export type CrmTablesUpdate<T extends keyof CrmSchema["Tables"]> =
  CrmSchema["Tables"][T]["Update"];

export type CrmEnums<T extends keyof CrmSchema["Enums"]> =
  CrmSchema["Enums"][T];
