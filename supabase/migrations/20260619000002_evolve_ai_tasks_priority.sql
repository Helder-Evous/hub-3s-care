-- ─────────────────────────────────────────────────────────────────
-- Evolução ai_tasks: priorização inteligente da IA
-- priority_score = impact_level × urgency_level
-- confidence_score nullable (não inventar confiança fictícia sem IA real)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.ai_tasks
  ADD COLUMN IF NOT EXISTS impact_level      integer,
  ADD COLUMN IF NOT EXISTS urgency_level     integer,
  ADD COLUMN IF NOT EXISTS priority_score    integer,
  ADD COLUMN IF NOT EXISTS confidence_score  numeric,
  ADD COLUMN IF NOT EXISTS source_event_type text,
  ADD COLUMN IF NOT EXISTS requires_human    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_action       text;

-- guarda-corpos de domínio (1..5) — toleram NULL para linhas antigas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ai_tasks_impact_range') THEN
    ALTER TABLE public.ai_tasks
      ADD CONSTRAINT ai_tasks_impact_range
      CHECK (impact_level IS NULL OR impact_level BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ai_tasks_urgency_range') THEN
    ALTER TABLE public.ai_tasks
      ADD CONSTRAINT ai_tasks_urgency_range
      CHECK (urgency_level IS NULL OR urgency_level BETWEEN 1 AND 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_tasks_priority_score
  ON public.ai_tasks (priority_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_requires_human
  ON public.ai_tasks (requires_human);
