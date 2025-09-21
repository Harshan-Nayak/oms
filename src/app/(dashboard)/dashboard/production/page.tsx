import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductionDashboardContent } from '@/components/production/production-dashboard-content'

type QualityDetail = {
  quality_name: string
  rate: number
}

type BatchData = {
  batch_number: string
  weaver_challan_date: string
  weaver_challan_party: string
  weaver_challan_quantity: number
  total_raw_fabric_used: number
  stitching_challans: {
    id: number
    date: string
    challan_no: string
    product_name: string | null
    quantity: number
    top_qty: number | null
    top_pcs_qty: number | null
    bottom_qty: number | null
    bottom_pcs_qty: number | null
    both_selected: boolean | null
    both_top_qty: number | null
    both_bottom_qty: number | null
    inventory_classification: string | null
  }[]
  expenses: {
    id: number
    expense_date: string
    cost: number
    expense_for: string[]
  }[]
}

export default async function ProductionDashboardPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch weaver challans with batch numbers
  const { data: weaverChallansData } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number, challan_date, ms_party_name, total_grey_mtr')

  // Fetch shorting entries
  const { data: shortingEntries } = await supabase
    .from('shorting_entries')
    .select('*')

  // Fetch isteaching challans
  const { data: isteachingChallans } = await supabase
    .from('isteaching_challans')
    .select('*')

  // Calculate finished stock by quality
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

  // Fetch detailed batch data for the dashboard
  const batchData: BatchData[] = []
  
  if (weaverChallansData) {
    for (const weaverChallan of weaverChallansData) {
      // Fetch stitching challans for this batch
      const { data: stitchingChallans } = await supabase
        .from('isteaching_challans')
        .select(`
          id,
          date,
          challan_no,
          product_name,
          quantity,
          top_qty,
          top_pcs_qty,
          bottom_qty,
          bottom_pcs_qty,
          both_selected,
          both_top_qty,
          both_bottom_qty,
          inventory_classification
        `)
        .contains('batch_number', [weaverChallan.batch_number])
      
      // Fetch expenses related to stitching challans of this batch
      const challanNumbers = stitchingChallans?.map(challan => challan.challan_no) || []
      let expensesData = []
      if (challanNumbers.length > 0) {
        const { data: expenses } = await supabase
          .from('expenses')
          .select('*')
          .in('challan_no', challanNumbers)
        expensesData = expenses || []
      }
      
      batchData.push({
        batch_number: weaverChallan.batch_number,
        weaver_challan_date: weaverChallan.challan_date,
        weaver_challan_party: weaverChallan.ms_party_name,
        weaver_challan_quantity: weaverChallan.total_grey_mtr,
        total_raw_fabric_used: weaverChallan.total_grey_mtr, // This would be adjusted based on shorting entries
        stitching_challans: stitchingChallans || [],
        expenses: expensesData
      })
    }
  }

 return (
    <ProductionDashboardContent
      finishedStock={finishedStock}
      batchNumbers={batchNumbers}
      batchData={batchData}
    />
  )
}
