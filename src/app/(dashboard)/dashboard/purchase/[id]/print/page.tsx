import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintPageClient from './PrintPageClient'

interface PrintPurchaseOrderPageProps {
  params: Promise<{
    id: string
  }>
}

async function getPurchaseOrder(id: Promise<{ id: string }>) {
  const { id: purchaseOrderId } = await id;
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: purchaseOrder, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      ledgers (
        business_name,
        contact_person_name,
        mobile_number,
        email,
        address,
        city,
        district,
        state,
        zip_code,
        gst_number
      )
    `)
    .eq('id', purchaseOrderId)
    .single()

  if (error || !purchaseOrder) {
    notFound()
  }

  return purchaseOrder
}

export default async function PrintPurchaseOrderPage({ params }: PrintPurchaseOrderPageProps) {
  const purchaseOrder = await getPurchaseOrder(params)

  return <PrintPageClient purchaseOrder={purchaseOrder} />
}
