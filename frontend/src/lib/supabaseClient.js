import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const setSupabaseSession = async (accessToken, refreshToken) => {
  if (!accessToken) return;
  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || accessToken
    });
  } catch (err) {
    console.warn("Supabase client setSession warning:", err);
  }
};

export const clearSupabaseSession = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    // Ignore error
  }
};

