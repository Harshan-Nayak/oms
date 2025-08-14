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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LedgerSelectModal } from './ledger-select-modal'
import { Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { Database } from '@/types/database'
import { generateBatchNumber, generateChallanNumber } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type WeaverChallan = Database['public']['Tables']['weaver_challans']['Insert']

const qualityDetailSchema = z.object({
  quality_name: z.string().min(1, 'Quality name is required'),
  rate: z.number().min(0, 'Rate must be positive'),
  grey_mtr: z.number().min(0, 'Grey meter must be positive'),
})

const weaverChallanSchema = z.object({
  challan_date: z.string().min(1, 'Challan date is required'),
  ledger_id: z.string().min(1, 'Ledger selection is required'),
  delivery_at: z.string().optional(),
  bill_no: z.string().optional(),
  total_grey_mtr: z.number().min(0.01, 'Total grey meter must be greater than 0'),
  fold_cm: z.number().min(0).optional(),
  width_inch: z.number().min(0).optional(),
  taka: z.number().min(1, 'Taka must be at least 1'),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().min(0).optional(),
  quality_details: z.array(qualityDetailSchema).min(1, 'At least one quality detail is required'),
})

type WeaverChallanFormData = z.infer<typeof weaverChallanSchema>

interface WeaverChallanFormProps {
  ledgers: Ledger[]
  userId: string
  userName: string
  onSuccess: () => void
}

// Hardcoded Bhaktinandan Details
const bhaktinandanDetails = {
  name: 'BHAKTINANDAN',
  address: '123 High Street, Nikol, Ahmedabad, Gujarat - 302545',
  mobile: '+91 96623 50960',
  gst: '23ABCD8965WE12QW',
}

export function WeaverChallanForm({ ledgers, userId, userName, onSuccess }: WeaverChallanFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<WeaverChallanFormData>({
    resolver: zodResolver(weaverChallanSchema),
    defaultValues: {
      challan_date: '', // Set by useEffect
      ledger_id: '',
      delivery_at: '',
      bill_no: '',
      total_grey_mtr: 0,
      fold_cm: 0,
      width_inch: 0,
      taka: 0,
      transport_name: '',
      lr_number: '',
      transport_charge: 0,
      quality_details: [{ quality_name: '', rate: 0, grey_mtr: 0 }],
    },
  })

  useEffect(() => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Kolkata',
    }
    // Using 'sv-SE' locale formats the date as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('sv-SE', options)
    setValue('challan_date', formatter.format(today))
  }, [setValue])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'quality_details',
  })

  const qualityDetails = watch('quality_details')

  // Auto-calculate total grey meter from quality details
  const calculateTotalGreyMtr = () => {
    const total = qualityDetails.reduce((sum, detail) => sum + (detail.grey_mtr || 0), 0)
    setValue('total_grey_mtr', total)
  }

  const handleLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedLedger(ledger || null)
    setValue('ledger_id', ledgerId)
    if (ledger) {
      setValue('delivery_at', `${ledger.city || ''}, ${ledger.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''))
    }
  }

  const generateNumbers = async () => {
    try {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      
      // Generate batch number
      const batchPrefix = `BN${dateStr}`
      const { data: lastBatch } = await supabase
        .from('weaver_challans')
        .select('batch_number')
        .like('batch_number', `${batchPrefix}%`)
        .order('id', { ascending: false })
        .limit(1)

      let batchSuffix = '001'
      if (lastBatch && lastBatch.length > 0) {
        const lastNumber = lastBatch[0].batch_number.slice(-3)
        batchSuffix = String(parseInt(lastNumber) + 1).padStart(3, '0')
      }
      const batchNumber = batchPrefix + batchSuffix

      // Generate challan number
      const challanPrefix = `BNG-CH-${dateStr}-`
      const { data: lastChallan } = await supabase
        .from('weaver_challans')
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

      return { batchNumber, challanNumber }
    } catch (error) {
      console.error('Error generating numbers:', error)
      // Fallback to timestamp-based generation
      const timestamp = Date.now().toString().slice(-6)
      return {
        batchNumber: `BN${new Date().toISOString().split('T')[0].replace(/-/g, '')}${timestamp.slice(-3)}`,
        challanNumber: `BNG-CH-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${timestamp.slice(-3)}`
      }
    }
  }

  const onSubmit = async (data: WeaverChallanFormData) => {
    setLoading(true)
    setError('')

    try {
      const { batchNumber, challanNumber } = await generateNumbers()

      const challanData: WeaverChallan = {
        challan_date: data.challan_date,
        batch_number: batchNumber,
        challan_no: challanNumber,
        ms_party_name: selectedLedger?.business_name || '',
        ledger_id: data.ledger_id,
        delivery_at: data.delivery_at || null,
        bill_no: data.bill_no || null,
        total_grey_mtr: data.total_grey_mtr,
        fold_cm: data.fold_cm || null,
        width_inch: data.width_inch || null,
        taka: data.taka,
        transport_name: data.transport_name || null,
        lr_number: data.lr_number || null,
        transport_charge: data.transport_charge || null,
        quality_details: data.quality_details,
        created_by: userId,
      }

      const { error: insertError } = await supabase
        .from('weaver_challans')
        .insert([challanData])

      if (insertError) {
        setError('Failed to create weaver challan. Please try again.')
        showToast('Failed to create weaver challan.', 'error')
        return
      }

      showToast('Weaver challan created successfully!', 'success')
      onSuccess()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      showToast('An unexpected error occurred.', 'error')
      console.error('Error creating weaver challan:', err)
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

      {/* Bhaktinandan Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Company Details
          </CardTitle>
          <CardDescription>Bhaktinandan company information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">{bhaktinandanDetails.name}</h3>
            <p className="text-blue-700 text-sm">{bhaktinandanDetails.address}</p>
            <p className="text-blue-700 text-sm">Mobile: {bhaktinandanDetails.mobile}</p>
            <p className="text-blue-700 text-sm">GST: {bhaktinandanDetails.gst}</p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter challan basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challan_date">Challan Date *</Label>
              <Input
                id="challan_date"
                type="date"
                {...register('challan_date')}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
              {errors.challan_date && (
                <p className="text-sm text-red-600">{errors.challan_date.message}</p>
              )}
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="ledger_id">Select Ledger *</Label>
            <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleLedgerSelect}>
              <Button type="button" variant="outline" className="w-full justify-start">
                {selectedLedger ? selectedLedger.business_name : '-- Select Ledger --'}
              </Button>
            </LedgerSelectModal>
            {errors.ledger_id && (
              <p className="text-sm text-red-600">{errors.ledger_id.message}</p>
            )}
          </div>

          {selectedLedger && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Ledger Details</h4>
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

      {/* Quality Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Details</CardTitle>
          <CardDescription>Add quality specifications for the production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`quality_details.${index}.quality_name`}>Quality Name *</Label>
                  <Input
                    {...register(`quality_details.${index}.quality_name`)}
                    placeholder="Enter quality name"
                  />
                  {errors.quality_details?.[index]?.quality_name && (
                    <p className="text-sm text-red-600">
                      {errors.quality_details[index]?.quality_name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quality_details.${index}.rate`}>Rate *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`quality_details.${index}.rate`, { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.quality_details?.[index]?.rate && (
                    <p className="text-sm text-red-600">
                      {errors.quality_details[index]?.rate?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quality_details.${index}.grey_mtr`}>Grey Mtr *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`quality_details.${index}.grey_mtr`, { 
                      valueAsNumber: true,
                      onChange: calculateTotalGreyMtr
                    })}
                    placeholder="0.00"
                  />
                  {errors.quality_details?.[index]?.grey_mtr && (
                    <p className="text-sm text-red-600">
                      {errors.quality_details[index]?.grey_mtr?.message}
                    </p>
                  )}
                </div>
              </div>

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    remove(index)
                    setTimeout(calculateTotalGreyMtr, 0)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ quality_name: '', rate: 0, grey_mtr: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Quality
          </Button>

          {errors.quality_details && (
            <p className="text-sm text-red-600">{errors.quality_details.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Production Details */}
      <Card>
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
          <CardDescription>Enter production specifications and measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_grey_mtr">Total Grey Mtr *</Label>
              <Input
                id="total_grey_mtr"
                type="number"
                step="0.01"
                {...register('total_grey_mtr', { valueAsNumber: true })}
                placeholder="0.00"
                readOnly
                className="bg-gray-50"
              />
              {errors.total_grey_mtr && (
                <p className="text-sm text-red-600">{errors.total_grey_mtr.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taka">Taka *</Label>
              <Input
                id="taka"
                type="number"
                {...register('taka', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.taka && (
                <p className="text-sm text-red-600">{errors.taka.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fold_cm">Fold (CM)</Label>
              <Input
                id="fold_cm"
                type="number"
                step="0.01"
                {...register('fold_cm', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width_inch">Width (Inch)</Label>
              <Input
                id="width_inch"
                type="number"
                step="0.01"
                {...register('width_inch', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_at">Delivery At</Label>
              <Input
                id="delivery_at"
                {...register('delivery_at')}
                placeholder="Delivery location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bill_no">Bill Number</Label>
              <Input
                id="bill_no"
                {...register('bill_no')}
                placeholder="Enter bill number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transport Details</CardTitle>
          <CardDescription>Enter transport and logistics information (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="0.00"
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
              Creating Challan...
            </>
          ) : (
            'Create Weaver Challan'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
