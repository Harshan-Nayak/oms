'use client'

import { useState, useEffect } from 'react'
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
import { Loader2 } from 'lucide-react'
import { LedgerSelectModal } from './ledger-select-modal'
import { Database } from '@/types/database'
import { useToast } from '@/hooks/use-toast'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row']
type ShortingEntry = Database['public']['Tables']['shorting_entries']['Insert']

const shortingEntrySchema = z.object({
  ledger_id: z.string().min(1, 'Ledger selection is required'),
  weaver_challan_id: z.string().min(1, 'Weaver challan selection is required'),
  quality_name: z.string().min(1, 'Quality name is required'),
  shorting_qty: z.number().min(0.01, 'Shorting quantity must be greater than 0'),
})

type ShortingEntryFormData = z.infer<typeof shortingEntrySchema>

interface ShortingEntryFormProps {
  ledgers: Ledger[]
  userId: string
  userName: string
  onSuccess: () => void
}

export function ShortingEntryForm({ ledgers, userId, userName, onSuccess }: ShortingEntryFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [weaverChallans, setWeaverChallans] = useState<WeaverChallan[]>([])
  const [availableQty, setAvailableQty] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ShortingEntryFormData>({
    resolver: zodResolver(shortingEntrySchema),
  })

  const ledgerId = watch('ledger_id')
  const weaverChallanId = watch('weaver_challan_id')

  const handleLedgerSelect = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId)
    setSelectedLedger(ledger || null)
    setValue('ledger_id', ledgerId)
  }

  useEffect(() => {
    if (ledgerId) {
      const fetchWeaverChallans = async () => {
        // Get challan IDs that already have a shorting entry
        const { data: shortingEntries } = await supabase
          .from('shorting_entries')
          .select('weaver_challan_id')
          .not('weaver_challan_id', 'is', null);

        const usedChallanIds = shortingEntries ? shortingEntries.map(e => e.weaver_challan_id) : [];

        let query = supabase
          .from('weaver_challans')
          .select('*')
          .eq('ledger_id', ledgerId);

        if (usedChallanIds.length > 0) {
          query = query.not('id', 'in', `(${usedChallanIds.join(',')})`);
        }
        
        const { data } = await query;

        if (data) {
          setWeaverChallans(data);
        }
      };
      fetchWeaverChallans();
    }
  }, [ledgerId, supabase]);

  useEffect(() => {
    if (weaverChallanId) {
      const selectedChallan = weaverChallans.find(c => c.id === parseInt(weaverChallanId))
      if (selectedChallan && selectedChallan.quality_details && Array.isArray(selectedChallan.quality_details)) {
        const quality = selectedChallan.quality_details[0] as { quality_name: string; rate: number }
        setValue('quality_name', quality.quality_name)
        setAvailableQty(quality.rate)
      }
    }
  }, [weaverChallanId, weaverChallans, setValue])

  const onSubmit = async (data: ShortingEntryFormData) => {
    setLoading(true)
    setError('')

    if (data.shorting_qty >= availableQty) {
      setError(`Shorting quantity must be less than the available quantity of ${availableQty}.`)
      setLoading(false)
      return
    }

    try {
      const shortingData: ShortingEntry = {
        ledger_id: data.ledger_id,
        weaver_challan_id: parseInt(data.weaver_challan_id),
        quality_name: data.quality_name,
        shorting_qty: data.shorting_qty,
        weaver_challan_qty: availableQty, // Store the original quantity from weaver challan
        created_by: userId,
      }

      const { error: insertError } = await supabase
        .from('shorting_entries')
        .insert([shortingData])

      if (insertError) {
        setError('Failed to create shorting entry. Please try again.')
        showToast('Failed to create shorting entry.', 'error')
        return
      }

      showToast('Shorting entry created successfully!', 'success')
      reset()
      setSelectedLedger(null)
      setWeaverChallans([])
      setAvailableQty(0)
      onSuccess()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      showToast('An unexpected error occurred.', 'error')
      console.error('Error creating shorting entry:', err)
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
          <CardTitle>Shorting Entry Details</CardTitle>
          <CardDescription>Enter the details for the shorting entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Date</Label>
              <Input
                id="entry_date"
                type="date"
                value={new Date().toISOString().split('T')[0]}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger_id">Ledger</Label>
              <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleLedgerSelect}>
                <Button type="button" variant="outline" className="w-full justify-start">
                  {selectedLedger ? selectedLedger.business_name : '-- Select Ledger --'}
                </Button>
              </LedgerSelectModal>
              {errors.ledger_id && <p className="text-sm text-red-600">{errors.ledger_id.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weaver_challan_id">Weaver Challan</Label>
            <Select onValueChange={(value) => setValue('weaver_challan_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a weaver challan" />
              </SelectTrigger>
              <SelectContent className='bg-white' >
                {weaverChallans.map(challan => (
                  <SelectItem key={challan.id} value={challan.id.toString()}>
                    {challan.challan_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.weaver_challan_id && <p className="text-sm text-red-600">{errors.weaver_challan_id.message}</p>}
          </div>
          {weaverChallanId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quality_name">Cloth Type</Label>
                <Input
                  id="quality_name"
                  {...register('quality_name')}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>Available Quantity</Label>
                <p>{availableQty} mtr</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="shorting_qty">Shorting QTY (in mtr)</Label>
            <Input
              id="shorting_qty"
              type="number"
              step="0.01"
              {...register('shorting_qty', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.shorting_qty && <p className="text-sm text-red-600">{errors.shorting_qty.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Entry...
            </>
          ) : (
            'Create Shorting Entry'
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
