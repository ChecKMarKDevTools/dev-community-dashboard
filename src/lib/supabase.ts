import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!; // Using new secret key to bypass RLS for this backend sync

export const supabase = createClient(supabaseUrl, supabaseSecretKey);
