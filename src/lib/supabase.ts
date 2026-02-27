import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using service key to bypass RLS for this backend sync

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
