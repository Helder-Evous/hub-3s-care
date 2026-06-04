import type { ProductType } from './types';

interface StepTemplate {
  step_key: string;
  title: string;
  description?: string;
  sla_hours: number;
  order_index: number;
}

export const onboardingTemplates: Record<ProductType, StepTemplate[]> = {
  crm: [
    { order_index: 1, step_key: 'coleta_dados', title: 'Coleta de dados da clínica', description: 'Coletar CNPJ, razão social, endereço e dados de contato', sla_hours: 48 },
    { order_index: 2, step_key: 'cadastro_completo', title: 'Cadastro mestre completo', description: 'Validar e completar todos os dados da clínica no sistema', sla_hours: 24 },
    { order_index: 3, step_key: 'assinatura_contrato', title: 'Assinatura do contrato', description: 'Contrato enviado e aguardando assinatura do cliente', sla_hours: 48 },
    { order_index: 4, step_key: 'setup_financeiro', title: 'Setup financeiro confirmado', description: 'Cobranças configuradas e confirmadas internamente', sla_hours: 24 },
    { order_index: 5, step_key: 'criar_canal', title: 'Criação do canal WhatsApp', description: 'Configurar número principal de disparo da clínica', sla_hours: 24 },
    { order_index: 6, step_key: 'api_meta', title: 'Configuração API Oficial Meta', description: 'Conectar número à API Oficial e verificar qualidade', sla_hours: 72 },
    { order_index: 7, step_key: 'importar_base', title: 'Importação da base de pacientes', description: 'Importar e validar base de contatos da clínica', sla_hours: 48 },
    { order_index: 8, step_key: 'templates_aprovados', title: 'Templates Meta aprovados', description: 'Criar e aprovar templates de disparo na Meta', sla_hours: 120 },
    { order_index: 9, step_key: 'disparo_teste', title: 'Disparo de teste validado', description: 'Executar disparo teste e validar entrega', sla_hours: 24 },
    { order_index: 10, step_key: 'treinamento', title: 'Treinamento da equipe', description: 'Treinar equipe da clínica no uso do sistema', sla_hours: 48 },
  ],
  trafego_pago: [
    { order_index: 1, step_key: 'coleta_dados', title: 'Coleta de dados + acesso ao BM', description: 'Coletar dados e obter acesso ao Business Manager', sla_hours: 24 },
    { order_index: 2, step_key: 'briefing', title: 'Briefing da clínica', description: 'Levantamento de público, diferenciais e objetivos', sla_hours: 48 },
    { order_index: 3, step_key: 'assinatura_contrato', title: 'Assinatura do contrato', sla_hours: 48 },
    { order_index: 4, step_key: 'setup_financeiro', title: 'Setup financeiro confirmado', sla_hours: 24 },
    { order_index: 5, step_key: 'criar_campanhas', title: 'Criação das campanhas', description: 'Criar campanhas iniciais no Meta Ads / Google Ads', sla_hours: 120 },
    { order_index: 6, step_key: 'aprovacao_cliente', title: 'Aprovação do cliente', description: 'Cliente revisa e aprova criativos e segmentação', sla_hours: 48 },
  ],
  trafego_com_agendamento: [
    { order_index: 1, step_key: 'coleta_dados', title: 'Coleta de dados + acesso ao BM', sla_hours: 24 },
    { order_index: 2, step_key: 'briefing', title: 'Briefing da clínica', sla_hours: 48 },
    { order_index: 3, step_key: 'assinatura_contrato', title: 'Assinatura do contrato', sla_hours: 48 },
    { order_index: 4, step_key: 'setup_financeiro', title: 'Setup financeiro confirmado', sla_hours: 24 },
    { order_index: 5, step_key: 'criar_campanhas', title: 'Criação das campanhas', sla_hours: 120 },
    { order_index: 6, step_key: 'aprovacao_cliente', title: 'Aprovação do cliente', sla_hours: 48 },
    { order_index: 7, step_key: 'canal_atendimento', title: 'Canal de atendimento configurado', description: 'Configurar canal WhatsApp para atendimento dos leads', sla_hours: 24 },
    { order_index: 8, step_key: 'script_aprovado', title: 'Script de atendimento aprovado', description: 'Script de atendimento criado e aprovado pela clínica', sla_hours: 48 },
    { order_index: 9, step_key: 'integracao_agenda', title: 'Integração com agenda da clínica', sla_hours: 72 },
  ],
  gestao_consultoria: [
    { order_index: 1, step_key: 'coleta_dados', title: 'Coleta de dados da clínica', sla_hours: 24 },
    { order_index: 2, step_key: 'assinatura_contrato', title: 'Assinatura do contrato', sla_hours: 48 },
    { order_index: 3, step_key: 'setup_financeiro', title: 'Setup financeiro confirmado', sla_hours: 24 },
    { order_index: 4, step_key: 'diagnostico_agendado', title: 'Diagnóstico inicial agendado', sla_hours: 48 },
    { order_index: 5, step_key: 'kickoff', title: 'Reunião de kickoff realizada', sla_hours: 120 },
    { order_index: 6, step_key: 'plano_acao', title: 'Plano de ação entregue', sla_hours: 120 },
  ],
  projeto_escola: [
    { order_index: 1, step_key: 'coleta_dados', title: 'Coleta de dados + cidade de atuação', sla_hours: 24 },
    { order_index: 2, step_key: 'assinatura_contrato', title: 'Assinatura do contrato', sla_hours: 48 },
    { order_index: 3, step_key: 'representante', title: 'Representante designado', sla_hours: 24 },
    { order_index: 4, step_key: 'escolas_mapeadas', title: 'Escolas mapeadas', description: 'Mapear escolas na cidade de atuação', sla_hours: 120 },
    { order_index: 5, step_key: 'primeira_visita', title: 'Primeira visita realizada', sla_hours: 168 },
  ],
};
