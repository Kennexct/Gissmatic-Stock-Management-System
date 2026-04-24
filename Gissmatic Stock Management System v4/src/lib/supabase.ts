import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snpmzbjkelpsbsigevfz.supabase.co';
const supabaseAnonKey = 'sb_publishable_xFj_32SzlKghQ9nAwmG_Zw_xY3Rk8on';

// Primary client for queries and standard auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Secondary client specifically for creating new staff members.
// Setting persistSession to false ensures creating a user doesn't log the admin out.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
