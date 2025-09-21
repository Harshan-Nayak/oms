import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  try {
    const { challanId } = await request.json()
    
    // Update the challan classification back to unclassified
    const { error } = await supabase
      .from('isteaching_challans')
      .update({ inventory_classification: 'unclassified' })
      .eq('id', challanId)
    
    if (error) {
      console.error('Error updating challan classification:', error)
      return NextResponse.json({ error: 'Failed to undo classification' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in undo API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}