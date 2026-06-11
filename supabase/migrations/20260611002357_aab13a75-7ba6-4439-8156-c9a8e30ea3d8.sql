
DROP POLICY IF EXISTS "authenticated manage sales" ON public.sales;
CREATE POLICY "authenticated manage sales" ON public.sales FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authenticated manage clinic_products" ON public.clinic_products;
CREATE POLICY "authenticated manage clinic_products" ON public.clinic_products FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authenticated manage onboardings" ON public.onboardings;
CREATE POLICY "authenticated manage onboardings" ON public.onboardings FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authenticated manage onboarding_steps" ON public.onboarding_steps;
CREATE POLICY "authenticated manage onboarding_steps" ON public.onboarding_steps FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
