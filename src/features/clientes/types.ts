export type ProductType =
  | 'crm'
  | 'trafego_pago'
  | 'trafego_com_agendamento'
  | 'gestao_consultoria'
  | 'projeto_escola';

export const productLabel: Record<ProductType, string> = {
  crm: 'Produto CRM',
  trafego_pago: 'Tráfego Pago',
  trafego_com_agendamento: 'Tráfego + Agendamento',
  gestao_consultoria: 'Gestão / Consultoria',
  projeto_escola: 'Projeto Escola',
};

export type ClienteStatus = 'ativo' | 'onboarding' | 'inativo' | 'suspenso';

export interface Cliente {
  id: string;
  name: string;
  nome_fantasia?: string;
  razao_social?: string;
  cnpj?: string;
  responsible: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  status: ClienteStatus;
  products: ProductType[];
  created_at: string;
}

export interface Sale {
  id: string;
  clinic_id: string;
  product: ProductType;
  value_monthly?: number;
  value_setup?: number;
  contract_months?: number;
  sold_by?: string;
  sold_at: string;
  origin: string;
  notes?: string;
}

export type OnboardingStatus =
  | 'aguardando_dados'
  | 'em_execucao'
  | 'pausado'
  | 'concluido'
  | 'cancelado';

export type StepStatus = 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado' | 'pulado';

export interface OnboardingStep {
  id: string;
  step_key: string;
  title: string;
  description?: string;
  status: StepStatus;
  order_index: number;
  sla_hours?: number;
  due_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface Onboarding {
  id: string;
  clinic_id: string;
  clinic_name: string;
  product: ProductType;
  status: OnboardingStatus;
  sla_deadline?: string;
  completed_at?: string;
  steps: OnboardingStep[];
  created_at: string;
}
