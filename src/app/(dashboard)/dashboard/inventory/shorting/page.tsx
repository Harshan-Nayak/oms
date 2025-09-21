import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShortingContent } from '@/components/inventory/shorting-content'

export default async function ShortingPage() {
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

  // Fetch shorting items
 const { data: shortingItems, error } = await supabase
    .from('isteaching_challans')
    .select(`
      *,
      ledgers (business_name),
      products (product_name, product_description, product_image, product_sku)
    `)
    .eq('inventory_classification', 'shorting')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching shorting items:', error)
  }

  return (
    <ShortingContent
      items={shortingItems || []}
      userRole={profile.user_role}
    />
  )
}