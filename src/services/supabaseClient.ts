import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  // Nouvelle clé publique sb_publishable_... ; l'ancien nom anon reste accepté.
  const publishableKey = String(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      ''
  ).trim();

  if (!url || !publishableKey) return null;

  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
}
