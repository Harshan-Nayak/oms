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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProductSelectModal } from './product-select-modal'
import { LedgerSelectModal } from './ledger-select-modal'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Database, Json } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type Quality = { product_name: string }
type BatchNumber = { batch_number: string, quality_details: Json }
type Product = Database['public']['Tables']['products']['Row']
type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Row']

const sizeSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().min(0, 'Quantity must be at least 0'),
})

const isteachingChallanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  ledger_id: z.string().min(1, 'Ledger is required'),
  quality: z.string().min(1, 'Quality is required'),
  batch_number: z.array(z.string()).min(1, 'At least one batch number is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  selected_product_id: z.number().optional(),
  selected_sizes: z.array(sizeSchema).optional(),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().min(0).optional(),
  cloth_type: z.array(z.string()).optional(),
  top_qty: z.number().min(0).optional(),
  top_pcs_qty: z.number().min(0).optional(),
  bottom_qty: z.number().min(0).optional(),
  bottom_pcs_qty: z.number().min(0).optional(),
  both_selected: z.boolean().optional(),
  both_top_qty: z.number().min(0).optional(),
  both_bottom_qty: z.number().min(0).optional(),
})

type IsteachingChallanFormData = z.infer<typeof isteachingChallanSchema>

interface IsteachingChallanEditFormProps {
  isteachingChallan: IsteachingChallan
  ledgers: Ledger[]
  qualities: Quality[]
  batchNumbers: BatchNumber[]
  products: Product[]
  shortingEntries: { quality_name: string, shorting_qty: number, weaver_challan_qty: number, batch_number: string }[]
  onSuccess?: () => void
}

