import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PurchaseOrdersContent } from '@/components/purchase/purchase-orders-content'

export default async function ManagePurchaseOrdersPage() {
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

  // Fetch purchase orders with pagination
  const { data: purchaseOrders, count } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      ledgers (
        business_name,
        contact_person_name,
        mobile_number
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19) // First 20 POs

  return (
    <PurchaseOrdersContent 
      purchaseOrders={purchaseOrders || []} 
      totalCount={count || 0}
      userRole={profile.user_role}
    />
  )
}
