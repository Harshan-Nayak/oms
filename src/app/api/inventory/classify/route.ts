import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  try {
    const { challanId, classification } = await request.json()
    
    // Validate classification
    const validClassifications = ['good', 'bad', 'wastage', 'shorting']
    if (!validClassifications.includes(classification)) {
      return NextResponse.json({ error: 'Invalid classification' }, { status: 400 })
    }
    
    // Update the challan classification
    const { error } = await supabase
      .from('isteaching_challans')
      .update({ inventory_classification: classification })
      .eq('id', challanId)
    
    if (error) {
      console.error('Error updating challan classification:', error)
      return NextResponse.json({ error: 'Failed to classify challan' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in classify API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}