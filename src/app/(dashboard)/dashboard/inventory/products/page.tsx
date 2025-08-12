import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductsContent } from '@/components/inventory/products-content'

export default async function ProductsPage() {
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

  // Fetch products with pagination
  const { data: products, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 9) // First 10 products

  // Fetch filter options
  const { data: categories } = await supabase
    .from('products')
    .select('product_category')
    .not('product_category', 'is', null)

  const { data: colors } = await supabase
    .from('products')
    .select('product_color')
    .not('product_color', 'is', null)

  const { data: materials } = await supabase
    .from('products')
    .select('product_material')
    .not('product_material', 'is', null)

  const filterOptions = {
    categories: [...new Set(categories?.map(p => p.product_category) || [])],
    colors: [...new Set(colors?.map(p => p.product_color) || [])],
    materials: [...new Set(materials?.map(p => p.product_material) || [])],
    statuses: ['Active', 'Inactive']
  }

  return (
    <ProductsContent 
      products={products || []} 
      totalCount={count || 0}
      filterOptions={filterOptions}
      userRole={profile.user_role}
    />
  )
}
