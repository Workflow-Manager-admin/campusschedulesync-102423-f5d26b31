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
  const url = process.env.REACT_APP_SUPABASE_URL||'https://alsthvnrqazftrtluxss.supabase.co';
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsc3Rodm5ycWF6ZnRydGx1eHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTI1MjIsImV4cCI6MjA2MzAyODUyMn0.eY4c5y2ld6z6SJZhrhtOp38bg0PsSyQbhPOyfQjThyk';
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file."
    );
  }
  return createClient(url, anonKey);
}

// Singleton, so the client is not re-created on every import
export const supabase = getSupabaseClient();
