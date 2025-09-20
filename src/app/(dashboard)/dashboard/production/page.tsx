import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductionDashboardContent } from '@/components/production/production-dashboard-content'

type QualityDetail = {
  quality_name: string
  rate: number
}

export default async function ProductionDashboardPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: weaverChallansData } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number')

  const { data: shortingEntries } = await supabase
    .from('shorting_entries')
    .select('*')

  const { data: isteachingChallans } = await supabase
    .from('isteaching_challans')
    .select('*')

  const weaverChallansByQuality: { [key: string]: number } = {}
  if (weaverChallansData) {
    for (const challan of weaverChallansData) {
      if (Array.isArray(challan.quality_details)) {
        for (const detail of challan.quality_details) {
          const qualityDetail = detail as QualityDetail
          if (qualityDetail.quality_name && qualityDetail.rate) {
            weaverChallansByQuality[qualityDetail.quality_name] = (weaverChallansByQuality[qualityDetail.quality_name] || 0) + qualityDetail.rate
          }
        }
      }
    }
  }

  const shortingByQuality: { [key: string]: number } = {}
  if (shortingEntries) {
    for (const entry of shortingEntries) {
      if (entry.quality_name) {
        shortingByQuality[entry.quality_name] = (shortingByQuality[entry.quality_name] || 0) + entry.shorting_qty
      }
    }
  }

  const isteachingByQuality: { [key: string]: number } = {}
  if (isteachingChallans) {
    for (const challan of isteachingChallans) {
      isteachingByQuality[challan.quality] = (isteachingByQuality[challan.quality] || 0) + challan.quantity
    }
  }

  const finishedStock = Object.keys(shortingByQuality).map(quality => {
    const totalQty = weaverChallansByQuality[quality] || 0
    const shorted = shortingByQuality[quality] || 0
    const issued = isteachingByQuality[quality] || 0
    return {
      quality_name: quality,
      total_qty: totalQty,
      shorted_qty: shorted,
      issued_qty: issued,
      available_qty: totalQty - shorted - issued,
    }
  })

  const batchNumbers = weaverChallansData?.map(c => c.batch_number).filter(Boolean) as string[] || []

  return (
    <ProductionDashboardContent
      finishedStock={finishedStock}
      batchNumbers={batchNumbers}
    />
  )
}
