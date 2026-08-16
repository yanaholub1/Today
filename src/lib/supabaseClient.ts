import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your Supabase project values.')
}

// Single shared client — session persistence (the whole point of Stage 6's
// "click the magic link once per device" requirement) is Supabase's own
// default here: `persistSession: true` + `localStorage` storage are already
// the defaults, not something this app opts into manually. `detectSessionInUrl`
// (also default true) is what lets the magic-link redirect land on `/` and
// have the client parse the session out of the URL fragment on its own,
// with no dedicated callback route needed.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
