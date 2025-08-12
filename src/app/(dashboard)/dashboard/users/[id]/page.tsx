import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const supabase = createServerSupabaseClient()
  
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

  // Only admins can view other user details
  if (currentProfile.user_role !== 'Admin' && currentUser.id !== params.id) {
    redirect('/dashboard/users/manage')
  }

  // Fetch user profile details
  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !userProfile) {
    notFound()
  }

  const canEdit = currentProfile.user_role === 'Admin' || currentUser.id === params.id

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'Admin': 'bg-red-100 text-red-700',
      'Manager': 'bg-blue-100 text-blue-700',
      'User': 'bg-green-100 text-green-700'
    }
    
    return (
      <Badge variant="secondary" className={roleColors[role as keyof typeof roleColors]}>
        <Shield className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge variant="default" className="bg-green-100 text-green-700">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-700">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/users/manage">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600 mt-1">
              View user information and account details
            </p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/dashboard/users/${userProfile.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={userProfile.profile_photo || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(userProfile.first_name, userProfile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {userProfile.first_name} {userProfile.last_name}
              </h3>
              <p className="text-gray-600">{userProfile.email}</p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                {getRoleBadge(userProfile.user_role)}
                {getStatusBadge(userProfile.user_status)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <p className="text-lg">{userProfile.first_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <p className="text-lg">{userProfile.last_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 font-mono text-sm">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mobile</label>
                  <p className="text-gray-900">{userProfile.mobile || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1">{getRoleBadge(userProfile.user_role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(userProfile.user_status)}</div>
                </div>
              </div>

              {userProfile.dob && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(userProfile.dob)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>Communication and address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{userProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mobile</label>
                    <p className="text-gray-900">{userProfile.mobile || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <div className="text-gray-900">
                    {userProfile.address && (
                      <p>{userProfile.address}</p>
                    )}
                    {(userProfile.city || userProfile.state || userProfile.country) && (
                      <p>
                        {[userProfile.city, userProfile.state, userProfile.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {!userProfile.address && !userProfile.city && !userProfile.state && (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Information */}
          {(userProfile.document_type || userProfile.document_number) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document Information
                </CardTitle>
                <CardDescription>Identity document details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Document Type</label>
                    <p className="text-gray-900">{userProfile.document_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Document Number</label>
                    <p className="font-mono text-sm">{userProfile.document_number || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Account creation and activity details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Created</label>
                  <p className="text-gray-900">{formatDate(userProfile.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{formatDate(userProfile.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
