import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// When VITE_DEV_MODE=true, these values may be empty placeholders — that's fine
// because the app never actually calls Supabase in dev mode.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
