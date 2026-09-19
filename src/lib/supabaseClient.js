import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev rather than silently querying a broken client.
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase environment variables. Copy .env.example to .env and ' +
      'fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// This client is safe to use anywhere in the frontend: it only ever holds
// the public "anon" key, which is meaningless without the RLS policies in
// supabase/schema.sql granting it access. Never import a service-role key
// here or anywhere else in src/.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
