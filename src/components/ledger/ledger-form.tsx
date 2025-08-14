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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Loader2, Upload, X } from 'lucide-react'
import { Database } from '@/types/database'
import { generateLedgerId } from '@/lib/utils'
import Image from 'next/image'

type Ledger = Database['public']['Tables']['ledgers']['Insert'] & { updated_at?: string }

const ledgerSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_person_name: z.string().optional(),
  mobile_number: z.string()
    .optional()
    .refine((value) => !value || /^\d{10}$/.test(value), {
      message: 'Mobile number must be 10 digits',
    }),
  email: z.string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string(),
  zip_code: z.string().optional(),
  gst_number: z.string()
    .optional()
    .refine(
      (value) =>
        !value ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          value.toUpperCase()
        ),
      {
        message: 'Invalid GST number format',
      }
    ),
})

type LedgerFormData = z.infer<typeof ledgerSchema>

interface LedgerFormProps {
  userId: string
  ledger?: Database['public']['Tables']['ledgers']['Row']
  isEdit?: boolean
}

export function LedgerForm({ userId, ledger, isEdit = false }: LedgerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    ledger?.business_logo || null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LedgerFormData>({
    resolver: zodResolver(ledgerSchema),
    defaultValues: {
      business_name: ledger?.business_name || '',
      contact_person_name: ledger?.contact_person_name || '',
      mobile_number: ledger?.mobile_number || '',
      email: ledger?.email || '',
      address: ledger?.address || '',
      city: ledger?.city || '',
      district: ledger?.district || '',
      state: ledger?.state || '',
      country: ledger?.country || 'India',
      zip_code: ledger?.zip_code || '',
      gst_number: ledger?.gst_number || '',
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please select a JPG, JPEG, or PNG image.')
        setIsAlertOpen(true)
        return
      }

      const maxSizeInMB = 3
      if (file.size > maxSizeInMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeInMB}MB. Please choose a smaller file.`)
        setIsAlertOpen(true)
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('') // Clear any previous errors
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ledgers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ledger-documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('ledger-documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading logo:', error)
      return null
    }
  }

  const onSubmit = async (data: LedgerFormData) => {
    setLoading(true)
    setError('')

    try {
      let logoUrl = ledger?.business_logo || null

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile)
        if (!logoUrl) {
          setError('Failed to upload logo. Please try again.')
          setLoading(false)
          return
        }
      }

      if (isEdit && ledger) {
        // UPDATE operation
        const ledgerUpdateData = {
          ...data,
          business_logo: logoUrl,
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
          .from('ledgers')
          .update(ledgerUpdateData)
          .eq('ledger_id', ledger.ledger_id)

        if (updateError) {
          console.error('Supabase update error:', updateError)
          setError(`Failed to update ledger: ${updateError.message}`)
          return
        }
      } else {
        // INSERT operation
        const ledgerInsertData: Ledger = {
          ...data,
          ledger_id: generateLedgerId(),
          business_logo: logoUrl,
          created_by: userId,
        }

        const { error: insertError } = await supabase
          .from('ledgers')
          .insert([ledgerInsertData])

        if (insertError) {
          console.error('Supabase insert error:', insertError)
          setError(`Failed to create ledger: ${insertError.message}`)
          return
        }
      }

      // Redirect and refresh on success
      router.push('/dashboard/ledger/list')
      router.refresh()

    } catch (err) {
      console.error('Error saving ledger:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Upload Error</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsAlertOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Business Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Business Logo</CardTitle>
          <CardDescription>Upload business logo (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logoPreview ? (
              <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={removeLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center w-32 h-32 flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 text-sm">
                    Upload
                  </span>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Enter business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              {...register('business_name')}
              placeholder="Enter business name"
            />
            {errors.business_name && (
              <p className="text-sm text-red-600">{errors.business_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person_name">Contact Person</Label>
              <Input
                id="contact_person_name"
                {...register('contact_person_name')}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                {...register('gst_number')}
                placeholder="Enter GST number"
              />
              {errors.gst_number && (
                <p className="text-sm text-red-600">{errors.gst_number.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Contact details for communication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                {...register('mobile_number')}
                placeholder="Enter mobile number"
              />
              {errors.mobile_number && (
               <p className="text-sm text-red-600">{errors.mobile_number.message}</p>
             )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Business address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter business address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                {...register('district')}
                placeholder="Enter district"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                onValueChange={(value) => setValue('state', value)}
                defaultValue={ledger?.state || ''}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className='bg-white' >
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                {...register('zip_code')}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="India"
            />
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
            isEdit ? 'Update Ledger' : 'Create Ledger'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/ledger/list')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

