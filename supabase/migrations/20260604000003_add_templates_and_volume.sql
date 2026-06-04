-- Etapa 1.3 — Tabelas de Templates Meta e Volume da API Oficial
-- Essas entidades já existem no mock-data mas ainda não tinham tabelas no banco.

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE public.template_category AS ENUM (
  'utility', 'marketing', 'authentication'
);

CREATE TYPE public.template_status AS ENUM (
  'aprovado', 'pendente', 'reprovado', 'pausado', 'desativado', 'em_revisao'
);

-- ─── Templates Meta ───────────────────────────────────────────────────────────
-- Metadados de cada template aprovado (ou não) pela Meta para um número API Oficial.

CREATE TABLE public.meta_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  clinic_id           UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  category            public.template_category NOT NULL,
  previous_category   public.template_category,       -- detectar mudança indesejada de categoria
  status              public.template_status NOT NULL DEFAULT 'pendente',
  language            TEXT NOT NULL DEFAULT 'pt_BR',
  header_type         TEXT,                           -- TEXT | IMAGE | DOCUMENT | VIDEO
  body_text           TEXT,
  footer_text         TEXT,
  meta_template_id    TEXT UNIQUE,                    -- ID na Meta API (para sincronização)
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, name)
);

-- ─── Métricas de volume de templates (série temporal por dia) ─────────────────

CREATE TABLE public.meta_template_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES public.meta_templates(id) ON DELETE CASCADE,
  clinic_id     UUID NOT NULL REFERENCES public.clinics(id),
  metric_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  sent          INT NOT NULL DEFAULT 0,
  delivered     INT NOT NULL DEFAULT 0,
  read          INT NOT NULL DEFAULT 0,
  failed        INT NOT NULL DEFAULT 0,
  cost_brl      NUMERIC(10,4) NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, metric_date)
);

-- ─── Volume da API Oficial (snapshots diários por canal) ─────────────────────
-- Um registro por canal por dia. Aggregado das mensagens enviadas/recebidas.

CREATE TABLE public.api_volume_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  clinic_id         UUID NOT NULL REFERENCES public.clinics(id),
  snapshot_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  period            TEXT NOT NULL DEFAULT 'daily',    -- daily | hourly (futuro)
  sent              INT NOT NULL DEFAULT 0,
  delivered         INT NOT NULL DEFAULT 0,
  read              INT NOT NULL DEFAULT 0,
  received          INT NOT NULL DEFAULT 0,
  failed            INT NOT NULL DEFAULT 0,
  cost_brl          NUMERIC(10,2) NOT NULL DEFAULT 0,
  exchange_rate     NUMERIC(8,4),                     -- USD/BRL no momento da coleta
  source            TEXT NOT NULL DEFAULT 'meta_api', -- quem inseriu o registro
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, snapshot_date, period)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.meta_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_template_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_volume_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their templates" ON public.meta_templates
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));

CREATE POLICY "gestores manage templates" ON public.meta_templates
  FOR ALL USING (
    fn_user_can_access_clinic(clinic_id)
    AND (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

CREATE POLICY "users see template metrics" ON public.meta_template_metrics
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));

CREATE POLICY "users see volume snapshots" ON public.api_volume_snapshots
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));
