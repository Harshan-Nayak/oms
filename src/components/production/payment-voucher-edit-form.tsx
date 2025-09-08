'use client'

import { useState, useMemo } from 'react'
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
import { Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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
    amount: paymentVoucher.amount.toString(),
    transaction_to_settle: '',
    sgst: 'Not Applicable',
    cgst: 'Not Applicable',
    igst: 'Not Applicable'
  })
// Define types for better type safety
type Transaction = {
  id: string;
  type: string;
  reference: string;
  date: string;
  amount: number;
  description: string;
};

type QualityDetail = {
  quality_name: string;
  rate?: number;
  grey_mtr?: number;
};

// ... existing code ...

  const [availableTransactions, setAvailableTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const handleLedgerSelect = (ledgerId: string) => {
    setFormData(prev => ({
      ...prev,
      ledger_id: ledgerId,
      transaction_to_settle: ''
    }))
    
    // Fetch available transactions when ledger is selected
    if (ledgerId) {
      fetchAvailableTransactions(ledgerId, formData.payment_type)
    } else {
      setAvailableTransactions([])
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // If payment type changes, reset transaction selection and reload transactions
    if (field === 'payment_type' && formData.ledger_id) {
      setFormData(prev => ({ ...prev, transaction_to_settle: '' }))
      fetchAvailableTransactions(formData.ledger_id, value)
    }
  }

  // Function to fetch available transactions for settlement
  const fetchAvailableTransactions = async (ledgerId: string, paymentType: string) => {
    setLoadingTransactions(true)
    try {
      const transactions: Transaction[] = []
      
      if (paymentType === 'Credit') {
        // For Credit payments, fetch Debit transactions (what the ledger owes)
        
        // Fetch weaver challans with vendor amounts (debit transactions)
        const { data: weaverChallans } = await supabase
          .from('weaver_challans')
          .select('id, challan_no, challan_date, vendor_amount, batch_number')
          .eq('vendor_ledger_id', ledgerId)
          .not('vendor_amount', 'is', null)
          .gt('vendor_amount', 0)
        
        if (weaverChallans) {
          transactions.push(...weaverChallans.map(challan => ({
            id: `weaver_${challan.id}`,
            type: 'Weaver Challan',
            reference: challan.challan_no,
            date: challan.challan_date,
            amount: challan.vendor_amount,
            description: `Batch: ${challan.batch_number}`
          })))
        }
        
        // Fetch stitching challans (debit transactions)
        const { data: stitchingChallans } = await supabase
          .from('isteaching_challans')
          .select('id, challan_no, date, transport_charge, quality, batch_number')
          .eq('ledger_id', ledgerId)
          .not('transport_charge', 'is', null)
          .gt('transport_charge', 0)
        
        if (stitchingChallans) {
          transactions.push(...stitchingChallans.map(challan => ({
            id: `stitching_${challan.id}`,
            type: 'Stitching Challan',
            reference: challan.challan_no,
            date: challan.date,
            amount: challan.transport_charge,
            description: `Quality: ${challan.quality}, Batch: ${Array.isArray(challan.batch_number) ? challan.batch_number.join(', ') : challan.batch_number}`
          })))
        }
        
      } else {
        // For Debit payments, fetch Credit transactions (what we owe to the ledger)
        
        // Fetch weaver challans as credit transactions (when ledger is the main party)
        const { data: weaverChallans } = await supabase
          .from('weaver_challans')
          .select('id, challan_no, challan_date, total_grey_mtr, batch_number, quality_details')
          .eq('ledger_id', ledgerId)
        
        if (weaverChallans) {
          transactions.push(...weaverChallans.map(challan => {
            const qualityName = Array.isArray(challan.quality_details) && 
                               challan.quality_details.length > 0 && 
                               challan.quality_details[0] && 
                               typeof challan.quality_details[0] === 'object' && 
                               'quality_name' in challan.quality_details[0]
              ? (challan.quality_details[0] as QualityDetail).quality_name
              : 'N/A'
              
            return {
              id: `weaver_${challan.id}`,
              type: 'Weaver Challan',
              reference: challan.challan_no,
              date: challan.challan_date,
              amount: challan.total_grey_mtr, // Using total_grey_mtr as reference amount
              description: `Batch: ${challan.batch_number}, Quality: ${qualityName}`
            }
          }))
        }
      }
      
      // Sort transactions by date (newest first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setAvailableTransactions(transactions)
      
    } catch (error) {
      console.error('Error fetching transactions:', error)
      showToast('Failed to fetch available transactions', 'error')
      setAvailableTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Calculate GST amounts and total
  const calculateGSTAndTotal = () => {
    const baseAmount = parseFloat(formData.amount) || 0
    
    const getGSTValue = (gstType: string) => {
      if (gstType === 'Not Applicable') return 0
      return parseFloat(gstType.replace('%', '')) / 100
    }
    
    const sgstAmount = baseAmount * getGSTValue(formData.sgst)
    const cgstAmount = baseAmount * getGSTValue(formData.cgst)
    const igstAmount = baseAmount * getGSTValue(formData.igst)
    
    const totalGST = sgstAmount + cgstAmount + igstAmount
    const totalAmount = baseAmount + totalGST
    
    return {
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalGST,
      totalAmount
    }
  }

  const gstCalculation = calculateGSTAndTotal()

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
          amount: gstCalculation.totalAmount, // Store the total amount including GST
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
                <Label htmlFor="transaction_to_settle">Select Transaction to Settle</Label>
                <Select 
                  value={formData.transaction_to_settle} 
                  onValueChange={(value) => handleChange('transaction_to_settle', value)}
                  disabled={!formData.ledger_id || loadingTransactions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.ledger_id 
                        ? "Select a ledger first" 
                        : loadingTransactions 
                          ? "Loading transactions..." 
                          : availableTransactions.length === 0
                            ? "No transactions available"
                            : "Select a transaction to settle"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-60">
                    {availableTransactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {transaction.type} - {transaction.reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(transaction.date)} | ₹{transaction.amount} | {transaction.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingTransactions && (
                  <p className="text-sm text-blue-600 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading available transactions...
                  </p>
                )}
                {!loadingTransactions && formData.ledger_id && availableTransactions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No {formData.payment_type === 'Credit' ? 'debit' : 'credit'} transactions found for settlement
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Without GST)</Label>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="sgst">SGST</Label>
                  <Select value={formData.sgst} onValueChange={(value) => handleChange('sgst', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      <SelectItem value="2.5%">2.5%</SelectItem>
                      <SelectItem value="5%">5%</SelectItem>
                      <SelectItem value="6%">6%</SelectItem>
                      <SelectItem value="9%">9%</SelectItem>
                      <SelectItem value="12%">12%</SelectItem>
                      <SelectItem value="18%">18%</SelectItem>
                    </SelectContent>
                  </Select>
                  {gstCalculation.sgstAmount > 0 && (
                    <p className="text-xs text-gray-500">₹{gstCalculation.sgstAmount.toFixed(2)}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cgst">CGST</Label>
                  <Select value={formData.cgst} onValueChange={(value) => handleChange('cgst', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      <SelectItem value="2.5%">2.5%</SelectItem>
                      <SelectItem value="5%">5%</SelectItem>
                      <SelectItem value="6%">6%</SelectItem>
                      <SelectItem value="9%">9%</SelectItem>
                      <SelectItem value="12%">12%</SelectItem>
                      <SelectItem value="18%">18%</SelectItem>
                    </SelectContent>
                  </Select>
                  {gstCalculation.cgstAmount > 0 && (
                    <p className="text-xs text-gray-500">₹{gstCalculation.cgstAmount.toFixed(2)}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="igst">IGST</Label>
                  <Select value={formData.igst} onValueChange={(value) => handleChange('igst', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      <SelectItem value="2.5%">2.5%</SelectItem>
                      <SelectItem value="5%">5%</SelectItem>
                      <SelectItem value="6%">6%</SelectItem>
                      <SelectItem value="9%">9%</SelectItem>
                      <SelectItem value="12%">12%</SelectItem>
                      <SelectItem value="18%">18%</SelectItem>
                    </SelectContent>
                  </Select>
                  {gstCalculation.igstAmount > 0 && (
                    <p className="text-xs text-gray-500">₹{gstCalculation.igstAmount.toFixed(2)}</p>
                  )}
                </div>
              </div>
              
              {(parseFloat(formData.amount) > 0 && gstCalculation.totalAmount > 0) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 md:col-span-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Base Amount:</p>
                      <p className="font-medium">₹{parseFloat(formData.amount || '0').toFixed(2)}</p>
                    </div>
                    {gstCalculation.totalGST > 0 && (
                      <div>
                        <p className="text-gray-600">Total GST:</p>
                        <p className="font-medium text-blue-600">₹{gstCalculation.totalGST.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-lg text-blue-700">₹{gstCalculation.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
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