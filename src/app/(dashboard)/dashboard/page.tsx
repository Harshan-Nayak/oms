import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
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

  // Fetch dashboard data in parallel
  const [
    { data: products, count: productsCount },
    { data: ledgers, count: ledgersCount },
    { data: purchaseOrders, count: purchaseOrdersCount },
    { data: weaverChallans, count: weaverChallansCount },
    { data: recentPurchaseOrders },
    { data: recentWeaverChallans }
  ] = await Promise.all([
    // Products stats
    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('product_status', 'Active'),
    
    // Ledgers stats
    supabase
      .from('ledgers')
      .select('*', { count: 'exact' }),
    
    // Purchase Orders stats
    supabase
      .from('purchase_orders')
      .select('*', { count: 'exact' }),
    
    // Weaver Challans stats
    supabase
      .from('weaver_challans')
      .select('*', { count: 'exact' }),
    
    // Recent Purchase Orders
    supabase
      .from('purchase_orders')
      .select(`
        *,
        ledgers (
          business_name,
          contact_person_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Recent Weaver Challans
    supabase
      .from('weaver_challans')
      .select(`
        *,
        ledgers (
          business_name,
          contact_person_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0]
  
  const { count: todayPurchaseOrders } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  const { count: todayWeaverChallans } = await supabase
    .from('weaver_challans')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  const dashboardData = {
    stats: {
      todayOrders: (todayPurchaseOrders || 0) + (todayWeaverChallans || 0),
      totalOrders: (purchaseOrdersCount || 0) + (weaverChallansCount || 0),
      totalProducts: productsCount || 0,
      activeLedgers: ledgersCount || 0,
      productionBatches: weaverChallansCount || 0
    },
    recentPurchaseOrders: recentPurchaseOrders || [],
    recentWeaverChallans: recentWeaverChallans || []
  }

  return <DashboardContent profile={profile} dashboardData={dashboardData} />
}
