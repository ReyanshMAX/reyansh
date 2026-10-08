import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

// Anon key, no cookies: safe inside statically rendered public pages.
export function createPublicClient(): SupabaseClient {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
