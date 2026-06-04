-- Etapa 1.1 — Usuários e permissões do Hub
-- Cria hub_users (perfil interno) e clinic_assignments (vínculo usuário ↔ clínica)
-- Essas tabelas são a base do controle de acesso por papel e por clínica.

-- Enum de papéis dentro do Hub
CREATE TYPE public.hub_role AS ENUM (
  'admin',      -- acesso total a tudo
  'gestor',     -- vê tudo, escreve em alertas e contingência
  'operador'    -- vê apenas clínicas atribuídas, resolve alertas
);

-- Perfil interno dos usuários (complementa auth.users do Supabase)
CREATE TABLE public.hub_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        public.hub_role NOT NULL DEFAULT 'operador',
  avatar_url  TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: cria hub_users automaticamente ao criar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION fn_create_hub_user_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.hub_users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'operador'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_hub_user_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_create_hub_user_on_signup();

-- Vínculo entre usuário e clínica (para controle de acesso por operador)
CREATE TABLE public.clinic_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.hub_users(id) ON DELETE CASCADE,
  clinic_id   UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'responsavel', -- responsavel | suporte | viewer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- Índices
CREATE INDEX idx_clinic_assignments_user    ON public.clinic_assignments(user_id);
CREATE INDEX idx_clinic_assignments_clinic  ON public.clinic_assignments(clinic_id);

-- RLS
ALTER TABLE public.hub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_assignments ENABLE ROW LEVEL SECURITY;

-- Usuário vê seu próprio perfil; admin vê todos
CREATE POLICY "users see own profile" ON public.hub_users
  FOR SELECT USING (
    id = auth.uid()
    OR (SELECT role FROM public.hub_users WHERE id = auth.uid()) = 'admin'
  );

-- Admins gerenciam usuários
CREATE POLICY "admins manage users" ON public.hub_users
  FOR ALL USING (
    (SELECT role FROM public.hub_users WHERE id = auth.uid()) = 'admin'
  );

-- Admins e gestores veem atribuições; operador vê as próprias
CREATE POLICY "users see assignments" ON public.clinic_assignments
  FOR SELECT USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.hub_users WHERE id = auth.uid()) IN ('admin', 'gestor')
  );

CREATE POLICY "admins manage assignments" ON public.clinic_assignments
  FOR ALL USING (
    (SELECT role FROM public.hub_users WHERE id = auth.uid()) = 'admin'
  );
