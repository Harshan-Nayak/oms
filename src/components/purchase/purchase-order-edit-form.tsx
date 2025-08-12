'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { Database } from '@/types/database'

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row']
type Ledger = Database['public']['Tables']['ledgers']['Row']

const purchaseOrderItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0.01, 'Unit price must be greater than 0'),
  total_price: z.number().min(0.01, 'Total price must be greater than 0'),
})

const purchaseOrderEditSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  ledger_id: z.string().optional(),
  po_date: z.string().min(1, 'PO date is required'),
  delivery_date: z.string().optional(),
  description: z.string().optional(),
  terms_conditions: z.string().optional(),
  status: z.enum(['Draft', 'Sent', 'Confirmed', 'Partial', 'Completed', 'Cancelled']),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
})

type PurchaseOrderEditFormData = z.infer<typeof purchaseOrderEditSchema>

interface PurchaseOrderEditFormProps {
  purchaseOrder: PurchaseOrder
  ledgers: Ledger[]
  userId: string
}

export function PurchaseOrderEditForm({ purchaseOrder, ledgers, userId }: PurchaseOrderEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(
    ledgers.find(l => l.ledger_id === purchaseOrder.ledger_id) || null
  )

  // Parse existing items
  const parseItems = (items: any) => {
    if (!items) return [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]
    try {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]
    } catch {
      return [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PurchaseOrderEditFormData>({
    resolver: zodResolver(purchaseOrderEditSchema),
    defaultValues: {
      supplier_name: purchaseOrder.supplier_name,
      ledger_id: purchaseOrder.ledger_id === 'custom' ? 'custom' : (purchaseOrder.ledger_id || 'custom'),
      po_date: purchaseOrder.po_date,
      delivery_date: purchaseOrder.delivery_date || '',
      description: purchaseOrder.description || '',
      terms_conditions: purchaseOrder.terms_conditions || '',
      status: purchaseOrder.status as any,
      items: parseItems(purchaseOrder.items),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')

  const handleLedgerSelect = (ledgerId: string) => {
    if (ledgerId && ledgerId !== 'custom') {
      const ledger = ledgers.find(l => l.ledger_id === ledgerId)
      setSelectedLedger(ledger || null)
      setValue('ledger_id', ledgerId)
      if (ledger) {
        setValue('supplier_name', ledger.business_name)
      }
    } else {
      setSelectedLedger(null)
      setValue('ledger_id', 'custom')
    }
  }

  const calculateItemTotal = (index: number) => {
    const quantity = items[index]?.quantity || 0
    const unitPrice = items[index]?.unit_price || 0
    const total = quantity * unitPrice
    setValue(`items.${index}.total_price`, total)
    return total
  }

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  }

  const onSubmit = async (data: PurchaseOrderEditFormData) => {
    setLoading(true)
    setError('')

    try {
      const totalAmount = calculateGrandTotal()

      const updatedPurchaseOrderData = {
        supplier_name: data.supplier_name,
        ledger_id: data.ledger_id === 'custom' ? null : data.ledger_id,
        po_date: data.po_date,
        delivery_date: data.delivery_date || null,
        description: data.description || null,
        terms_conditions: data.terms_conditions || null,
        status: data.status,
        items: data.items,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update(updatedPurchaseOrderData)
        .eq('id', purchaseOrder.id)

      if (updateError) {
        setError('Failed to update purchase order. Please try again.')
        return
      }

      router.push(`/dashboard/purchase/${purchaseOrder.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Error updating purchase order:', err)
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

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Information</CardTitle>
          <CardDescription>Update basic PO details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_date">PO Date *</Label>
              <Input
                id="po_date"
                type="date"
                {...register('po_date')}
              />
              {errors.po_date && (
                <p className="text-sm text-red-600">{errors.po_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Expected Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                {...register('delivery_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>Select supplier or enter custom supplier details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ledger_id">Select from Ledger (Optional)</Label>
            <Select value={watch('ledger_id')} onValueChange={handleLedgerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="-- Select Ledger or enter custom supplier --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Supplier</SelectItem>
                {ledgers.map((ledger) => (
                  <SelectItem key={ledger.ledger_id} value={ledger.ledger_id}>
                    <div>
                      <div className="font-medium">{ledger.business_name}</div>
                      <div className="text-sm text-gray-500">{ledger.ledger_id}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_name">Supplier Name *</Label>
            <Input
              id="supplier_name"
              {...register('supplier_name')}
              placeholder="Enter supplier name"
            />
            {errors.supplier_name && (
              <p className="text-sm text-red-600">{errors.supplier_name.message}</p>
            )}
          </div>

          {selectedLedger && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Supplier Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Business:</strong> {selectedLedger.business_name}</div>
                <div><strong>Contact:</strong> {selectedLedger.contact_person_name || 'N/A'}</div>
                <div><strong>Mobile:</strong> {selectedLedger.mobile_number || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedLedger.email || 'N/A'}</div>
                <div><strong>GST:</strong> {selectedLedger.gst_number || 'N/A'}</div>
                <div><strong>Address:</strong> {selectedLedger.address || 'N/A'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
          <CardDescription>Update items to be purchased</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg relative">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.item_name`}>Item Name *</Label>
                  <Input
                    {...register(`items.${index}.item_name`)}
                    placeholder="Enter item name"
                  />
                  {errors.items?.[index]?.item_name && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.item_name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>Quantity *</Label>
                  <Input
                    type="number"
                    {...register(`items.${index}.quantity`, { 
                      valueAsNumber: true,
                      onChange: () => setTimeout(() => calculateItemTotal(index), 0)
                    })}
                    placeholder="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.unit_price`}>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unit_price`, { 
                      valueAsNumber: true,
                      onChange: () => setTimeout(() => calculateItemTotal(index), 0)
                    })}
                    placeholder="0.00"
                  />
                  {errors.items?.[index]?.unit_price && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.unit_price?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.total_price`}>Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.total_price`, { valueAsNumber: true })}
                    placeholder="0.00"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Item description"
                  />
                </div>
              </div>

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div className="text-right">
              <div className="text-lg font-semibold">
                Grand Total: ₹{calculateGrandTotal().toFixed(2)}
              </div>
            </div>
          </div>

          {errors.items && (
            <p className="text-sm text-red-600">{errors.items.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Description and terms & conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter PO description or notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              {...register('terms_conditions')}
              placeholder="Enter terms and conditions"
              rows={4}
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
              Updating PO...
            </>
          ) : (
            'Update Purchase Order'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/purchase/${purchaseOrder.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
