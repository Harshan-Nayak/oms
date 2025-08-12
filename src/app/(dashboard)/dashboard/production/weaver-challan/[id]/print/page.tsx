import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintChallanClient from './PrintChallanClient'

interface PrintWeaverChallanPageProps {
  params: Promise<{
    id: string
  }>
}

async function getWeaverChallan(id: Promise<{ id: string }>) {
  const { id: challanId } = await id;
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: weaverChallan, error } = await supabase
    .from('weaver_challans')
    .select(`
      *,
      ledgers (
        business_name,
        contact_person_name,
        mobile_number,
        email,
        address,
        city,
        state,
        gst_number
      )
    `)
    .eq('id', challanId)
    .single()

  if (error || !weaverChallan) {
    notFound()
  }

  return weaverChallan
}

export default async function PrintWeaverChallanPage({ params }: PrintWeaverChallanPageProps) {
  const weaverChallan = await getWeaverChallan(params)

  return <PrintChallanClient weaverChallan={weaverChallan} />
}
