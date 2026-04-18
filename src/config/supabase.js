import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dkcruxuitukexjywfyct.supabase.co'

const supabaseKey = 'sb_publishable_7GNmsBiirkVMWrXyQAAgjA_vp83PABU'

export const supabase = createClient(supabaseUrl, supabaseKey)