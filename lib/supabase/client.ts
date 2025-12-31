import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Environment Variables
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// =============================================================================
// Site URL Helper
// =============================================================================

/**
 * Returns the site URL for OAuth redirects and other absolute URLs.
 * Priority: NEXT_PUBLIC_SITE_URL env var > window.location.origin (client) > localhost fallback
 */
export function getSiteUrl(): string {
  // Prefer explicit env var (works in all environments)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Client-side fallback
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // SSR fallback (should set NEXT_PUBLIC_SITE_URL in production)
  return "http://localhost:3000";
}

// =============================================================================
// Supabase Client
// =============================================================================

/**
 * Browser-only Supabase client.
 * This client handles auth state automatically via cookies.
 * 
 * Note: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set
 * in .env.local for development and in your deployment platform for production.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
