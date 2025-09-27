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
import { Checkbox } from '@/components/ui/checkbox'
import { LedgerSelectModal } from './ledger-select-modal'
import { Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { Database } from '@/types/database'
import { generateBatchNumber, generateChallanNumber } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type WeaverChallan = Database['public']['Tables']['weaver_challans']['Insert']
type GSTPercentage = '2.5%' | '5%' | '6%' | '9%' | '12%' | '18%' | 'Not Applicable'

const qualityDetailSchema = z.object({
  quality_name: z.string().min(1, 'Quality name is required'),
  rate: z.number().min(0, 'Quantity must be non-negative'),
  grey_mtr: z.number().min(0, 'Rate must be non-negative'),
})

const takaDetailSchema = z.object({
  taka_number: z.string().optional(),
  meters: z.number().min(0.01, 'Meters must be greater than 0'),
});

const weaverChallanSchema = z.object({
  challan_date: z.string().min(1, 'Challan date is required'),
  ledger_id: z.string().min(1, 'Ledger selection is required'),
  total_grey_mtr: z.number().min(0.01, 'Total grey meter must be greater than 0'),
  fold_cm: z.number().min(0).optional(),
  width_inch: z.number().min(0).optional(),
  taka: z.number().min(1, 'Taka must be at least 1'),
  hasTakaNumber: z.boolean().optional(),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().min(0).optional(),
  quality_details: z.array(qualityDetailSchema).min(1, 'At least one quality detail is required'),
  taka_details: z.array(takaDetailSchema).optional(),
  vendor_ledger_id: z.string().optional(),
  vendor_invoice_number: z.string().optional(),
  vendor_amount: z.number().min(0).optional(),
  sgst: z.enum(['2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable']).optional(),
  cgst: z.enum(['2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable']).optional(),
  igst: z.enum(['2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable']).optional(),
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
  address: 'A 606,SARTHAK FLORA,AMARJAVAN CIRLCE, AHEMDABAD, GUJARAT - 24',
  mobile: '+91 96623 50960',
  gst: '24CFIPB8013H1ZT',
}

export function WeaverChallanForm({ ledgers, userId, userName, onSuccess }: WeaverChallanFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [selectedVendorLedger, setSelectedVendorLedger] = useState<Ledger | null>(null)

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
      total_grey_mtr: 0,
      fold_cm: 0,
      width_inch: 0,
      taka: 0,
      hasTakaNumber: false,
      transport_name: '',
      lr_number: '',
      transport_charge: 0,
      quality_details: [{ quality_name: '', rate: 0, grey_mtr: 0 }],
      taka_details: [],
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

  const { fields: takaFields, append: appendTaka, remove: removeTaka } = useFieldArray({
    control,
    name: 'taka_details',
  });

  const qualityDetails = watch('quality_details')
  const takaValue = watch('taka');
  const vendorAmount = watch('vendor_amount')
  const sgst = watch('sgst')
  const cgst = watch('cgst')
  const igst = watch('igst')
  const hasTakaNumber = watch('hasTakaNumber') || false;

  // GST Calculation Logic
  const calculateGSTAmount = (percentage: string | undefined, baseAmount: number) => {
    if (!percentage || percentage === 'Not Applicable') return 0
    const rate = parseFloat(percentage.replace('%', '')) / 100
    return baseAmount * rate
  }

  const gstCalculation = {
    baseAmount: vendorAmount || 0,
    sgstAmount: calculateGSTAmount(sgst, vendorAmount || 0),
    cgstAmount: calculateGSTAmount(cgst, vendorAmount || 0),
    igstAmount: calculateGSTAmount(igst, vendorAmount || 0),
    totalGST: calculateGSTAmount(sgst, vendorAmount || 0) + calculateGSTAmount(cgst, vendorAmount || 0) + calculateGSTAmount(igst, vendorAmount || 0),
    totalAmount: (vendorAmount || 0) + calculateGSTAmount(sgst, vendorAmount || 0) + calculateGSTAmount(cgst, vendorAmount || 0) + calculateGSTAmount(igst, vendorAmount || 0)
  }

  // Auto-calculate total grey meter from quality details
  const calculateTotalGreyMtr = () => {
    const total = qualityDetails.reduce((sum, detail) => sum + (detail.grey_mtr || 0), 0)
    setValue('total_grey_mtr', total)
  }

  const handleLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedLedger(ledger || null)
    setValue('ledger_id', ledgerId)
  }

  const handleVendorLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedVendorLedger(ledger || null)
    setValue('vendor_ledger_id', ledgerId)
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

      // Extract hasTakaNumber and use the rest of the data
      const { hasTakaNumber, ...restData } = data;

      const challanData: WeaverChallan = {
        challan_date: restData.challan_date,
        batch_number: batchNumber,
        challan_no: challanNumber,
        ms_party_name: selectedLedger?.business_name || '',
        ledger_id: restData.ledger_id,
        total_grey_mtr: restData.total_grey_mtr,
        fold_cm: restData.fold_cm || null,
        width_inch: restData.width_inch || null,
        taka: restData.taka,
        taka_details: restData.taka_details,
        transport_name: restData.transport_name || null,
        lr_number: restData.lr_number || null,
        transport_charge: restData.transport_charge || null,
        quality_details: restData.quality_details,
        created_by: userId,
        vendor_ledger_id: restData.vendor_ledger_id || null,
        vendor_invoice_number: restData.vendor_invoice_number || null,
        vendor_amount: restData.vendor_amount || null,
        sgst: restData.sgst || null,
        cgst: restData.cgst || null,
        igst: restData.igst || null,
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

          <div className="space-y-2">
            <Label htmlFor="vendor_ledger_id">Select Vendor Ledger</Label>
            <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleVendorLedgerSelect}>
              <Button type="button" variant="outline" className="w-full justify-start">
                {selectedVendorLedger ? selectedVendorLedger.business_name : '-- Select Vendor Ledger --'}
              </Button>
            </LedgerSelectModal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_invoice_number">Invoice/Challan Number (Vendor)</Label>
              <Input
                id="vendor_invoice_number"
                {...register('vendor_invoice_number')}
                placeholder="Enter invoice/challan number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_amount">Amount (Without GST)</Label>
              <Input
                id="vendor_amount"
                type="number"
                step="0.01"
                {...register('vendor_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* GST Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sgst">SGST</Label>
<Select onValueChange={(value) => setValue('sgst', value as GSTPercentage)} defaultValue="Not Applicable">
                <SelectTrigger>
                  <SelectValue placeholder="Select SGST" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cgst">CGST</Label>
<Select onValueChange={(value) => setValue('cgst', value as GSTPercentage)} defaultValue="Not Applicable">
                <SelectTrigger>
                  <SelectValue placeholder="Select CGST" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="igst">IGST</Label>
<Select onValueChange={(value) => setValue('igst', value as GSTPercentage)} defaultValue="Not Applicable">
                <SelectTrigger>
                  <SelectValue placeholder="Select IGST" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GST Calculation Display */}
          {vendorAmount && vendorAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">GST Calculation Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Amount (Without GST):</p>
                  <p className="font-medium text-gray-800">₹{gstCalculation.baseAmount.toFixed(2)}</p>
                </div>
                {gstCalculation.sgstAmount > 0 && (
                  <div>
                    <p className="text-gray-600">SGST ({sgst}):</p>
                    <p className="font-medium text-green-600">₹{gstCalculation.sgstAmount.toFixed(2)}</p>
                  </div>
                )}
                {gstCalculation.cgstAmount > 0 && (
                  <div>
                    <p className="text-gray-600">CGST ({cgst}):</p>
                    <p className="font-medium text-green-600">₹{gstCalculation.cgstAmount.toFixed(2)}</p>
                  </div>
                )}
                {gstCalculation.igstAmount > 0 && (
                  <div>
                    <p className="text-gray-600">IGST ({igst}):</p>
                    <p className="font-medium text-green-600">₹{gstCalculation.igstAmount.toFixed(2)}</p>
                  </div>
                )}
                {gstCalculation.totalGST > 0 && (
                  <div>
                    <p className="text-gray-600">Total GST:</p>
                    <p className="font-medium text-blue-600">₹{gstCalculation.totalGST.toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Amount (After GST):</span>
                  <span className="font-bold text-lg text-blue-700">₹{gstCalculation.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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
                  <Label htmlFor={`quality_details.${index}.quality_name`}>Select Quality *</Label>
                  <Select
                    onValueChange={(value) => setValue(`quality_details.${index}.quality_name`, value)}
                    defaultValue={field.quality_name}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quality" />
                    </SelectTrigger>
                    <SelectContent className='bg-white' >
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Linen">Linen</SelectItem>
                      <SelectItem value="Silk">Silk</SelectItem>
                      <SelectItem value="Wool">Wool</SelectItem>
                      <SelectItem value="Cashmere">Cashmere</SelectItem>
                      <SelectItem value="Hemp">Hemp</SelectItem>
                      <SelectItem value="Polyester">Polyester</SelectItem>
                      <SelectItem value="Nylon">Nylon</SelectItem>
                      <SelectItem value="Rayon">Rayon</SelectItem>
                      <SelectItem value="Lycra">Lycra</SelectItem>
                      <SelectItem value="Acrylic">Acrylic</SelectItem>
                      <SelectItem value="Chiffon">Chiffon</SelectItem>
                      <SelectItem value="Georgette">Georgette</SelectItem>
                      <SelectItem value="Organza">Organza</SelectItem>
                      <SelectItem value="Tulle">Tulle</SelectItem>
                      <SelectItem value="Satin">Satin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.quality_details?.[index]?.quality_name && (
                    <p className="text-sm text-red-600">
                      {errors.quality_details[index]?.quality_name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quality_details.${index}.rate`}>Quantity(in mtr) *</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    {...register(`quality_details.${index}.rate`, { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.quality_details?.[index]?.rate && (
                    <p className="text-sm text-red-600">
                      {errors.quality_details[index]?.rate?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quality_details.${index}.grey_mtr`}>Rate per mtr *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`quality_details.${index}.grey_mtr`, { 
                      valueAsNumber: true,
                      onChange: calculateTotalGreyMtr
                    })}
                    placeholder="0"
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

          {/* <Button
            type="button"
            variant="outline"
            onClick={() => append({ quality_name: '', rate: 0, grey_mtr: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Quality
          </Button> */}

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Taka Details */}
      <Card>
        <CardHeader>
          <CardTitle>Taka Details</CardTitle>
          <CardDescription>Enter details for each taka.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="hasTakaNumber"
              checked={watch('hasTakaNumber')}
              onCheckedChange={(checked) => setValue('hasTakaNumber', Boolean(checked))}
            />
            <Label htmlFor="hasTakaNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have Taka Number
            </Label>
          </div>
          <div className="space-y-2">
            {takaFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <span className="font-medium">{index + 1}.</span>
                {hasTakaNumber && (
                  <Input
                    {...register(`taka_details.${index}.taka_number`)}
                    placeholder="Taka Number"
                    className="w-1/3"
                  />
                )}
                <Input
                  type="number"
                  step="0.01"
                  {...register(`taka_details.${index}.meters`, { valueAsNumber: true })}
                  placeholder="Meters in this taka"
                  className={hasTakaNumber ? "w-1/3" : "w-1/2"}
                />
                <Button type="button" variant="destructive" size="icon" onClick={() => removeTaka(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendTaka({ taka_number: '', meters: 0 })}
            disabled={!takaValue || takaFields.length >= takaValue}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          {errors.taka_details && (
            <p className="text-sm text-red-600">{errors.taka_details.message}</p>
          )}
          {takaValue > 0 && takaFields.length >= takaValue && (
            <p className="text-sm text-yellow-600 mt-2">
              You have reached the maximum number of entries based on the Taka value.
            </p>
          )}
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



