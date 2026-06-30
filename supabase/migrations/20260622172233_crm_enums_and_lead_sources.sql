-- ============================================================================
-- Migration 002 — Controle de Lead: enums e catalogo de origens (lead_sources)
-- ----------------------------------------------------------------------------
-- Objetivo : criar os enums de contrato do modulo e o catalogo crm.lead_sources
--            (com seed das origens canonicas). Sem tabelas de dominio, sem
--            triggers, sem funcoes, sem system_events/ai_tasks.
-- Depende  : Migration 001 (schema crm + grants de USAGE).
-- Projeto  : nndvcsdevbxpgsccyimm (Postgres 17)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ENUMS DE CONTRATO
--    Guardados com DO/exception para idempotencia (CREATE TYPE nao aceita
--    IF NOT EXISTS).
-- ----------------------------------------------------------------------------

-- Papel do usuario no modulo (base da RLS). Conjunto fechado.
do $$ begin
  create type crm.crm_role as enum
    ('super_admin_3s', 'gestor_3s', 'cliente', 'gestor_unidade', 'crc');
exception when duplicate_object then null; end $$;

-- Ciclo de vida da pessoa (identidade).
do $$ begin
  create type crm.patient_status as enum
    ('prospecto', 'ativo', 'inativo', 'descartado');
exception when duplicate_object then null; end $$;

-- Estagio macro do funil. A ORDEM dos valores reflete a progressao do funil
-- e e usada na regra de derivacao (maior estagio alcancado). 'perdido' e
-- tratado como override terminal no codigo.
do $$ begin
  create type crm.lead_stage as enum
    ('novo', 'agendado', 'compareceu', 'em_avaliacao',
     'orcamento', 'efetivado', 'pos_venda', 'perdido');
exception when duplicate_object then null; end $$;

-- Estado do agendamento.
do $$ begin
  create type crm.appointment_status as enum
    ('agendado', 'confirmado', 'remarcado', 'compareceu', 'faltou', 'cancelado');
exception when duplicate_object then null; end $$;

-- Estado do orcamento. 'rascunho' nao conta como emitido; 'emitido' dispara o
-- stage 'orcamento' (logica aplicada em migration futura de triggers).
do $$ begin
  create type crm.budget_status as enum
    ('rascunho', 'emitido', 'aceito', 'rejeitado', 'expirado', 'cancelado');
exception when duplicate_object then null; end $$;

-- Tipo de toque do CRC (timeline operacional).
do $$ begin
  create type crm.activity_type as enum
    ('ligacao', 'whatsapp', 'nota', 'visita', 'email', 'outro');
exception when duplicate_object then null; end $$;

-- Categoria que agrupa as origens de lead.
do $$ begin
  create type crm.source_category as enum
    ('paga', 'organica', 'interna', 'importacao', 'sistema');
exception when duplicate_object then null; end $$;

-- Estado de conciliacao com sistema externo (Codefy). Seam ja previsto.
do $$ begin
  create type crm.reconciliation_status as enum
    ('nao_aplicavel', 'pendente', 'conciliado', 'divergente', 'ignorado');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2) CATALOGO DE ORIGENS — crm.lead_sources
--    Unicidade de `key`:
--      - origens 'system' : key UNICO GLOBAL
--      - origens 'clinic' : key UNICO POR clinic_id
--    (implementado via dois indices unicos PARCIAIS abaixo).
-- ----------------------------------------------------------------------------
create table if not exists crm.lead_sources (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,                                  -- chave estavel (maquina)
  label       text not null,                                  -- rotulo exibido ao usuario
  category    crm.source_category not null,                   -- paga/organica/interna/...
  managed_by  text not null default 'system',                 -- 'system' | 'clinic'
  clinic_id   uuid references public.clinics (id) on delete cascade,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint lead_sources_managed_by_chk
    check (managed_by in ('system', 'clinic')),
  -- Coerencia: origem 'system' e global (sem clinica); 'clinic' pertence a uma.
  constraint lead_sources_scope_chk check (
    (managed_by = 'system' and clinic_id is null) or
    (managed_by = 'clinic'  and clinic_id is not null)
  )
);

-- Unicidade diferenciada por tipo de gestao (indices parciais):
-- origens canonicas/system: key unico em todo o catalogo.
create unique index if not exists lead_sources_system_key_uq
  on crm.lead_sources (key)
  where managed_by = 'system';

-- origens proprias de clinica: key unico apenas dentro da mesma clinica
-- (permite Clinica A e Clinica B usarem a mesma key, ex.: 'feirao_julho').
create unique index if not exists lead_sources_clinic_key_uq
  on crm.lead_sources (clinic_id, key)
  where managed_by = 'clinic';

comment on table crm.lead_sources is
  'Catalogo de origens de lead (atribuicao de funil). Origens canonicas sao '
  'system-managed e globais (key unico global); clinicas poderao cadastrar '
  'origens proprias (key unico por clinic_id).';
comment on column crm.lead_sources.key is
  'Chave estavel imutavel usada em integracoes e KPIs. Nao reaproveitar. '
  'Unica globalmente para system; unica por clinic_id para clinic.';
comment on column crm.lead_sources.managed_by is
  'system = canonica/global (nao editavel pela clinica); clinic = criada pela clinica.';

-- ----------------------------------------------------------------------------
-- 3) SEED DAS ORIGENS CANONICAS (idempotente; arbiter = indice parcial system)
-- ----------------------------------------------------------------------------
insert into crm.lead_sources (key, label, category, managed_by) values
  ('meta_ads',            'Meta (Ads)',         'paga',       'system'),
  ('google_ads',          'Google (Ads)',       'paga',       'system'),
  ('indicacao',           'Indicação',          'organica',   'system'),
  ('projeto_escola',      'Projeto Escola',     'interna',    'system'),
  ('whatsapp_organico',   'WhatsApp Orgânico',  'organica',   'system'),
  ('instagram_organico',  'Instagram Orgânico', 'organica',   'system'),
  ('facebook_organico',   'Facebook Orgânico',  'organica',   'system'),
  ('site',                'Site',               'organica',   'system'),
  ('reativacao',          'Reativação',         'sistema',    'system'),
  ('importacao',          'Importação',         'importacao', 'system'),
  ('outros',              'Outros',             'organica',   'system')
on conflict (key) where managed_by = 'system' do nothing;

-- ----------------------------------------------------------------------------
-- 4) GRANTS MINIMOS (catalogo: leitura para autenticado; escrita so service_role
--    por enquanto — politicas de escrita por papel virao na migration de RLS,
--    quando os helpers SECURITY DEFINER existirem).
-- ----------------------------------------------------------------------------
grant select on crm.lead_sources to authenticated;
grant all    on crm.lead_sources to service_role;

-- ----------------------------------------------------------------------------
-- 5) RLS DO CATALOGO (leitura controlada, sem dependencia de helpers)
--    Habilitar RLS ja agora evita janela de exposicao. Politica de SELECT
--    limitada as origens 'system' (globais); origens clinic-managed (futuras)
--    terao politica com escopo por clinica na migration de RLS (helpers).
-- ----------------------------------------------------------------------------
alter table crm.lead_sources enable row level security;

drop policy if exists lead_sources_select_system on crm.lead_sources;
create policy lead_sources_select_system
  on crm.lead_sources
  for select
  to authenticated
  using (managed_by = 'system');
-- ============================================================================
