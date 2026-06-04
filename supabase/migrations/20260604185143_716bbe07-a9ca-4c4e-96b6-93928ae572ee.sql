
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text;

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product text NOT NULL,
  value_monthly numeric,
  value_setup numeric DEFAULT 0,
  contract_months integer NOT NULL DEFAULT 12,
  sold_by text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  origin text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clinic_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  product text NOT NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, product)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_products TO authenticated;
GRANT ALL ON public.clinic_products TO service_role;
ALTER TABLE public.clinic_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage clinic_products" ON public.clinic_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  product text NOT NULL,
  status text NOT NULL DEFAULT 'em_execucao',
  sla_deadline timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboardings TO authenticated;
GRANT ALL ON public.onboardings TO service_role;
ALTER TABLE public.onboardings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage onboardings" ON public.onboardings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid NOT NULL REFERENCES public.onboardings(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pendente',
  order_index integer NOT NULL,
  sla_hours integer,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_steps TO authenticated;
GRANT ALL ON public.onboarding_steps TO service_role;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage onboarding_steps" ON public.onboarding_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
