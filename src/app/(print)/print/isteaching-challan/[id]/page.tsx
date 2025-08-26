import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintChallanClient from './PrintChallanClient'

interface PrintIsteachingChallanPageProps {
  params: Promise<{
    id: string
  }>
}

async function getIsteachingChallan(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: isteachingChallan, error } = await supabase
    .from('isteaching_challans')
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
    .eq('id', id)
    .single()

  if (error || !isteachingChallan) {
    notFound()
  }

  return isteachingChallan
}

export default async function PrintIsteachingChallanPage({ params }: PrintIsteachingChallanPageProps) {
  const resolvedParams = await params;
  const isteachingChallan = await getIsteachingChallan(resolvedParams.id)

  const supabase = createServerSupabaseClient()
  const { data: weaverChallans } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number')

  return <PrintChallanClient isteachingChallan={isteachingChallan} weaverChallans={weaverChallans || []} />
}
