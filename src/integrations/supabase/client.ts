import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Sem URL/chave fixas e sem fallback para o ambiente principal (produção).
// O cliente exige configuração explícita via env (VITE_SUPABASE_* no browser /
// SUPABASE_* no servidor). Sem env válido, FALHA imediatamente — proteção
// arquitetural para nunca conectar à produção por engano. Ver RUNNING_LOCALLY.md.
function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error(
      "VITE_SUPABASE_URL não configurada. Configure o .env (ambiente DEV) antes de iniciar. Ver RUNNING_LOCALLY.md.",
    );
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "VITE_SUPABASE_PUBLISHABLE_KEY não configurada. Configure o .env (ambiente DEV) antes de iniciar. Ver RUNNING_LOCALLY.md.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

