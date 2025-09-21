import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConvertToInventoryContent } from '@/components/inventory/convert-to-inventory-content'

export default async function ConvertToInventoryPage() {
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

  // Fetch all Stitching Challans that have not yet been converted to inventory
  // This would require a specific query to find challans that haven't been converted
  // For now, we'll fetch all challans as a placeholder
  const { data: challans, error } = await supabase
    .from('isteaching_challans')
    .select(`
      *,
      ledgers (business_name),
      products (product_name, product_description, product_image, product_sku)
    `)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching challans:', error)
  }

  return (
    <ConvertToInventoryContent 
      challans={challans || []}
      userRole={profile.user_role}
    />
  )
}