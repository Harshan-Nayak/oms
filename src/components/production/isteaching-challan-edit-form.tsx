'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LedgerSelectModal } from './ledger-select-modal'
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { Database, Json } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type Quality = { product_name: string }
type BatchNumber = { batch_number: string, quality_details: Json }
type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Row']

const sizeSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

const isteachingChallanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  ledger_id: z.string().min(1, 'Ledger is required').nullable(),
  quality: z.string().min(1, 'Quality is required'),
  batch_number: z.array(z.string()).min(1, 'At least one batch number is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  product_name: z.string().optional().nullable(),
  product_description: z.string().optional().nullable(),
  product_sku: z.string().optional().nullable(),
  product_qty: z.number().min(0).optional().nullable(),
  product_color: z.string().optional().nullable(),
  product_size: z.array(sizeSchema).optional().nullable(),
})

type IsteachingChallanFormData = z.infer<typeof isteachingChallanSchema>

interface IsteachingChallanEditFormProps {
  isteachingChallan: IsteachingChallan
  ledgers: Ledger[]
  qualities: Quality[]
  batchNumbers: BatchNumber[]
}

export function IsteachingChallanEditForm({ isteachingChallan, ledgers, qualities, batchNumbers }: IsteachingChallanEditFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [filteredBatchNumbers, setFilteredBatchNumbers] = useState<{ batch_number: string }[]>([])
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(isteachingChallan.product_image)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<IsteachingChallanFormData>({
    resolver: zodResolver(isteachingChallanSchema),
    defaultValues: {
      ...isteachingChallan,
      date: new Date(isteachingChallan.date).toISOString().split('T')[0],
      product_size: isteachingChallan.product_size ? JSON.parse(JSON.stringify(isteachingChallan.product_size)) : [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'product_size',
  })

  const selectedQuality = watch('quality')
  const productQty = watch('product_qty')
  const productSizes = watch('product_size')
  const selectedBatchNumbers = watch('batch_number') || []

  useEffect(() => {
    if (isteachingChallan.ledger_id) {
      const ledger = ledgers.find(l => l.ledger_id === isteachingChallan.ledger_id)
      setSelectedLedger(ledger || null)
    }
  }, [isteachingChallan.ledger_id, ledgers])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setProductImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const removeImage = () => {
    setProductImageFile(null)
    setProductImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  useEffect(() => {
    if (selectedQuality) {
      type QualityDetail = { quality_name: string }
      const batches = batchNumbers
        .filter(bn => {
          if (!bn.quality_details) return false
          const details = Array.isArray(bn.quality_details) ? bn.quality_details : [bn.quality_details]
          return (details as QualityDetail[]).some((d: QualityDetail) => d.quality_name === selectedQuality)
        })
        .map(bn => ({ batch_number: bn.batch_number }))
      setFilteredBatchNumbers(batches)
    } else {
      setFilteredBatchNumbers([])
    }
  }, [selectedQuality, batchNumbers])

  const handleLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedLedger(ledger || null)
    setValue('ledger_id', ledgerId)
  }

  const onSubmit = async (data: IsteachingChallanFormData) => {
    setLoading(true)
    setError('')

    const totalSizeQty = data.product_size?.reduce((sum, s) => sum + s.quantity, 0) || 0
    if (data.product_qty && totalSizeQty > data.product_qty) {
      setError('Sum of size quantities cannot exceed Product Qty.')
      setIsAlertOpen(true)
      setLoading(false)
      return
    }

    try {
      let imageUrl = isteachingChallan.product_image
      if (productImageFile) {
        imageUrl = await uploadImage(productImageFile)
        if (!imageUrl) {
          setError('Failed to upload image. Please try again.')
          setIsAlertOpen(true)
          setLoading(false)
          return
        }
      }

      const { error: updateError } = await supabase
        .from('isteaching_challans')
        .update({ ...data, product_image: imageUrl })
        .eq('id', isteachingChallan.id)

      if (updateError) {
        setError('Failed to update challan. Please try again.')
        showToast('Failed to update challan.', 'error')
        return
      }

      showToast('Challan updated successfully!', 'success')
      router.push(`/dashboard/production/isteaching-challan/${isteachingChallan.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      showToast('An unexpected error occurred.', 'error')
      console.error('Error updating challan:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsAlertOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Challan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ledger_id">Select Ledger *</Label>
            <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleLedgerSelect}>
              <Button type="button" variant="outline" className="w-full justify-start">
                {selectedLedger ? selectedLedger.business_name : '-- Select Ledger --'}
              </Button>
            </LedgerSelectModal>
            {errors.ledger_id && <p className="text-sm text-red-600">{errors.ledger_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Select Quality *</Label>
            <Select onValueChange={(value) => setValue('quality', value)} defaultValue={isteachingChallan.quality}>
              <SelectTrigger>
                <SelectValue placeholder="Select a quality" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {qualities.map(q => (
                  <SelectItem key={q.product_name} value={q.product_name}>{q.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.quality && <p className="text-sm text-red-600">{errors.quality.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch_number">Select Batch Number *</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {selectedBatchNumbers.length > 0 ? `${selectedBatchNumbers.length} selected` : 'Select batch numbers'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {filteredBatchNumbers.map(bn => (
                  <DropdownMenuItem key={bn.batch_number} onSelect={(e) => e.preventDefault()}>
                    <Checkbox
                      checked={selectedBatchNumbers.includes(bn.batch_number)}
                      onCheckedChange={(checked) => {
                        const current = selectedBatchNumbers || []
                        const newSelection = checked
                          ? [...current, bn.batch_number]
                          : current.filter(b => b !== bn.batch_number)
                        setValue('batch_number', newSelection)
                      }}
                    />
                    <span className="ml-2">{bn.batch_number}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.batch_number && <p className="text-sm text-red-600">{errors.batch_number.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Enter Quantity *</Label>
            <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name</Label>
            <Input id="product_name" {...register('product_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_description">Product Description</Label>
            <Textarea id="product_description" {...register('product_description')} />
          </div>
          <div className="space-y-2">
            <Label>Product Image</Label>
            {productImagePreview ? (
              <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                <Image
                  src={productImagePreview}
                  alt="Product preview"
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center w-32 h-32 flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 text-sm">
                    Upload
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_sku">Product SKU</Label>
            <Input id="product_sku" {...register('product_sku')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_qty">Product Qty</Label>
            <Input id="product_qty" type="number" {...register('product_qty', { valueAsNumber: true })} />
            {errors.product_qty && <p className="text-sm text-red-600">{errors.product_qty.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_color">Product Color</Label>
            <Input id="product_color" {...register('product_color')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4">
              <Select onValueChange={(value) => setValue(`product_size.${index}.size`, value)} defaultValue={field.size}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {['S', 'M', 'L', 'XL', 'XXL'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" {...register(`product_size.${index}.quantity`, { valueAsNumber: true })} placeholder="Quantity" />
              {fields.length > 1 && (
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ size: 'S', quantity: 0 })}>
            <Plus className="h-4 w-4 mr-2" /> Add Size
          </Button>
          {productQty && productSizes && productSizes.reduce((sum, s) => sum + s.quantity, 0) > productQty && (
            <p className="text-sm text-red-600">Total size quantity exceeds product quantity.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Challan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
