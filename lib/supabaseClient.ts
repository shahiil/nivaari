import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// only create client if both values are set; during build these may be undefined
export const supabase = url && key ? createClient(url, key) : null;
