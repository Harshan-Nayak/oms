'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { LedgerSelectModal } from '@/components/production/ledger-select-modal'
import Image from 'next/image'

type PaymentVoucher = Database['public']['Tables']['payment_vouchers']['Row']
type Ledger = Database['public']['Tables']['ledgers']['Row']

interface PaymentVoucherEditFormProps {
  paymentVoucher: PaymentVoucher
  ledgers: Ledger[]
  userId: string
}

export function PaymentVoucherEditForm({ 
  paymentVoucher, 
  ledgers, 
  userId 
}: PaymentVoucherEditFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: paymentVoucher.date,
    ledger_id: paymentVoucher.ledger_id || '',
    payment_for: paymentVoucher.payment_for,
    payment_type: paymentVoucher.payment_type,
    amount: paymentVoucher.amount.toString()
  })

  const handleLedgerSelect = (ledgerId: string) => {
    setFormData(prev => ({
      ...prev,
      ledger_id: ledgerId
    }))
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.ledger_id) {
      showToast('Please select a ledger', 'error')
      return false
    }
    
    if (!formData.payment_for.trim()) {
      showToast('Please enter payment for details', 'error')
      return false
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('payment_vouchers')
        .update({
          date: formData.date,
          ledger_id: formData.ledger_id,
          payment_for: formData.payment_for,
          payment_type: formData.payment_type,
          amount: parseFloat(formData.amount),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentVoucher.id)
      
      if (error) throw error
      
      showToast('Payment voucher updated successfully', 'success')
      router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating payment voucher:', error)
      showToast('Failed to update payment voucher. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Find selected ledger for display
  const selectedLedger = ledgers.find(ledger => ledger.ledger_id === formData.ledger_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Payment Voucher</h1>
          <p className="text-gray-600 mt-1">
            Update payment voucher details
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}`)}
        >
          Back to Details
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Payment Voucher</CardTitle>
          <CardDescription>Update the details below to modify this payment voucher</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500">Date cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ledger_id">Select Ledger</Label>
                <LedgerSelectModal 
                  ledgers={ledgers} 
                  onLedgerSelect={handleLedgerSelect}
                >
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    type="button"
                  >
                    {selectedLedger ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex items-center justify-center">
                          {selectedLedger.business_logo ? (
                            <Image
                              src={selectedLedger.business_logo}
                              alt={selectedLedger.business_name}
                              width={24}
                              height={24}
                              className="rounded object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-600">
                              {selectedLedger.business_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span>{selectedLedger.business_name}</span>
                      </div>
                    ) : (
                      <span>Select a ledger</span>
                    )}
                  </Button>
                </LedgerSelectModal>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payment_for">Payment For</Label>
                <Input
                  id="payment_for"
                  value={formData.payment_for}
                  onChange={(e) => handleChange('payment_for', e.target.value)}
                  placeholder="Enter payment details"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <Select value={formData.payment_type} onValueChange={(value) => handleChange('payment_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500">Enter amount with up to 2 decimal places</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}`)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Payment Voucher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}