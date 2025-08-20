'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Factory, Building2, Truck, Plus, Trash2 } from 'lucide-react'
import { Database, Json } from '@/types/database'
import { LedgerSelectModal } from './ledger-select-modal'

type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row'] & {
  delivery_at?: string | null;
  bill_no?: string | null;
  edit_logs?: string | null;
}
type Ledger = Database['public']['Tables']['ledgers']['Row']

const qualityDetailSchema = z.object({
  quality_name: z.string().min(1, 'Quality name is required'),
  rate: z.number().int('Quantity must be a whole number').min(0, 'Quantity must be non-negative'),
  grey_mtr: z.number().int('Rate must be a whole number').min(0, 'Rate must be non-negative'),
})

const takaDetailSchema = z.object({
  taka_number: z.string().min(1, 'Taka number is required'),
  meters: z.number().min(0.01, 'Meters must be greater than 0'),
});

const weaverChallanEditSchema = z.object({
  challan_date: z.string().min(1, 'Challan date is required'),
  ledger_id: z.string().optional(),
  total_grey_mtr: z.number().min(0.01, 'Total grey meters must be greater than 0'),
  fold_cm: z.number().optional(),
  width_inch: z.number().optional(),
  taka: z.number().min(1, 'Taka must be at least 1'),
  transport_name: z.string().optional(),
  lr_number: z.string().optional(),
  transport_charge: z.number().optional(),
  quality_details: z.array(qualityDetailSchema).min(1, 'At least one quality detail is required'),
  taka_details: z.array(takaDetailSchema).optional(),
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

  const parseDetails = (details: Json | null) => {
    if (!details) return [];
    try {
      return Array.isArray(details) ? details : JSON.parse(details as string);
    } catch {
      return [];
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<WeaverChallanEditFormData>({
    resolver: zodResolver(weaverChallanEditSchema),
    defaultValues: {
      challan_date: weaverChallan.challan_date,
      ledger_id: weaverChallan.ledger_id || '',
      total_grey_mtr: Number(weaverChallan.total_grey_mtr),
      fold_cm: weaverChallan.fold_cm ? Number(weaverChallan.fold_cm) : undefined,
      width_inch: weaverChallan.width_inch ? Number(weaverChallan.width_inch) : undefined,
      taka: weaverChallan.taka,
      transport_name: weaverChallan.transport_name || '',
      lr_number: weaverChallan.lr_number || '',
      transport_charge: weaverChallan.transport_charge ? Number(weaverChallan.transport_charge) : undefined,
      quality_details: parseDetails(weaverChallan.quality_details),
      taka_details: parseDetails(weaverChallan.taka_details),
    },
  })

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

  const calculateTotalGreyMtr = () => {
    const total = qualityDetails.reduce((sum, detail) => sum + (detail.grey_mtr || 0), 0)
    setValue('total_grey_mtr', total)
  }

  const handleLedgerSelect = (ledgerId: string) => {
    if (ledgerId && ledgerId !== 'none') {
      const ledger = ledgers.find(l => l.ledger_id === ledgerId)
      setSelectedLedger(ledger || null)
      setValue('ledger_id', ledgerId)
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
        ...data,
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
            <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleLedgerSelect}>
              <Button type="button" variant="outline" className="w-full justify-start">
                {selectedLedger ? selectedLedger.business_name : '-- Select Ledger --'}
              </Button>
            </LedgerSelectModal>
          </div>

        </CardContent>
      </Card>

    

      <Card>
        <CardHeader>
          <CardTitle>Quality Details</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2 mb-2">
              <Select
                onValueChange={(value) => setValue(`quality_details.${index}.quality_name`, value)}
                defaultValue={field.quality_name}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a quality" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
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
              <Input type="number" {...register(`quality_details.${index}.rate`, { valueAsNumber: true })} placeholder="Rate" />
              <Input type="number" {...register(`quality_details.${index}.grey_mtr`, { valueAsNumber: true, onChange: calculateTotalGreyMtr })} placeholder="Grey Mtr" />
              <Button type="button" variant="destructive" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* <Button type="button" onClick={() => append({ quality_name: '', rate: 0, grey_mtr: 0 })}>
            <Plus className="h-4 w-4 mr-2" /> Add Quality
          </Button> */}
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle>Production Specifications</CardTitle>
          <CardDescription>Update production measurements and specifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Taka Details</CardTitle>
        </CardHeader>
        <CardContent>
          {takaFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2 mb-2">
              <Input {...register(`taka_details.${index}.taka_number`)} placeholder="Taka Number" />
              <Input type="number" {...register(`taka_details.${index}.meters`, { valueAsNumber: true })} placeholder="Meters" />
              <Button type="button" variant="destructive" onClick={() => removeTaka(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => appendTaka({ taka_number: '', meters: 0 })}>
            <Plus className="h-4 w-4 mr-2" /> Add Taka
          </Button>
        </CardContent>
      </Card>

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
