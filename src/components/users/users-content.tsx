'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Shield,
  Users as UsersIcon
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'

type User = Database['public']['Tables']['profiles']['Row']

interface UsersContentProps {
  users: User[]
  totalCount: number
  currentUserId: string
}

export function UsersContent({ users, totalCount, currentUserId }: UsersContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.mobile && user.mobile.includes(searchTerm))

    return matchesSearch
  })

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(userId)

    try {
      // First delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        alert('Failed to delete user profile. Please try again.')
        return
      }

      // Note: The auth.users record is managed by Supabase and 
      // typically cannot be deleted via client-side operations
      // In a production environment, you might want to implement 
      // a server-side function to handle auth user deletion

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

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

  const getRoleCounts = () => {
    const counts = users.reduce((acc, user) => {
      acc[user.user_role] = (acc[user.user_role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return counts
  }

  const getStatusCounts = () => {
    const counts = users.reduce((acc, user) => {
      acc[user.user_status] = (acc[user.user_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return counts
  }

  const roleCounts = getRoleCounts()
  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their permissions ({totalCount} total users)
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/users/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {roleCounts['Admin'] || 0}
            </div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {roleCounts['Manager'] || 0}
            </div>
            <div className="text-sm text-gray-600">Managers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {roleCounts['User'] || 0}
            </div>
            <div className="text-sm text-gray-600">Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {statusCounts['Active'] || 0}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search by name, email, or mobile number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            {filteredUsers.length} of {totalCount} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.profile_photo || ''} 
                          alt={`${user.first_name} ${user.last_name}`}
                        />
                        <AvatarFallback>
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        {user.id === currentUserId && (
                          <div className="text-xs text-blue-600">(You)</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.mobile ? (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {user.mobile}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.user_role)}</TableCell>
                  <TableCell>{getStatusBadge(user.user_status)}</TableCell>
                  <TableCell>
                    {user.city && user.state ? (
                      <div className="text-sm">
                        {user.city}, {user.state}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        {user.id !== currentUserId && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                            disabled={deletingId === user.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === user.id ? 'Deleting...' : 'Delete User'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No users found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your search or create a new user
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
