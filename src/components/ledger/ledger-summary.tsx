'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from '@/components/ui/card'

interface LedgerSummaryProps {
  ledgerId: string
}

interface LedgerSummaryData {
  totalCredit: number
  totalDebit: number
  balance: number
}

export default function LedgerSummary({ ledgerId }: LedgerSummaryProps) {
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchLedgerSummary = async () => {
      try {
        setLoading(true)
        
        // Fetch weaver challans for this ledger
        const { data: challans, error: challanError } = await supabase
          .from('weaver_challans')
          .select('total_grey_mtr, quality_details')
          .eq('ledger_id', ledgerId)

        // Fetch payment vouchers for this ledger
        const { data: paymentVouchers, error: paymentVoucherError } = await supabase
          .from('payment_vouchers')
          .select('payment_type, amount')
          .eq('ledger_id', ledgerId)

        if (challanError || paymentVoucherError) {
          console.error('Error fetching ledger data:', challanError || paymentVoucherError)
          return
        }

        // Calculate total credit from challans
        let totalCredit = 0
        if (challans) {
          challans.forEach(challan => {
            const rate = challan.quality_details?.[0]?.rate || 0
            totalCredit += challan.total_grey_mtr * rate
          })
        }

        // Calculate total debit and additional credit from payment vouchers
        let totalDebit = 0
        if (paymentVouchers) {
          paymentVouchers.forEach(voucher => {
            if (voucher.payment_type === 'Credit') {
              totalCredit += voucher.amount
            } else if (voucher.payment_type === 'Debit') {
              totalDebit += voucher.amount
            }
          })
        }

        const balance = totalCredit - totalDebit

        setSummary({
          totalCredit,
          totalDebit,
          balance
        })
      } catch (error) {
        console.error('Error calculating ledger summary:', error)
      } finally {
        setLoading(false)
      }
    }

    if (ledgerId) {
      fetchLedgerSummary()
    }
  }, [ledgerId, supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-600">Total Credit</span>
            <span className="text-sm font-bold text-green-600">₹{summary.totalCredit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-600">Total Debit</span>
            <span className="text-sm font-bold text-red-600">₹{summary.totalDebit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-900">Balance</span>
            <span className="text-sm font-bold text-gray-900">₹{summary.balance.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
