import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hopbxzavfhtigkgfiobh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_oeCA9-yxLkCrrfkexpOSIQ_Mc7FFdVO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
