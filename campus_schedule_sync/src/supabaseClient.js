/// supabaseClient.js
// Initializes Supabase client using environment variables (for safety & user guide compliance).
// No authentication logic included.

import { createClient } from "@supabase/supabase-js";

// PUBLIC_INTERFACE
/**
 * Get a configured Supabase client using environment variables.
 * 
 * Requires:
 *   REACT_APP_SUPABASE_URL
 *   REACT_APP_SUPABASE_ANON_KEY
 * 
 * Throws if either is missing.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file."
    );
  }
  return createClient(url, anonKey);
}

// Singleton, so the client is not re-created on every import
export const supabase = getSupabaseClient();
