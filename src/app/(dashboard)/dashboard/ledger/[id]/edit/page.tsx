import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LedgerForm } from '@/components/ledger/ledger-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface LedgerEditPageProps {
  params: {
    id: string
  }
}

export default async function LedgerEditPage({ params }: LedgerEditPageProps) {
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
    redirect('/dashboard/ledger/list')
  }

  // Fetch ledger details
  const { data: ledger, error } = await supabase
    .from('ledgers')
    .select('*')
    .eq('ledger_id', params.id)
    .single()

  if (error || !ledger) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/ledger/${ledger.ledger_id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ledger
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Ledger</h1>
          <p className="text-gray-600 mt-1">
            Update business partner information
          </p>
        </div>
      </div>

      <LedgerForm userId={user.id} ledger={ledger} isEdit={true} />
    </div>
  )
}
