import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IsteachingChallanContent } from '@/components/production/isteaching-challan-content'

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
    .select('quality_details')

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
    .select('product_name, product_qty')

  // Fetch batch numbers from weaver_challans
  const { data: batchNumbers } = await supabase
    .from('weaver_challans')
    .select('batch_number, quality_details')

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
    />
  )
}
