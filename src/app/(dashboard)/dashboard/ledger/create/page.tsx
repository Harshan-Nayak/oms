import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LedgerForm } from '@/components/ledger/ledger-form'

export default async function CreateLedgerPage() {
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

  if (!profile || !['Admin', 'Manager'].includes(profile.user_role)) {
    redirect('/dashboard/ledger/list')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Ledger</h1>
        <p className="text-gray-600 mt-1">
          Add a new business partner or vendor to your ledger
        </p>
      </div>

      <LedgerForm userId={user.id} isEdit={false} />
    </div>
  )
}
