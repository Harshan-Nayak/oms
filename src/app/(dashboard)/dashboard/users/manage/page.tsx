import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersContent } from '@/components/users/users-content'

export default async function ManageUsersPage() {
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
    redirect('/dashboard')
  }

  // Fetch all users (Admin only)
  const { data: users, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  return (
    <UsersContent 
      users={users || []} 
      totalCount={count || 0}
      currentUserId={user.id}
    />
  )
}
