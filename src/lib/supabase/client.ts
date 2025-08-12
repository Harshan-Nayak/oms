import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// For client-side operations
export const createBrowserClient = () =>
  createClientComponentClient()

// For server-side operations
export const createServerClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// Default client for client-side
export const supabase = createBrowserClient()
