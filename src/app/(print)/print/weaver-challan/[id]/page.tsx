import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintChallanClient from './PrintChallanClient'

interface PrintWeaverChallanPageProps {
  params: Promise<{
    id: string
  }>
}

async function getWeaverChallan(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: weaverChallan, error } = await supabase
    .from('weaver_challans')
    .select(`
      *,
      ledgers:ledgers!weaver_challans_ledger_id_fkey (
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
    .eq('id', id)
    .single()

  if (error || !weaverChallan) {
    notFound()
  }

  return weaverChallan
}

export default async function PrintWeaverChallanPage({ params }: PrintWeaverChallanPageProps) {
  const resolvedParams = await params;
  const weaverChallan = await getWeaverChallan(resolvedParams.id)

  return <PrintChallanClient weaverChallan={weaverChallan} />
}
