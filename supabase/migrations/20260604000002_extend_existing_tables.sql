-- Etapa 1.2 — Extensão das tabelas existentes
-- Adiciona campos necessários para integrações futuras e corrige RLS para auth real.

-- ─── Função auxiliar de acesso por clínica ───────────────────────────────────
-- Usada em todas as políticas RLS das tabelas de dados.
-- Admin e gestor veem tudo; operador vê apenas clínicas atribuídas.

CREATE OR REPLACE FUNCTION fn_user_can_access_clinic(p_clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hub_users u
    WHERE u.id = auth.uid()
      AND u.active = true
      AND (
        u.role IN ('admin', 'gestor')
        OR EXISTS (
          SELECT 1 FROM public.clinic_assignments ca
          WHERE ca.user_id = auth.uid()
            AND ca.clinic_id = p_clinic_id
        )
      )
  )
$$;

-- ─── Extensão: clinics ───────────────────────────────────────────────────────

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS external_id  TEXT UNIQUE,     -- ID na plataforma de disparo
  ADD COLUMN IF NOT EXISTS plan         TEXT DEFAULT 'crm', -- crm | trafego | completo
  ADD COLUMN IF NOT EXISTS notes        TEXT,
  ADD COLUMN IF NOT EXISTS cnpj         TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT;             -- telefone principal

-- RLS: substituir "public read" por controle real
DROP POLICY IF EXISTS "public read" ON public.clinics;

CREATE POLICY "authenticated users see their clinics" ON public.clinics
  FOR SELECT USING (fn_user_can_access_clinic(id));

CREATE POLICY "gestores insert clinics" ON public.clinics
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

CREATE POLICY "gestores update clinics" ON public.clinics
  FOR UPDATE USING (
    (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

-- ─── Extensão: channels ──────────────────────────────────────────────────────

ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS external_id        TEXT,        -- ID na plataforma de atendimento
  ADD COLUMN IF NOT EXISTS platform_name      TEXT,        -- ex: "Evolution API", "Typebot"
  ADD COLUMN IF NOT EXISTS waba_id            TEXT,        -- WhatsApp Business Account ID
  ADD COLUMN IF NOT EXISTS phone_number_id    TEXT,        -- ID do número na Meta API
  ADD COLUMN IF NOT EXISTS access_token_hint  TEXT,        -- últimos 4 chars do token (não o token)
  ADD COLUMN IF NOT EXISTS chip_iccid         TEXT,        -- identificador único do chip físico
  ADD COLUMN IF NOT EXISTS purchase_date      DATE,        -- data de compra do chip
  ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ, -- quando o status mudou pela última vez
  ADD COLUMN IF NOT EXISTS deactivated_at     TIMESTAMPTZ; -- soft delete de canal

DROP POLICY IF EXISTS "public read" ON public.channels;

CREATE POLICY "authenticated users see their channels" ON public.channels
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));

CREATE POLICY "gestores insert channels" ON public.channels
  FOR INSERT WITH CHECK (
    fn_user_can_access_clinic(clinic_id)
    AND (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

CREATE POLICY "gestores update channels" ON public.channels
  FOR UPDATE USING (
    fn_user_can_access_clinic(clinic_id)
    AND (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

-- ─── Extensão: channel_monitoring ────────────────────────────────────────────

ALTER TABLE public.channel_monitoring
  ADD COLUMN IF NOT EXISTS is_latest    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS collector    TEXT,    -- 'meta_api' | 'plataforma' | 'robo_tela' | 'manual'
  ADD COLUMN IF NOT EXISTS raw_payload  JSONB;   -- payload bruto da fonte para debug

-- Trigger: ao inserir novo registro, marca o anterior como is_latest = false
CREATE OR REPLACE FUNCTION fn_channel_monitoring_set_latest()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.channel_monitoring
  SET is_latest = false
  WHERE channel_id = NEW.channel_id
    AND id != NEW.id
    AND is_latest = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_channel_monitoring_latest
  AFTER INSERT ON public.channel_monitoring
  FOR EACH ROW EXECUTE FUNCTION fn_channel_monitoring_set_latest();

DROP POLICY IF EXISTS "public read" ON public.channel_monitoring;

CREATE POLICY "authenticated users see monitoring" ON public.channel_monitoring
  FOR SELECT USING (
    fn_user_can_access_clinic(
      (SELECT clinic_id FROM public.channels WHERE id = channel_id)
    )
  );

-- ─── Extensão: contingency_items ─────────────────────────────────────────────

DROP POLICY IF EXISTS "public read" ON public.contingency_items;

CREATE POLICY "authenticated users see contingency" ON public.contingency_items
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));

-- Operadores podem editar contingência das suas clínicas
CREATE POLICY "operadores update contingency" ON public.contingency_items
  FOR UPDATE USING (fn_user_can_access_clinic(clinic_id));

CREATE POLICY "gestores insert contingency" ON public.contingency_items
  FOR INSERT WITH CHECK (fn_user_can_access_clinic(clinic_id));

-- ─── Extensão: alerts ────────────────────────────────────────────────────────

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS alert_source     TEXT DEFAULT 'manual', -- 'manual'|'meta_api'|'robot'|'agent_ia'
  ADD COLUMN IF NOT EXISTS auto_generated   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_by  UUID REFERENCES public.hub_users(id),
  ADD COLUMN IF NOT EXISTS acknowledged_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to     UUID REFERENCES public.hub_users(id),
  ADD COLUMN IF NOT EXISTS escalated_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

DROP POLICY IF EXISTS "public read" ON public.alerts;

CREATE POLICY "authenticated users see alerts" ON public.alerts
  FOR SELECT USING (fn_user_can_access_clinic(clinic_id));

-- Qualquer usuário com acesso à clínica pode atualizar alertas
CREATE POLICY "users update alerts" ON public.alerts
  FOR UPDATE USING (fn_user_can_access_clinic(clinic_id));

CREATE POLICY "gestores insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (fn_user_can_access_clinic(clinic_id));

-- ─── Extensão: audit_logs ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public read" ON public.audit_logs;

-- Apenas admin e gestor veem audit_logs
CREATE POLICY "gestores see audit logs" ON public.audit_logs
  FOR SELECT USING (
    (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );
