export const supabase = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
};

export const isConfigured = !!supabase.url && !!supabase.anonKey;
