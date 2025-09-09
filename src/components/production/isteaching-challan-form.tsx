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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LedgerSelectModal } from './ledger-select-modal'
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { Database, Json } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Checkbox } from '@/components/ui/checkbox'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type Quality = { product_name: string }
type BatchNumber = { batch_number: string, quality_details: Json }
type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Insert']
type Product = { product_name: string, product_qty: number | null }
type WeaverChallan = { quality_details: Json, batch_number: string }

const sizeSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

const isteachingChallanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  ledger_id: z.string().min(1, 'Ledger is required'),
  quality: z.string().min(1, 'Quality is required'),
  batch_number: z.array(z.string()).min(1, 'At least one batch number is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  product_name: z.string().optional(),
  product_description: z.string().optional(),
  product_sku: z.string().optional(),
  product_qty: z.number().min(0).optional(),
  product_color: z.string().optional(),
  product_size: z.array(sizeSchema).optional(),
  category: z.string().optional(),
  sub_category: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Pipeline']).optional(),
  brand: z.string().optional(),
  made_in: z.string().optional(),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().min(0).optional(),
  cloth_type: z.array(z.string()).optional(),
  top_qty: z.number().min(0).optional(),
  top_pcs_qty: z.number().min(0).optional(),
  bottom_qty: z.number().min(0).optional(),
  bottom_pcs_qty: z.number().min(0).optional(),
})

type IsteachingChallanFormData = z.infer<typeof isteachingChallanSchema>

interface IsteachingChallanFormProps {
  ledgers: Ledger[]
  qualities: Quality[]
  batchNumbers: BatchNumber[]
  products: Product[]
  weaverChallans: WeaverChallan[]
  shortingEntries: { quality_name: string, shorting_qty: number, weaver_challan_qty: number, batch_number: string }[]
  isteachingChallans: IsteachingChallan[]
  onSuccess: () => void
}

