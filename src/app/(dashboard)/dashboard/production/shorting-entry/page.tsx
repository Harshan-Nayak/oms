import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShortingEntryContent } from '@/components/production/shorting-entry-content'

export default async function ShortingEntryPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('*')
    .order('business_name', { ascending: true })

  // Fetch shorting entries
  const { data: shortingEntries } = await supabase
    .from('shorting_entries')
    .select(`
      *,
      ledgers ( business_name ),
      weaver_challans ( challan_no )
    `)
    .order('created_at', { ascending: false })

  return (
    <ShortingEntryContent 
      ledgers={ledgers || []}
      shortingEntries={shortingEntries || []}
      userId={user.id}
      userName={`${profile.first_name} ${profile.last_name}`}
    />
  )
}
