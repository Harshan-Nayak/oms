import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/inventory/product-form'

export default async function CreateProductPage() {
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
    redirect('/dashboard/inventory/products')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
        <p className="text-gray-600 mt-1">
          Add a new product to your inventory
        </p>
      </div>

      <ProductForm userId={user.id} />
    </div>
  )
}
