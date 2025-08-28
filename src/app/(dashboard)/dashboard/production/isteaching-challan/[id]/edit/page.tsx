import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { IsteachingChallanEditForm } from '@/components/production/isteaching-challan-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface IsteachingChallanEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function IsteachingChallanEditPage({ params }: IsteachingChallanEditPageProps) {
  const supabase = createServerSupabaseClient()
  
  const resolvedParams = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    redirect('/login')
  }
  
  if (profile.user_role !== 'Admin' && profile.user_role !== 'Manager') {
    redirect('/dashboard/production/isteaching-challan')
  }
  
  const { data: isteachingChallan, error } = await supabase
    .from('isteaching_challans')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()
  
  if (error || !isteachingChallan) {
    notFound()
  }
  
  const { data: ledgers } = await supabase
    .from('ledgers')
    .select('*')
    .order('business_name', { ascending: true })

  const { data: weaverChallans } = await supabase
    .from('weaver_challans')
    .select('quality_details, batch_number')

  const qualities = weaverChallans
    ? [...new Set(
        weaverChallans
          .flatMap(c => (Array.isArray(c.quality_details) ? c.quality_details : []))
          .map(q => q?.quality_name)
          .filter(Boolean)
      )].map(name => ({ product_name: name as string }))
    : []
    
  const batchNumbers = weaverChallans ? weaverChallans : []

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/production/isteaching-challan/${isteachingChallan.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challan
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Stitching  Challan</h1>
        </div>
      </div>

      <IsteachingChallanEditForm 
        isteachingChallan={isteachingChallan} 
        ledgers={ledgers || []} 
        qualities={qualities}
        batchNumbers={batchNumbers}
      />
    </div>
  )
}
