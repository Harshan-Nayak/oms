import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PurchaseOrderForm } from '@/components/purchase/purchase-order-form'

export default async function CreatePurchaseOrderPage() {
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

  if (!profile || !['Admin', 'Manager'].includes(profile.user_role)) {
    redirect('/dashboard/purchase/manage')
  }

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('*')
    .order('business_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Purchase Order</h1>
        <p className="text-gray-600 mt-1">
          Create a new purchase order for suppliers
        </p>
      </div>

      <PurchaseOrderForm userId={user.id} ledgers={ledgers || []} />
    </div>
  )
}
