import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LedgersContent } from '@/components/ledger/ledgers-content'

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    state?: string
    city?: string
    fromDate?: string
    toDate?: string
  }>
}

export default async function LedgersListPage({ searchParams }: PageProps) {
  const supabase = createServerSupabaseClient()
  
  // Await searchParams since it's now a Promise in Next.js 15
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // Filters
  const page = parseInt(params.page as string) || 1
  const limit = 25
  const offset = (page - 1) * limit
  
  const searchQuery = params.search ? String(params.search) : ''
  const state = params.state ? String(params.state) : ''
  const city = params.city ? String(params.city) : ''
  const fromDate = params.fromDate ? String(params.fromDate) : ''
  const toDate = params.toDate ? String(params.toDate) : ''

  // Fetch ledgers with pagination and filters
  let query = supabase
    .from('ledgers')
    .select('*', { count: 'exact' })

  if (searchQuery) {
    query = query.or(`business_name.ilike.%${searchQuery}%,ledger_id.ilike.%${searchQuery}%,contact_person_name.ilike.%${searchQuery}%`)
  }
  if (state) {
    query = query.eq('state', state)
  }
  if (city) {
    query = query.eq('city', city)
  }
  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }
  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data: ledgersData, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch profiles for the ledgers
  const creatorIds = ledgersData?.map(ledger => ledger.created_by).filter(Boolean) as string[] || []
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', creatorIds)

  // Combine ledgers with profiles
  const ledgers = ledgersData?.map(ledger => {
    const profileData = profilesData?.find(p => p.id === ledger.created_by)
    return {
      ...ledger,
      profiles: profileData ? { email: profileData.email } : null
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
