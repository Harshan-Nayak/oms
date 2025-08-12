import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WeaverChallanEditForm } from '@/components/production/weaver-challan-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface WeaverChallanEditPageProps {
  params: {
    id: string
  }
}

export default async function WeaverChallanEditPage({ params }: WeaverChallanEditPageProps) {
  const supabase = createServerSupabaseClient()
  
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
    redirect('/dashboard/production/weaver-challan')
  }

  // Fetch weaver challan details
  const { data: weaverChallan, error } = await supabase
    .from('weaver_challans')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !weaverChallan) {
    notFound()
  }

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('ledger_id, business_name, contact_person_name, mobile_number, email, address, city, state, gst_number')
    .order('business_name', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/production/weaver-challan/${weaverChallan.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challan
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Weaver Challan</h1>
          <p className="text-gray-600 mt-1">
            Update production challan information and quality details
          </p>
        </div>
      </div>

      <WeaverChallanEditForm 
        weaverChallan={weaverChallan} 
        ledgers={ledgers || []} 
        userId={user.id}
        userName={profile.first_name || 'User'}
      />
    </div>
  )
}
