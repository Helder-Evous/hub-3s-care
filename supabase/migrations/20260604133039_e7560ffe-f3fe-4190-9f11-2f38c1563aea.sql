
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['alerts','audit_logs','channel_monitoring','channels','clinics','contingency_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "authenticated read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END $$;
