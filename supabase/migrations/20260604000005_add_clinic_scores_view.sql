-- Etapa 1.5 — View de scores por clínica
-- Calcula contingência, comunicabilidade e saúde diretamente no banco.
-- Evita recalcular no frontend a cada render.

CREATE OR REPLACE VIEW public.vw_clinic_scores AS
SELECT
  c.id,
  c.name,
  c.city,
  c.state,
  c.responsible,
  c.status,

  -- Score de contingência (5 itens × 20pts)
  COALESCE(
    (CASE WHEN ci.has_backup_number    THEN 20 ELSE 0 END) +
    (CASE WHEN ci.has_backup_api       THEN 20 ELSE 0 END) +
    (CASE WHEN ci.has_approved_template THEN 20 ELSE 0 END) +
    (CASE WHEN ci.has_backup_chip      THEN 20 ELSE 0 END) +
    (CASE WHEN ci.has_backup_device    THEN 20 ELSE 0 END),
    0
  ) AS contingency_score,

  -- Classificação da contingência
  CASE
    WHEN COALESCE(
      (CASE WHEN ci.has_backup_number    THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_api       THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_approved_template THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_chip      THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_device    THEN 20 ELSE 0 END), 0
    ) >= 80 THEN 'blindada'
    WHEN COALESCE(
      (CASE WHEN ci.has_backup_number    THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_api       THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_approved_template THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_chip      THEN 20 ELSE 0 END) +
      (CASE WHEN ci.has_backup_device    THEN 20 ELSE 0 END), 0
    ) >= 50 THEN 'risco_moderado'
    ELSE 'alto_risco'
  END AS contingency_class,

  -- Status de saúde baseado nos canais
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.channels ch
      WHERE ch.clinic_id = c.id
        AND ch.status IN ('critico', 'bloqueado', 'desconectado')
        AND ch.deactivated_at IS NULL
    ) THEN 'critico'
    WHEN EXISTS (
      SELECT 1 FROM public.channels ch
      WHERE ch.clinic_id = c.id
        AND ch.status = 'em_atencao'
        AND ch.deactivated_at IS NULL
    ) THEN 'atencao'
    ELSE 'normal'
  END AS health_status,

  -- Contagem de canais ativos
  (
    SELECT COUNT(*) FROM public.channels ch
    WHERE ch.clinic_id = c.id
      AND ch.deactivated_at IS NULL
  ) AS active_channels_count,

  -- Alertas abertos
  (
    SELECT COUNT(*) FROM public.alerts a
    WHERE a.clinic_id = c.id
      AND a.status != 'resolvido'
  ) AS open_alerts_count,

  -- Alertas críticos abertos
  (
    SELECT COUNT(*) FROM public.alerts a
    WHERE a.clinic_id = c.id
      AND a.status != 'resolvido'
      AND a.severity = 'critica'
  ) AS critical_alerts_count

FROM public.clinics c
LEFT JOIN public.contingency_items ci ON ci.clinic_id = c.id;

-- Permissão de leitura na view para usuários autenticados
-- (a RLS das tabelas base já garante que só veem o que têm acesso)
GRANT SELECT ON public.vw_clinic_scores TO authenticated;
