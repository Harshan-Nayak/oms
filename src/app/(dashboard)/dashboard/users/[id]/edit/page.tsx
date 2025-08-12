import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { UserForm } from '@/components/users/user-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UserEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserEditPage({ params }: UserEditPageProps) {
  const supabase = createServerSupabaseClient()
  
  const { id } = await params

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    redirect('/login')
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()

  if (!currentProfile) {
    redirect('/login')
  }

  // Only admins can edit other users, users can edit their own profile
  if (currentProfile.user_role !== 'Admin' && currentUser.id !== id) {
    redirect('/dashboard/users/manage')
  }

  // Fetch user profile details
  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !userProfile) {
    notFound()
  }

  const isOwnProfile = currentUser.id === id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/users/${userProfile.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwnProfile ? 'Edit My Profile' : 'Edit User'}
          </h1>
          <p className="text-gray-600 mt-1">
            Update user information and account settings
          </p>
        </div>
      </div>

      <UserForm 
        user={userProfile} 
        isEdit={true} 
        isOwnProfile={isOwnProfile}
        currentUserRole={currentProfile.user_role}
      />
    </div>
  )
}
