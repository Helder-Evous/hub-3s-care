import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Project: nndvcsdevbxpgsccyimm — these are public values safe to ship in source.
// Override via VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY env vars.
const DEFAULT_URL = "https://nndvcsdevbxpgsccyimm.supabase.co";
const DEFAULT_KEY = "sb_publishable_ccTz6w39O7OSamtCiPzCTA_aQh8rs7D";

function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY;

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

