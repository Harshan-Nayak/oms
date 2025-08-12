import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeaverChallanContent } from '@/components/production/weaver-challan-content'

export default async function WeaverChallanPage() {
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

  // Fetch weaver challans with pagination
  const { data: challans, count } = await supabase
    .from('weaver_challans')
    .select(`
      *,
      ledgers (
        business_name,
        contact_person_name,
        mobile_number,
        address,
        city,
        state
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19) // First 20 challans

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('ledger_id, business_name, contact_person_name, mobile_number, email, address, city, district, state, country, zip_code, gst_number')
    .order('business_name', { ascending: true })

  return (
    <WeaverChallanContent 
      challans={challans || []} 
      totalCount={count || 0}
      ledgers={ledgers || []}
      userRole={profile.user_role}
      userId={user.id}
      userName={`${profile.first_name} ${profile.last_name}`}
    />
  )
}
