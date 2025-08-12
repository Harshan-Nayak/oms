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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Factory, Building2, Truck } from 'lucide-react'
import { Database } from '@/types/database'

type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row']
type Ledger = Database['public']['Tables']['ledgers']['Row']

const weaverChallanEditSchema = z.object({
  challan_date: z.string().min(1, 'Challan date is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  challan_no: z.string().min(1, 'Challan number is required'),
  ms_party_name: z.string().min(1, 'MS party name is required'),
  ledger_id: z.string().optional(),
  delivery_at: z.string().optional(),
  bill_no: z.string().optional(),
  total_grey_mtr: z.number().min(0.01, 'Total grey meters must be greater than 0'),
  fold_cm: z.number().optional(),
  width_inch: z.number().optional(),
  taka: z.number().min(1, 'Taka must be at least 1'),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().optional(),
})

type WeaverChallanEditFormData = z.infer<typeof weaverChallanEditSchema>

interface WeaverChallanEditFormProps {
  weaverChallan: WeaverChallan
  ledgers: Ledger[]
  userId: string
  userName: string
}

export function WeaverChallanEditForm({ weaverChallan, ledgers, userId, userName }: WeaverChallanEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(
    ledgers.find(l => l.ledger_id === weaverChallan.ledger_id) || null
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WeaverChallanEditFormData>({
    resolver: zodResolver(weaverChallanEditSchema),
    defaultValues: {
      challan_date: weaverChallan.challan_date,
      batch_number: weaverChallan.batch_number,
      challan_no: weaverChallan.challan_no,
      ms_party_name: weaverChallan.ms_party_name,
      ledger_id: weaverChallan.ledger_id || '',
      delivery_at: weaverChallan.delivery_at || '',
      bill_no: weaverChallan.bill_no || '',
      total_grey_mtr: Number(weaverChallan.total_grey_mtr),
      fold_cm: weaverChallan.fold_cm ? Number(weaverChallan.fold_cm) : undefined,
      width_inch: weaverChallan.width_inch ? Number(weaverChallan.width_inch) : undefined,
      taka: weaverChallan.taka,
      transport_name: weaverChallan.transport_name || '',
      lr_number: weaverChallan.lr_number || '',
      transport_charge: weaverChallan.transport_charge ? Number(weaverChallan.transport_charge) : undefined,
    },
  })

  const handleLedgerSelect = (ledgerId: string) => {
    if (ledgerId && ledgerId !== 'none') {
      const ledger = ledgers.find(l => l.ledger_id === ledgerId)
      setSelectedLedger(ledger || null)
      setValue('ledger_id', ledgerId)
      if (ledger) {
        setValue('ms_party_name', ledger.business_name)
      }
    } else {
      setSelectedLedger(null)
      setValue('ledger_id', '')
    }
  }

  const onSubmit = async (data: WeaverChallanEditFormData) => {
    setLoading(true)
    setError('')

    try {
      const updatedWeaverChallanData = {
        challan_date: data.challan_date,
        batch_number: data.batch_number,
        challan_no: data.challan_no,
        ms_party_name: data.ms_party_name,
        ledger_id: data.ledger_id || null,
        delivery_at: data.delivery_at || null,
        bill_no: data.bill_no || null,
        total_grey_mtr: data.total_grey_mtr,
        fold_cm: data.fold_cm || null,
        width_inch: data.width_inch || null,
        taka: data.taka,
        transport_name: data.transport_name || null,
        lr_number: data.lr_number || null,
        transport_charge: data.transport_charge || null,
        updated_at: new Date().toISOString(),
        edit_logs: weaverChallan.edit_logs ? 
          `${weaverChallan.edit_logs}\n${new Date().toISOString()}: Updated by ${userName}` :
          `${new Date().toISOString()}: Updated by ${userName}`
      }

      const { error: updateError } = await supabase
        .from('weaver_challans')
        .update(updatedWeaverChallanData)
        .eq('id', weaverChallan.id)

      if (updateError) {
        setError('Failed to update weaver challan. Please try again.')
        return
      }

      router.push(`/dashboard/production/weaver-challan/${weaverChallan.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Error updating weaver challan:', err)
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
          <CardTitle className="flex items-center">
            <Factory className="h-5 w-5 mr-2" />
            Challan Information
          </CardTitle>
          <CardDescription>Update basic challan details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challan_date">Challan Date *</Label>
              <Input
                id="challan_date"
                type="date"
                {...register('challan_date')}
              />
              {errors.challan_date && (
                <p className="text-sm text-red-600">{errors.challan_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                {...register('batch_number')}
                placeholder="Enter batch number"
              />
              {errors.batch_number && (
                <p className="text-sm text-red-600">{errors.batch_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="challan_no">Challan Number *</Label>
              <Input
                id="challan_no"
                {...register('challan_no')}
                placeholder="Enter challan number"
              />
              {errors.challan_no && (
                <p className="text-sm text-red-600">{errors.challan_no.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_at">Delivery Location</Label>
              <Input
                id="delivery_at"
                {...register('delivery_at')}
                placeholder="Enter delivery location"
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

      {/* Party Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Party Information
          </CardTitle>
          <CardDescription>Select party from ledger or enter custom party details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ledger_id">Select from Ledger (Optional)</Label>
            <Select value={watch('ledger_id')} onValueChange={handleLedgerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="-- Select Ledger or enter custom party --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Custom Party</SelectItem>
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
            <Label htmlFor="ms_party_name">MS Party Name *</Label>
            <Input
              id="ms_party_name"
              {...register('ms_party_name')}
              placeholder="Enter party name"
            />
            {errors.ms_party_name && (
              <p className="text-sm text-red-600">{errors.ms_party_name.message}</p>
            )}
          </div>

          {selectedLedger && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Party Details</h4>
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

      {/* Production Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Production Specifications</CardTitle>
          <CardDescription>Update production measurements and specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_grey_mtr">Total Grey Meters *</Label>
              <Input
                id="total_grey_mtr"
                type="number"
                step="0.01"
                {...register('total_grey_mtr', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.total_grey_mtr && (
                <p className="text-sm text-red-600">{errors.total_grey_mtr.message}</p>
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
              <Label htmlFor="width_inch">Width (Inches)</Label>
              <Input
                id="width_inch"
                type="number"
                step="0.01"
                {...register('width_inch', { valueAsNumber: true })}
                placeholder="0.00"
              />
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
          </div>
        </CardContent>
      </Card>

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Transport Details
          </CardTitle>
          <CardDescription>Update transport and logistics information (optional)</CardDescription>
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
              Updating Challan...
            </>
          ) : (
            'Update Weaver Challan'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/production/weaver-challan/${weaverChallan.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
