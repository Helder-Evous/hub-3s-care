-- Etapa 1.4 — Índices de performance
-- Garante que as queries mais comuns sejam rápidas mesmo com grande volume de dados.

-- ─── clinics ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clinics_status
  ON public.clinics(status);

CREATE INDEX IF NOT EXISTS idx_clinics_external_id
  ON public.clinics(external_id)
  WHERE external_id IS NOT NULL;

-- ─── channels ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_channels_clinic_id
  ON public.channels(clinic_id);

CREATE INDEX IF NOT EXISTS idx_channels_status
  ON public.channels(status);

CREATE INDEX IF NOT EXISTS idx_channels_type
  ON public.channels(channel_type);

-- Query mais comum: canais ativos de uma clínica
CREATE INDEX IF NOT EXISTS idx_channels_clinic_active
  ON public.channels(clinic_id, status)
  WHERE deactivated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_channels_phone_number_id
  ON public.channels(phone_number_id)
  WHERE phone_number_id IS NOT NULL;

-- ─── channel_monitoring ──────────────────────────────────────────────────────
-- Query mais crítica: status atual de um canal (is_latest = true)
CREATE INDEX IF NOT EXISTS idx_monitoring_latest
  ON public.channel_monitoring(channel_id, is_latest)
  WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_monitoring_last_check
  ON public.channel_monitoring(last_check DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_channel_id
  ON public.channel_monitoring(channel_id);

-- ─── contingency_items ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contingency_clinic_id
  ON public.contingency_items(clinic_id);

-- ─── alerts ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_alerts_clinic_id
  ON public.alerts(clinic_id);

CREATE INDEX IF NOT EXISTS idx_alerts_channel_id
  ON public.alerts(channel_id)
  WHERE channel_id IS NOT NULL;

-- Query mais comum: alertas abertos por clínica ordenados por severidade
CREATE INDEX IF NOT EXISTS idx_alerts_open_by_clinic
  ON public.alerts(clinic_id, severity, created_at DESC)
  WHERE status != 'resolvido';

CREATE INDEX IF NOT EXISTS idx_alerts_created_at
  ON public.alerts(created_at DESC);

-- ─── meta_templates ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meta_templates_clinic_id
  ON public.meta_templates(clinic_id);

CREATE INDEX IF NOT EXISTS idx_meta_templates_channel_id
  ON public.meta_templates(channel_id);

CREATE INDEX IF NOT EXISTS idx_meta_templates_status
  ON public.meta_templates(status);

-- ─── meta_template_metrics ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_template_metrics_template_date
  ON public.meta_template_metrics(template_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_template_metrics_clinic_date
  ON public.meta_template_metrics(clinic_id, metric_date DESC);

-- ─── api_volume_snapshots ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_volume_channel_date
  ON public.api_volume_snapshots(channel_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_volume_clinic_date
  ON public.api_volume_snapshots(clinic_id, snapshot_date DESC);

-- ─── clinic_assignments ──────────────────────────────────────────────────────
-- Já criados na migration 000001, mas registramos aqui para documentação completa.
-- idx_clinic_assignments_user e idx_clinic_assignments_clinic já existem.

-- ─── audit_logs ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs(actor)
  WHERE actor IS NOT NULL;
