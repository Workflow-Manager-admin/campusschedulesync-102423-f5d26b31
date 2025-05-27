import React, { createContext, useContext } from "react";
import { supabase } from "./supabaseClient";

// PUBLIC_INTERFACE
/**
 * SupabaseContext provides global access to the Supabase client.
 * Does NOT manage authentication or user state; only provides client for data operations.
 */
const SupabaseContext = createContext(null);

// PUBLIC_INTERFACE
/**
 * SupabaseProvider wraps the React tree, providing the Supabase client context globally.
 * 
 * Usage: 
 * <SupabaseProvider> ...your app... </SupabaseProvider>
 */
export function SupabaseProvider({ children }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// PUBLIC_INTERFACE
/**
 * useSupabase: Custom hook to access the Supabase client from context.
 * Throws error if used outside SupabaseProvider.
 */
export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used within SupabaseProvider");
  return ctx;
}
