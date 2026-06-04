-- Migration gerada automaticamente pelo agente de segurança do Lovable.
-- Removeu o acesso anônimo (REVOKE SELECT FROM anon) nas 6 tabelas operacionais.
-- Também removeu o arquivo de rota órfão crm.clinicas..tsx que causava erro de build.
--
-- NOTA: As políticas "authenticated read" criadas aqui (USING true) são provisórias.
-- A migration 20260604000002 já aplica RLS por papel/clínica mais granular.
-- Quando hub_users estiver populado em produção, as políticas de 000002 prevalecem.
-- Esta migration garante que o ambiente sem usuários cadastrados ainda funciona.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['alerts','audit_logs','channel_monitoring','channels','clinics','contingency_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "authenticated read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END $$;
