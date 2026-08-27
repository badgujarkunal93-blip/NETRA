import { createClient } from '@supabase/supabase-js';

export function validateEnvironment() {
  const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
                      (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);

  const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
                         (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL. Please configure your environment variables.");
  }
  
  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_ANON_KEY. Please configure your environment variables.");
  }

  if (supabaseAnonKey.includes('service_role') || supabaseAnonKey.includes('secret')) {
    throw new Error("CRITICAL SECURITY VIOLATION: Service role keys must not be used in the frontend application.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

let supabaseUrl, supabaseAnonKey;
try {
  const env = validateEnvironment();
  supabaseUrl = env.supabaseUrl;
  supabaseAnonKey = env.supabaseAnonKey;
} catch (error) {
  // Production: fail safely without leaking sensitive information
  const isProd = (typeof import.meta !== 'undefined' && import.meta.env?.PROD) || 
                 (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
                 
  if (isProd) {
    console.error("Configuration Error: Application failed to initialize securely.");
  } else {
    // Development: actionable error
    console.error("Startup Configuration Error:", error.message);
  }
  // Still throw to halt execution since we have no valid DB to connect to
  throw error;
}

export const isSupabaseConfigured = true;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
