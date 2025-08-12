import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PurchaseOrderEditForm } from '@/components/purchase/purchase-order-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PurchaseOrderEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PurchaseOrderEditPage({ params }: PurchaseOrderEditPageProps) {
  const supabase = createServerSupabaseClient()
  
  const resolvedParams = await params
  
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

  // Check permissions
  if (profile.user_role !== 'Admin' && profile.user_role !== 'Manager') {
    redirect('/dashboard/purchase/manage')
  }

  // Fetch purchase order details
  const { data: purchaseOrder, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !purchaseOrder) {
    notFound()
  }

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('*')
    .order('business_name', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/purchase/${purchaseOrder.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PO
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Purchase Order</h1>
          <p className="text-gray-600 mt-1">
            Update purchase order information and items
          </p>
        </div>
      </div>

      <PurchaseOrderEditForm 
        purchaseOrder={purchaseOrder} 
        ledgers={ledgers || []} 
        userId={user.id} 
      />
    </div>
  )
}
