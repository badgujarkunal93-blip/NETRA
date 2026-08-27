import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const isDummyConfig =
  !supabaseUrl ||
  supabaseUrl === 'https://dummy.supabase.co' ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'dummy';

export const isSupabaseConfigured = !isDummyConfig;

// Create a no-op proxy client when not configured so imports don't crash
export const supabase = isDummyConfig
  ? new Proxy({}, {
      get: () => new Proxy(() => {}, {
        get: () => new Proxy(() => {}, {
          get: () => () => Promise.resolve({ data: null, error: null, count: 0 }),
          apply: () => new Proxy({}, { get: () => () => Promise.resolve({ data: null, error: null, count: 0 }) })
        }),
        apply: (_, __, args) => new Proxy({}, { get: () => () => Promise.resolve({ data: null, error: null, count: 0 }) })
      })
    })
  : createClient(supabaseUrl, supabaseAnonKey);
