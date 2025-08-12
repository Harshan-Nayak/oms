import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserForm } from '@/components/users/user-form'

export default async function CreateUserPage() {
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

  if (!profile || profile.user_role !== 'Admin') {
    redirect('/dashboard/users/manage')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create User</h1>
        <p className="text-gray-600 mt-1">
          Create a new user account with role-based access
        </p>
      </div>

      <UserForm />
    </div>
  )
}
