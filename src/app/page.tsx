import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard')
  } else {
    // User is not authenticated, redirect to login
    redirect('/login')
  }
}