export function IsteachingChallanForm({ ledgers, qualities, batchNumbers, products, weaverChallans, shortingEntries, isteachingChallans, onSuccess }: IsteachingChallanFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [filteredBatchNumbers, setFilteredBatchNumbers] = useState<{ batch_number: string, availableQty: number }[]>([])
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null)

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
      date: new Date().toISOString().split('T')[0],
      product_size: [{ size: 'S', quantity: 0 }],
      batch_number: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'product_size',
  })

  const selectedQuality = watch('quality')
  const productQty = watch('product_qty')
  const productSizes = watch('product_size')
  const selectedBatchNumbers = watch('batch_number')
  const clothType = watch('cloth_type')
  const topQty = watch('top_qty')
  const topPcsQty = watch('top_pcs_qty')
  const bottomQty = watch('bottom_qty')
  const bottomPcsQty = watch('bottom_pcs_qty')
  const currentStatus = watch('status')
  const currentQuantity = watch('quantity')

  const topPcsCreated = topQty && topPcsQty ? Math.floor(topQty / topPcsQty) : 0
  const bottomPcsCreated = bottomQty && bottomPcsQty ? Math.floor(bottomQty / bottomPcsQty) : 0
  const totalProductQty = topPcsCreated + bottomPcsCreated

  // Handle Top Qty constraint and auto-populate Bottom Qty
  useEffect(() => {
    if (topQty && currentQuantity) {
      // Ensure Top Qty doesn't exceed main Quantity
      if (topQty > currentQuantity) {
        setValue('top_qty', currentQuantity)
      }
      
      // Auto-populate Bottom Qty if Bottom is selected and there's remaining quantity
      if (clothType?.includes('BOTTOM') && topQty <= currentQuantity) {
        const remainingQty = currentQuantity - topQty
        if (remainingQty > 0) {
          setValue('bottom_qty', remainingQty)
        } else {
          setValue('bottom_qty', 0)
        }
      }
    }
  }, [topQty, currentQuantity, clothType, setValue])

  useEffect(() => {
    if (selectedQuality) {
      // Calculate total weaver challan quantity from shorting entries for the selected quality
      const totalWeaverChallanQty = shortingEntries
        .filter(e => e.quality_name === selectedQuality)
        .reduce((sum, entry) => sum + entry.weaver_challan_qty, 0)

      // Calculate total shorting quantity for the selected quality
      const totalShortingQty = shortingEntries
        .filter(e => e.quality_name === selectedQuality)
        .reduce((sum, entry) => sum + entry.shorting_qty, 0)

      // Available = Sum(Weaver Challan Qty) - Sum(Shorting Qty)
      setMaxQuantity(totalWeaverChallanQty - totalShortingQty)
    } else {
      setMaxQuantity(null)
    }
  }, [selectedQuality, shortingEntries])

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
      setError('') // Clear any previous errors
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
      const batches = shortingEntries
        .filter(e => e.quality_name === selectedQuality)
        .map(e => ({ 
          batch_number: e.batch_number, 
          availableQty: e.weaver_challan_qty - e.shorting_qty // Calculate available quantity
        }))
      setFilteredBatchNumbers(batches)
    } else {
      setFilteredBatchNumbers([])
    }
  }, [selectedQuality, shortingEntries])

  const handleLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedLedger(ledger || null)
    setValue('ledger_id', ledgerId)
  }

  const onSubmit = async (data: IsteachingChallanFormData) => {
    setLoading(true)
    setError('')

    if (maxQuantity !== null && data.quantity > maxQuantity) {
      setError(`Quantity cannot exceed the available stock of ${maxQuantity}.`)
      setIsAlertOpen(true)
      setLoading(false)
      return
    }

    const totalSizeQty = data.product_size?.reduce((sum, s) => sum + s.quantity, 0) || 0
    if (data.product_qty && totalSizeQty > data.product_qty) {
      setError('Sum of size quantities cannot exceed Product Qty.')
      setIsAlertOpen(true)
      setLoading(false)
      return
    }

    try {
      let imageUrl: string | null = null
      if (productImageFile) {
        imageUrl = await uploadImage(productImageFile)
        if (!imageUrl) {
          setError('Failed to upload image. Please try again.')
          setIsAlertOpen(true)
          setLoading(false)
          return
        }
      }

      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      const challanPrefix = `SVH-CH-${dateStr}-`
      const { data: lastChallan } = await supabase
        .from('isteaching_challans')
        .select('challan_no')
        .like('challan_no', `${challanPrefix}%`)
        .order('id', { ascending: false })
        .limit(1)

      let challanSuffix = '001'
      if (lastChallan && lastChallan.length > 0) {
        const lastNumber = lastChallan[0].challan_no.slice(-3)
        challanSuffix = String(parseInt(lastNumber) + 1).padStart(3, '0')
      }
      const challanNumber = challanPrefix + challanSuffix

      const challanData: IsteachingChallan = {
        ...data,
        challan_no: challanNumber,
        product_image: imageUrl,
        transport_name: data.transport_name || null,
        lr_number: data.lr_number || null,
        transport_charge: data.transport_charge || null,
      }

      const { error: insertError } = await supabase
        .from('isteaching_challans')
        .insert([challanData])

      if (insertError) {
        setError('Failed to create challan. Please try again.')
        showToast('Failed to create challan.', 'error')
        return
      }

      showToast('Challan created successfully!', 'success')
      onSuccess()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      showToast('An unexpected error occurred.', 'error')
      console.error('Error creating challan:', err)
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
            <Select onValueChange={(value) => setValue('quality', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a quality" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {[...new Set(shortingEntries.map(q => q.quality_name))].map(qualityName => (
                  <SelectItem key={qualityName} value={qualityName}>{qualityName}</SelectItem>
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
                    <span className="ml-2">{bn.batch_number} ({bn.availableQty} mtr)</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.batch_number && <p className="text-sm text-red-600">{errors.batch_number.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Enter Quantity *</Label>
            <Input 
              id="quantity" 
              type="number" 
              {...register('quantity', { valueAsNumber: true })} 
              max={maxQuantity ?? undefined}
              className={maxQuantity !== null && currentQuantity > maxQuantity ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
            {maxQuantity !== null && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Available: {maxQuantity}</p>
                {currentQuantity > maxQuantity && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Quantity cannot exceed available stock of {maxQuantity}
                  </p>
                )}
                {currentQuantity > 0 && currentQuantity <= maxQuantity && (
                  <p className="text-sm text-green-600">
                    ✓ Valid quantity ({maxQuantity - currentQuantity} remaining)
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cloth Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Cloth Type</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cloth_type_top"
                  value="TOP"
                  onCheckedChange={(checked) => {
                    const current = clothType || []
                    const newSelection = checked
                      ? [...current, 'TOP']
                      : current.filter((t) => t !== 'TOP')
                    setValue('cloth_type', newSelection)
                  }}
                />
                <Label htmlFor="cloth_type_top">TOP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cloth_type_bottom"
                  value="BOTTOM"
                  onCheckedChange={(checked) => {
                    const current = clothType || []
                    const newSelection = checked
                      ? [...current, 'BOTTOM']
                      : current.filter((t) => t !== 'BOTTOM')
                    setValue('cloth_type', newSelection)
                  }}
                />
                <Label htmlFor="cloth_type_bottom">BOTTOM</Label>
              </div>
            </div>
          </div>

          {clothType?.includes('TOP') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="top_qty">Enter Top Qty (mtr)</Label>
                <Input 
                  id="top_qty" 
                  type="number" 
                  {...register('top_qty', { valueAsNumber: true })} 
                  max={currentQuantity ?? undefined}
                  className={currentQuantity && topQty && topQty > currentQuantity ? 'border-red-500 focus:border-red-500' : ''}
                />
                {currentQuantity && topQty && topQty > currentQuantity && (
                  <p className="text-sm text-red-600">Top Qty cannot exceed main quantity of {currentQuantity}</p>
                )}
                {currentQuantity && (
                  <p className="text-sm text-gray-500">Max: {currentQuantity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="top_pcs_qty">Enter 1pcs Qty (mtr)</Label>
                <Input id="top_pcs_qty" type="number" {...register('top_pcs_qty', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Top Pcs Created</Label>
                <p className="text-lg font-semibold">{topPcsCreated}</p>
              </div>
            </div>
          )}

          {clothType?.includes('BOTTOM') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bottom_qty">Enter Bottom Qty (mtr)</Label>
                <Input 
                  id="bottom_qty" 
                  type="number" 
                  {...register('bottom_qty', { valueAsNumber: true })} 
                  readOnly={topQty ? topQty > 0 : false}
                  className={topQty && topQty > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
                {topQty && topQty > 0 && (
                  <p className="text-sm text-gray-500">Auto-calculated from remaining quantity</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bottom_pcs_qty">Enter 1pcs Qty (mtr)</Label>
                <Input id="bottom_pcs_qty" type="number" {...register('bottom_pcs_qty', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Bottom Pcs Created</Label>
                <p className="text-lg font-semibold">{bottomPcsCreated}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Total Product QTY</Label>
            <p className="text-lg font-semibold">{totalProductQty}</p>
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
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register('category')} placeholder="Enter category" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub_category">Sub Category</Label>
            <Input id="sub_category" {...register('sub_category')} placeholder="Enter sub category" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setValue('status', value as 'Active' | 'Inactive' | 'Pipeline')} defaultValue="Active">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {productQty === 0 ? (
                  <>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pipeline">Pipeline</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pipeline">Pipeline</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} placeholder="Enter brand" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="made_in">Made In</Label>
            <Input id="made_in" {...register('made_in')} placeholder="Enter manufacturing location" />
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

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transport Details</CardTitle>
          <CardDescription>Enter transport and logistics information (optional)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="transport_name">Transport Name</Label>
            <Input
              id="transport_name"
              {...register('transport_name')}
              placeholder="Enter transport company"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lr_number">LR Number</Label>
            <Input
              id="lr_number"
              {...register('lr_number')}
              placeholder="Enter LR number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport_charge">Transport Charge</Label>
            <Input
              id="transport_charge"
              type="number"
              step="0.01"
              {...register('transport_charge', { valueAsNumber: true })}
              placeholder="0.0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Challan'}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
