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
import { ProductSelectModal } from './product-select-modal'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Database, Json } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Quality = { product_name: string }
type BatchNumber = { batch_number: string, quality_details: Json }
type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Insert']
type WeaverChallan = { quality_details: Json, batch_number: string }

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
      date: new Date().toISOString().split('T')[0],
      batch_number: [],
      selected_sizes: [{ size: 'M', quantity: 0 }],
      both_selected: false,
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
  const totalProductQty = topPcsCreated + bottomPcsCreated

  // Both (Top + Bottom) calculations - step by step
  const bothCombinedQty = (bothTopQty || 0) + (bothBottomQty || 0)
  // Step 1: Divide Total Product QTY by combined value
  const stepOneResult = bothSelected && totalProductQty && bothCombinedQty > 0 
    ? totalProductQty / bothCombinedQty
    : 0
  // Step 2: Divide that result by 2 to get pieces
  const bothPiecesEach = stepOneResult > 0 ? Math.floor(stepOneResult / 2) : 0

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

      // Calculate total quantity already used by existing stitching challans for the selected quality
      const totalIsteachingChallanQty = isteachingChallans
        .filter(challan => challan.quality === selectedQuality)
        .reduce((sum, challan) => sum + (challan.quantity || 0), 0)

      // Available = Sum(Weaver Challan Qty) - Sum(Shorting Qty) - Sum(Existing Stitching Challan Qty)
      setMaxQuantity(totalWeaverChallanQty - totalShortingQty - totalIsteachingChallanQty)
    } else {
      setMaxQuantity(null)
    }
  }, [selectedQuality, shortingEntries, isteachingChallans])

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
        transport_name: data.transport_name || null,
        lr_number: data.lr_number || null,
        transport_charge: data.transport_charge || null,
        selected_product_id: data.selected_product_id || null,
        both_selected: data.both_selected || null,
        both_top_qty: data.both_top_qty || null,
        both_bottom_qty: data.both_bottom_qty || null,
        // Store selected product and sizes as JSON if they exist
        product_size: data.selected_sizes ? JSON.stringify(data.selected_sizes) : null,
      }

      // Remove the new fields that aren't in the database schema
      const { selected_sizes, ...finalChallanData } = challanData as typeof challanData & { selected_sizes?: unknown }

      const { error: insertError } = await supabase
        .from('isteaching_challans')
        .insert([finalChallanData])

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
                
                {bothCombinedQty > 0 && totalProductQty && (
                  <div className="space-y-4 mt-4">
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-700 mb-2">Calculation Steps:</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Step 1: Total Product QTY ({totalProductQty}) ÷ Combined Qty ({bothCombinedQty}) = {stepOneResult.toFixed(2)}</p>
                        <p>Step 2: {stepOneResult.toFixed(2)} ÷ 2 = {bothPiecesEach} pieces each</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <Label className="text-sm font-medium text-green-700">Top:</Label>
                        <p className="text-lg font-semibold text-green-600">{bothPiecesEach} pcs will be made</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <Label className="text-sm font-medium text-green-700">Bottom:</Label>
                        <p className="text-lg font-semibold text-green-600">{bothPiecesEach} pcs will be made</p>
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
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Challan'}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
