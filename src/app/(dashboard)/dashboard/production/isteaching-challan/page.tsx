import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IsteachingChallanContent } from '@/components/production/isteaching-challan-content'

// This type accurately reflects the data returned by the Supabase query,
// acknowledging that weaver_challans is a single object, not an array.
type ShortingEntryWithChallan = {
  quality_name: string | null
  shorting_qty: number
  weaver_challan_qty: number
  weaver_challans: {
    batch_number: string
  } | null
}

export default async function IsteachingChallanPage() {
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

  // Fetch isteaching challans with pagination
  const { data: challans, count } = await supabase
    .from('isteaching_challans')
    .select(`
      *,
      ledgers (
        business_name
      ),
      products (
        product_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('*')
    .order('business_name', { ascending: true })
    
  // Fetch qualities from weaver_challans
  const { data: weaverChallans } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number')

  const qualities = weaverChallans
    ? [...new Set(
        weaverChallans
          .flatMap(c => (Array.isArray(c.quality_details) ? c.quality_details : []))
          .map(q => q?.quality_name)
          .filter(Boolean)
      )].map(name => ({ product_name: name as string }))
    : []
    
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('product_status', 'Active')
    .order('product_name', { ascending: true })

  // Fetch batch numbers from weaver_challans
  const { data: batchNumbers } = await supabase
    .from('weaver_challans')
    .select('batch_number, quality_details')

  // Fetch shorting entries
  const { data: shortingEntries } = await supabase
    .from('shorting_entries')
    .select('quality_name, shorting_qty, weaver_challan_qty, weaver_challans ( batch_number )')

  // Cast the fetched data to our specific type, then filter out any entries
  // that are missing the required data, ensuring type safety for the component.
  const formattedShortingEntries = (shortingEntries as ShortingEntryWithChallan[] | null)
    ?.filter(e => e.quality_name && e.weaver_challans?.batch_number)
    .map(e => ({
      quality_name: e.quality_name!,
      shorting_qty: e.shorting_qty,
      weaver_challan_qty: e.weaver_challan_qty,
      batch_number: e.weaver_challans!.batch_number,
    })) || []

  return (
    <IsteachingChallanContent 
      challans={challans || []} 
      totalCount={count || 0}
      ledgers={ledgers || []}
      qualities={qualities || []}
      batchNumbers={batchNumbers || []}
      userRole={profile.user_role}
      products={products || []}
      weaverChallans={weaverChallans || []}
      shortingEntries={formattedShortingEntries}
    />
  )
}
