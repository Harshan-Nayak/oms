import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BarcodeChallanClient from '@/app/(print)/print/barcode/isteaching-challan/[id]/BarcodeChallanClient'

interface BarcodeChallanPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BarcodeChallanPage({ params }: BarcodeChallanPageProps) {
  const resolvedParams = await params;
  const supabase = createServerSupabaseClient()
  
  // Fetch the stitching challan with related data
  const { data: isteachingChallan, error } = await supabase
    .from('isteaching_challans')
    .select(`
      *,
      ledgers (*)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !isteachingChallan) {
    console.error('Error fetching stitching challan:', error)
    notFound()
  }

  // Fetch related weaver challans for batch details
  const { data: weaverChallans } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number')

  return (
    <BarcodeChallanClient
      isteachingChallan={isteachingChallan}
      weaverChallans={weaverChallans || []}
    />
  )
}