import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
