'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X, User, Shield } from 'lucide-react'
import { Database } from '@/types/database'
import Image from 'next/image'

type Profile = Database['public']['Tables']['profiles']['Insert']

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  user_role: z.enum(['Admin', 'Manager', 'User']),
  user_status: z.enum(['Active', 'Inactive']),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string(),
  document_type: z.string().optional(),
  document_number: z.string().optional(),
  dob: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  user?: Database['public']['Tables']['profiles']['Row']
  isEdit?: boolean
  isOwnProfile?: boolean
  currentUserRole?: string
}

export function UserForm({ user, isEdit = false, isOwnProfile = false, currentUserRole }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.profile_photo || null
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      user_role: (user?.user_role as 'Admin' | 'Manager' | 'User') || 'User',
      user_status: (user?.user_status as 'Active' | 'Inactive') || 'Active',
      mobile: user?.mobile || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      country: user?.country || 'India',
      document_type: user?.document_type || '',
      document_number: user?.document_number || '',
      dob: user?.dob || '',
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setPhotoFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setError('Please select a valid image file')
      }
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    setError('')

    try {
      let photoUrl = user?.profile_photo || null

      // Upload new photo if selected
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile)
        if (!photoUrl) {
          setError('Failed to upload profile photo. Please try again.')
          setLoading(false)
          return
        }
      }

      if (isEdit && user) {
        // Update existing user profile
        const profileData: Partial<Profile> = {
          first_name: data.first_name,
          last_name: data.last_name,
          user_role: data.user_role,
          user_status: data.user_status,
          profile_photo: photoUrl,
          mobile: data.mobile || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country,
          document_type: data.document_type || null,
          document_number: data.document_number || null,
          dob: data.dob || null,
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)

        if (updateError) {
          setError('Failed to update user. Please try again.')
          return
        }
      } else {
        // Create new user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.first_name,
              last_name: data.last_name,
            }
          }
        })

        if (authError) {
          setError(authError.message)
          return
        }

        if (!authData.user) {
          setError('Failed to create user account.')
          return
        }

        // Update the profile with additional details
        const profileData: Partial<Profile> = {
          user_role: data.user_role,
          user_status: data.user_status,
          profile_photo: photoUrl,
          mobile: data.mobile || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country,
          document_type: data.document_type || null,
          document_number: data.document_number || null,
          dob: data.dob || null,
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', authData.user.id)

        if (profileError) {
          setError('User created but failed to update profile. Please edit the user to complete setup.')
        }
      }

      if (isEdit && user) {
        router.push(`/dashboard/users/${user.id}`)
      } else {
        router.push('/dashboard/users/manage')
      }
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Error saving user:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Photo
          </CardTitle>
          <CardDescription>Upload user profile photo (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {photoPreview ? (
              <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                <Image
                  src={photoPreview}
                  alt="Profile preview"
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center w-32 h-32 flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 text-sm">
                    Upload
                  </span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      {!isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Details</CardTitle>
            <CardDescription>Email and password for login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>User personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                {...register('mobile')}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                {...register('dob')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Role & Status
          </CardTitle>
          <CardDescription>Assign user role and account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_role">User Role *</Label>
              <Select value={watch('user_role')} onValueChange={(value) => setValue('user_role', value as 'Admin' | 'Manager' | 'User')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.user_role && (
                <p className="text-sm text-red-600">{errors.user_role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_status">Account Status *</Label>
              <Select value={watch('user_status')} onValueChange={(value) => setValue('user_status', value as 'Active' | 'Inactive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>User address and location details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="Enter state"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="India"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>Identity document details (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select value={watch('document_type')} onValueChange={(value) => setValue('document_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="DrivingLicense">Driving License</SelectItem>
                  <SelectItem value="VoterID">Voter ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_number">Document Number</Label>
              <Input
                id="document_number"
                {...register('document_number')}
                placeholder="Enter document number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update User' : 'Create User'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit && user) {
              router.push(`/dashboard/users/${user.id}`)
            } else {
              router.push('/dashboard/users/manage')
            }
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