export function IsteachingChallanEditForm({ 
  isteachingChallan, 
  ledgers, 
  qualities, 
  batchNumbers, 
  products, 
  shortingEntries, 
  onSuccess 
}: IsteachingChallanEditFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [availableSizes, setAvailableSizes] = useState<{ size: string; quantity: number }[]>([])
  const [filteredBatchNumbers, setFilteredBatchNumbers] = useState<{ batch_number: string, availableQty: number }[]>([])
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
      date: new Date(isteachingChallan.date).toISOString().split('T')[0],
      ledger_id: isteachingChallan.ledger_id || '',
      quality: isteachingChallan.quality,
      batch_number: isteachingChallan.batch_number || [],
      quantity: isteachingChallan.quantity,
      selected_product_id: isteachingChallan.selected_product_id || undefined,
      selected_sizes: [{ size: 'M', quantity: 0 }],
      transport_name: isteachingChallan.transport_name || undefined,
      lr_number: isteachingChallan.lr_number || undefined,
      transport_charge: isteachingChallan.transport_charge || undefined,
      cloth_type: isteachingChallan.cloth_type || [],
      top_qty: isteachingChallan.top_qty || undefined,
      top_pcs_qty: isteachingChallan.top_pcs_qty || undefined,
      bottom_qty: isteachingChallan.bottom_qty || undefined,
      bottom_pcs_qty: isteachingChallan.bottom_pcs_qty || undefined,
      both_selected: isteachingChallan.both_selected || false,
      both_top_qty: isteachingChallan.both_top_qty || undefined,
      both_bottom_qty: isteachingChallan.both_bottom_qty || undefined,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selected_sizes',
  })

  const selectedQuality = watch('quality')
  const selectedBatchNumbers = watch('batch_number')
  const selectedProductId = watch('selected_product_id')
  const selectedSizes = watch('selected_sizes')
  const clothType = watch('cloth_type')
  const topQty = watch('top_qty')
  const topPcsQty = watch('top_pcs_qty')
  const bottomQty = watch('bottom_qty')
  const bottomPcsQty = watch('bottom_pcs_qty')
  const currentQuantity = watch('quantity')
  const bothSelected = watch('both_selected')
  const bothTopQty = watch('both_top_qty')
  const bothBottomQty = watch('both_bottom_qty')

  const topPcsCreated = topQty && topPcsQty ? Math.floor(topQty / topPcsQty) : 0
  const bottomPcsCreated = bottomQty && bottomPcsQty ? Math.floor(bottomQty / bottomPcsQty) : 0
  const bothCombinedQty = (bothTopQty || 0) + (bothBottomQty || 0)
  const bothPcsCreated = currentQuantity && bothCombinedQty > 0 ? Math.floor(currentQuantity / bothCombinedQty) : 0
  const totalProductQty = bothSelected ? bothPcsCreated * 2 : topPcsCreated + bottomPcsCreated

  // Both (Top + Bottom) calculations - step by step
  // Step 1: Divide Total Product QTY by combined value
  const stepOneResult = bothSelected && totalProductQty && bothCombinedQty > 0
    ? totalProductQty / bothCombinedQty
    : 0
  // Step 2: Divide that result by 2 to get pieces
  const bothPiecesEach = stepOneResult > 0 ? Math.floor(stepOneResult / 2) : 0

  // Initialize selected ledger
  useEffect(() => {
    if (isteachingChallan.ledger_id) {
      const ledger = ledgers.find(l => l.ledger_id === isteachingChallan.ledger_id)
      setSelectedLedger(ledger || null)
    }
  }, [isteachingChallan.ledger_id, ledgers])

  // Initialize selected product
  useEffect(() => {
    if (isteachingChallan.selected_product_id) {
      const product = products.find(p => p.id === isteachingChallan.selected_product_id)
      setSelectedProduct(product || null)
    }
  }, [isteachingChallan.selected_product_id, products])

  // Initialize quality on component mount to trigger filtering
  useEffect(() => {
    if (isteachingChallan.quality) {
      setValue('quality', isteachingChallan.quality)
    }
  }, [isteachingChallan.quality, setValue])

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

  // Handle product selection and available sizes
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      setSelectedProduct(product || null)
      
      if (product?.product_size) {
        try {
          const sizes = typeof product.product_size === 'string' 
            ? JSON.parse(product.product_size)
            : product.product_size
          setAvailableSizes(Array.isArray(sizes) ? sizes : [])
        } catch (error) {
          console.error('Error parsing product sizes:', error)
          setAvailableSizes([])
        }
      } else {
        setAvailableSizes([])
      }
    } else {
      setSelectedProduct(null)
      setAvailableSizes([])
    }
  }, [selectedProductId, products])

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

      // Available = Sum(Weaver Challan Qty) - Sum(Shorting Qty) + Current Challan Qty (since we're editing)
      const baseAvailable = totalWeaverChallanQty - totalShortingQty
      const currentChallanQty = isteachingChallan.quantity || 0
      setMaxQuantity(baseAvailable + currentChallanQty)
    } else {
      setMaxQuantity(null)
    }
  }, [selectedQuality, shortingEntries, isteachingChallan.quantity])

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

  const handleProductSelect = (productId: number) => {
    setValue('selected_product_id', productId)
    // Reset selected sizes when product changes
    setValue('selected_sizes', [{ size: 'M', quantity: 0 }])
  }

  // Custom validation for size quantities
  const validateSizeQuantity = (value: number, sizeIndex: number) => {
    // Get the current size from the form state or the field
    const currentSelectedSizes = watch('selected_sizes') || []
    const currentSize = currentSelectedSizes[sizeIndex]?.size
    
    // If no size selected yet, allow any value >= 0
    if (!currentSize) return true
    
    // Find the available size info
    const availableSize = availableSizes.find(s => s.size === currentSize)
    if (!availableSize) return true
    
    // Check if value exceeds available quantity
    if (value > availableSize.quantity) {
      return `Quantity cannot exceed ${availableSize.quantity} for size ${currentSize}`
    }
    
    return true
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

    // Validate selected sizes don't exceed available quantities
    if (data.selected_sizes && availableSizes.length > 0) {
      const totalSelectedQty = data.selected_sizes.reduce((sum, s) => sum + s.quantity, 0)
      const maxAvailableQty = availableSizes.reduce((sum, s) => sum + s.quantity, 0)
      
      if (totalSelectedQty > maxAvailableQty) {
        setError(`Selected quantities (${totalSelectedQty}) cannot exceed available stock (${maxAvailableQty}).`)
        setIsAlertOpen(true)
        setLoading(false)
        return
      }

      // Validate individual size quantities
      for (const selectedSize of data.selected_sizes) {
        const availableSize = availableSizes.find(s => s.size === selectedSize.size)
        if (availableSize && selectedSize.quantity > availableSize.quantity) {
          setError(`Quantity for size ${selectedSize.size} (${selectedSize.quantity}) cannot exceed available stock (${availableSize.quantity}).`)
          setIsAlertOpen(true)
          setLoading(false)
          return
        }
      }
    }

    try {
      const updateData = {
        ...data,
        transport_name: data.transport_name || null,
        lr_number: data.lr_number || null,
        transport_charge: data.transport_charge || null,
        selected_product_id: data.selected_product_id || null,
        both_selected: data.both_selected || null,
        both_top_qty: data.both_top_qty || null,
        both_bottom_qty: data.both_bottom_qty || null,
        // Store selected sizes as JSON
        product_size: data.selected_sizes ? JSON.stringify(data.selected_sizes) : null,
      }

      // Remove the selected_sizes field as it's not in the database schema
      const { selected_sizes, ...finalUpdateData } = updateData as typeof updateData & { selected_sizes?: unknown }

      console.log('Update data:', finalUpdateData) // Debug log
      console.log('Challan ID:', isteachingChallan.id) // Debug log

      const { error: updateError } = await supabase
        .from('isteaching_challans')
        .update(finalUpdateData)
        .eq('id', isteachingChallan.id)

      if (updateError) {
        console.error('Supabase update error:', updateError) // Debug log
        setError(`Failed to update challan: ${updateError.message || 'Unknown error'}`)
        showToast('Failed to update challan.', 'error')
        setIsAlertOpen(true)
        return
      }

      showToast('Challan updated successfully!', 'success')
      onSuccess?.()
      if (!onSuccess) {
        router.push(`/dashboard/production/isteaching-challan/${isteachingChallan.id}`)
      }
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
                  {selectedBatchNumbers?.length > 0 ? `${selectedBatchNumbers.length} selected` : 'Select batch numbers'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {filteredBatchNumbers.map(bn => (
                  <DropdownMenuItem key={bn.batch_number} onSelect={(e) => e.preventDefault()}>
                    <Checkbox
                      checked={selectedBatchNumbers?.includes(bn.batch_number)}
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
                  checked={clothType?.includes('TOP')}
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
                  checked={clothType?.includes('BOTTOM')}
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
                <p className="text-lg font-semibold">{bothSelected ? bothPcsCreated : topPcsCreated}</p>
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
                <p className="text-lg font-semibold">{bothSelected ? bothPcsCreated : bottomPcsCreated}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Total Product QTY</Label>
            <p className="text-lg font-semibold">{totalProductQty}</p>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Product Selection</CardTitle>
          <CardDescription>Select a product for this challan (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selected_product">Select Product</Label>
            <ProductSelectModal products={products} onProductSelect={handleProductSelect}>
              <Button type="button" variant="outline" className="w-full justify-start">
                {selectedProduct ? (
                  <div className="flex items-center space-x-2">
                    <span>{selectedProduct.product_name}</span>
                    <span className="text-sm text-gray-500">({selectedProduct.product_sku})</span>
                  </div>
                ) : (
                  '-- Select Product --'
                )}
              </Button>
            </ProductSelectModal>
          </div>
          
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <p className="text-sm">{selectedProduct.product_category}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Available Qty:</span>
                <p className="text-sm">{selectedProduct.product_qty || 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Color:</span>
                <p className="text-sm">{selectedProduct.product_color || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Material:</span>
                <p className="text-sm">{selectedProduct.product_material || 'N/A'}</p>
              </div>
              {selectedProduct.product_description && (
                <div className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm">{selectedProduct.product_description}</p>
                </div>
              )}
            </div>
          )}

          {/* Both (Top + Bottom) Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="both_selected"
                checked={bothSelected || false}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true
                  setValue('both_selected', isChecked)
                  if (!isChecked) {
                    setValue('both_top_qty', undefined)
                    setValue('both_bottom_qty', undefined)
                  }
                }}
              />
              <Label htmlFor="both_selected">Both (Top + Bottom)</Label>
            </div>

            {bothSelected && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800">Both (Top + Bottom) Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="both_top_qty">Enter Top Qty (in meters)</Label>
                    <Input 
                      id="both_top_qty" 
                      type="number" 
                      step="0.01"
                      {...register('both_top_qty', { valueAsNumber: true })} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="both_bottom_qty">Enter Bottom Qty (in meters)</Label>
                    <Input 
                      id="both_bottom_qty" 
                      type="number" 
                      step="0.01"
                      {...register('both_bottom_qty', { valueAsNumber: true })} 
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {bothCombinedQty > 0 && currentQuantity && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <Label className="text-sm font-medium text-green-700">Top pcs created:</Label>
                        <p className="text-lg font-semibold text-green-600">{bothPcsCreated}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <Label className="text-sm font-medium text-green-700">Bottom pcs created:</Label>
                        <p className="text-lg font-semibold text-green-600">{bothPcsCreated}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {bothCombinedQty === 0 && (bothTopQty || bothBottomQty) && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">Please enter both Top Qty and Bottom Qty to see calculations.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Size Selection */}
      {selectedProduct && availableSizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Size Selection</CardTitle>
            <CardDescription>Select sizes and quantities from available options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Sizes:</h4>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size, index) => (
                  <div key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {size.size}: {size.quantity} pcs
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <Select
                    onValueChange={(value) => {
                      setValue(`selected_sizes.${index}.size`, value)
                      // Reset quantity when size changes to avoid validation issues
                      setValue(`selected_sizes.${index}.quantity`, 0)
                    }}
                    defaultValue={field.size}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      {availableSizes.map(size => (
                        <SelectItem key={size.size} value={size.size}>
                          {size.size} ({size.quantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1">
                    <Input
                      type="number"
                      {...register(`selected_sizes.${index}.quantity`, { 
                        valueAsNumber: true,
                        validate: (value) => {
                          if (value < 0) return 'Quantity must be at least 0'
                          return validateSizeQuantity(value, index)
                        }
                      })}
                      placeholder="Quantity"
                      max={(() => {
                        const currentSize = selectedSizes?.[index]?.size
                        const availableSize = availableSizes.find(s => s.size === currentSize)
                        return availableSize?.quantity || 999
                      })()}
                      min="0"
                      className="w-32"
                    />
                    {errors.selected_sizes?.[index]?.quantity && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.selected_sizes[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ size: availableSizes[0]?.size || 'M', quantity: 0 })}
                disabled={availableSizes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Size
              </Button>
              
              {selectedSizes && selectedSizes.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">
                    Total Selected: {selectedSizes.reduce((sum, s) => sum + s.quantity, 0)} pcs
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Form Actions */}
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
