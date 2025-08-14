import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LedgersContent } from '@/components/ledger/ledgers-content'

export default async function LedgersListPage() {
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

  // Fetch ledgers with pagination
  const { data: ledgersData, count } = await supabase
    .from('ledgers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 24) // First 25 ledgers

  // Fetch profiles for the ledgers
  const creatorIds = ledgersData?.map(ledger => ledger.created_by) || []
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', creatorIds)

  // Combine ledgers with profiles
  const ledgers = ledgersData?.map(ledger => {
    const profile = profilesData?.find(p => p.id === ledger.created_by)
    return {
      ...ledger,
      profiles: profile ? { email: profile.email } : null
    }
  })

  return (
    <LedgersContent 
      ledgers={ledgers || []} 
      totalCount={count || 0}
      userRole={profile.user_role}
    />
  )
}
