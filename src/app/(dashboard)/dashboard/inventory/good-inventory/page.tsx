import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoodInventoryContent } from '@/components/inventory/good-inventory-content'

export default async function GoodInventoryPage() {
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

  // Fetch good inventory items
 const { data: goodInventoryItems, error } = await supabase
    .from('isteaching_challans')
    .select(`
      *,
      ledgers (business_name),
      products (product_name, product_description, product_image, product_sku)
    `)
    .eq('inventory_classification', 'good')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching good inventory items:', error)
  }

  return (
    <GoodInventoryContent
      items={goodInventoryItems || []}
      userRole={profile.user_role}
    />
  )
}