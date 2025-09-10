"use client"

import { Tables, Json } from '@/types/database'
import { formatDate, formatDateDateOnly } from '@/lib/utils'
import { useEffect, useState } from 'react'

type Ledger = Tables<'ledgers'>
type WeaverChallan = Tables<'weaver_challans'>
type PaymentVoucher = Tables<'payment_vouchers'>

interface LedgerData {
  ledger: Ledger
  challans: Pick<WeaverChallan, 'challan_no' | 'challan_date' | 'transport_charge' | 'vendor_amount' | 'sgst' | 'cgst' | 'igst'>[]
  paymentVouchers: Pick<PaymentVoucher, 'id' | 'date' | 'payment_for' | 'payment_type' | 'amount'>[]
}

interface Transaction {
  date: string
  detail: string
  remark: string
 credit: number
 debit: number
 balance: number
}

export default function PrintLedgerClient({ ledgerData }: { ledgerData: LedgerData }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 })

  useEffect(() => {
    // Process transactions
    const processTransactions = () => {
      let allTransactions: Omit<Transaction, 'balance'>[] = []

      // Process challans - now using transport_charge + vendor_amount (including GST)
      const challanTransactions = ledgerData.challans.map(c => {
        // Calculate GST amounts based on vendor_amount
        const calculateGSTAmount = (percentage: string | undefined | null, baseAmount: number) => {
          if (!percentage || percentage === 'Not Applicable') return 0;
          const rate = parseFloat(percentage.replace('%', '')) / 100;
          return baseAmount * rate;
        };
        
        // Use vendor_amount as the base amount for GST calculation
        const baseAmount = c.vendor_amount || 0;
        const sgstAmount = calculateGSTAmount(c.sgst, baseAmount);
        const cgstAmount = calculateGSTAmount(c.cgst, baseAmount);
        const igstAmount = calculateGSTAmount(c.igst, baseAmount);
        const vendorAmountWithGST = baseAmount + sgstAmount + cgstAmount + igstAmount;
        const transportCharge = c.transport_charge || 0;
        const totalCredit = transportCharge + vendorAmountWithGST;
        
        return {
          date: c.challan_date,
          detail: 'Weaver Challan',
          remark: c.challan_no,
          credit: totalCredit,
          debit: 0,
        }
      })

      // Process payment vouchers
      const sortedVouchers = [...ledgerData.paymentVouchers].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      let creditCounter = 1
      let debitCounter = 1
      const voucherSequenceMap = new Map<number, number>()
      
      sortedVouchers.forEach(voucher => {
        if (voucher.payment_type === 'Credit') {
          voucherSequenceMap.set(voucher.id, creditCounter++)
        } else {
          voucherSequenceMap.set(voucher.id, debitCounter++)
        }
      })

      const paymentVoucherTransactions = ledgerData.paymentVouchers.map(pv => {
        const date = new Date(pv.date)
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const sequenceId = voucherSequenceMap.get(pv.id) || 0
        const paddedId = sequenceId.toString().padStart(3, '0')
        const type = pv.payment_type === 'Credit' ? 'C' : 'D'
        const remark = `VCH-${type}-${year}${month}${paddedId}`

        return {
          date: pv.date,
          detail: pv.payment_for,
          remark: remark,
          credit: pv.payment_type === 'Credit' ? pv.amount : 0,
          debit: pv.payment_type === 'Debit' ? pv.amount : 0,
        }
      })

      allTransactions = [...challanTransactions, ...paymentVoucherTransactions]

      // Sort transactions by date
      const sortedTransactions = allTransactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Calculate running balance
      let runningBalance = 0
      const transactionsWithBalance = sortedTransactions.map(tx => {
        runningBalance += tx.credit - tx.debit
        return { ...tx, balance: runningBalance }
      })

      setTransactions(transactionsWithBalance.reverse())

      // Calculate summary
      let totalCredit = 0
      let totalDebit = 0
      
      challanTransactions.forEach(tx => {
        totalCredit += tx.credit
      })
      
      paymentVoucherTransactions.forEach(tx => {
        if (tx.credit > 0) totalCredit += tx.credit
        if (tx.debit > 0) totalDebit += tx.debit
      })
      
      
      const balance = totalCredit - totalDebit
      setSummary({ totalCredit, totalDebit, balance })
    }

    processTransactions()
  }, [ledgerData])

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print\:break-inside-avoid {
            break-inside: avoid !important;
          }
          section.flex {
            display: flex !important;
            justify-content: space-between !important;
          }
          section.flex > div {
            flex: 1 !important;
            margin-right: 2rem !important;
          }
          section.flex > div:last-child {
            margin-right: 0 !important;
          }
        }
      `}</style>

      <div className="no-print p-4 bg-white shadow-md flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Ledger
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 my-8 print:my-0 print:shadow-none shadow-lg font-sans">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">BHAKTINANDAN</h1>
            <p className="text-xs text-gray-500 mt-1">Textile Manufacturing</p>
            <p className="text-xs text-gray-500">Ahmedabad, Gujarat</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">LEDGER STATEMENT</h2>
            <p className="text-xs text-gray-500 mt-1">Ledger ID: <span className="font-medium text-gray-700">{ledgerData.ledger.ledger_id}</span></p>
            <p className="text-xs text-gray-500">Print Date: <span className="font-medium text-gray-700">{formatDateDateOnly(new Date().toISOString())}</span></p>
          </div>
        </header>

        {/* Business Information */}
        <section className="flex justify-between gap-8 mt-8 print:break-inside-avoid">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">BUSINESS DETAILS</h3>
            <div className="text-sm">
              <p className="font-bold text-gray-800 text-lg">{ledgerData.ledger.business_name}</p>
              {ledgerData.ledger.contact_person_name && (
                <p className="mt-1">Contact: {ledgerData.ledger.contact_person_name}</p>
              )}
              {ledgerData.ledger.mobile_number && (
                <p>M: {ledgerData.ledger.mobile_number}</p>
              )}
              {ledgerData.ledger.email && (
                <p>E: {ledgerData.ledger.email}</p>
              )}
              {ledgerData.ledger.gst_number && (
                <p className="font-medium">GST: {ledgerData.ledger.gst_number}</p>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">ADDRESS</h3>
            <div className="text-sm">
              {ledgerData.ledger.address && (
                <p>{ledgerData.ledger.address}</p>
              )}
              <p className="mt-1">
                {[
                  ledgerData.ledger.city,
                  ledgerData.ledger.district,
                  ledgerData.ledger.state,
                ].filter(Boolean).join(', ')}
                {ledgerData.ledger.zip_code ? ` - ${ledgerData.ledger.zip_code}` : ''}
              </p>
              {ledgerData.ledger.country && (
                <p className="mt-1">{ledgerData.ledger.country}</p>
              )}
            </div>
          </div>
        </section>

        {/* Ledger Summary */}
        <section className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-sm text-green-600">Total Credit</p>
              <p className="font-bold text-xl text-green-700">₹{summary.totalCredit.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <p className="text-sm text-red-600">Total Debit</p>
              <p className="font-bold text-xl text-red-700">₹{summary.totalDebit.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">Balance</p>
              <p className="font-bold text-xl text-blue-700">₹{summary.balance.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Passbook Table */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-left font-semibold text-gray-600">S.NO</th>
                <th className="border border-gray-300 p-2 text-left font-semibold text-gray-600">DATE</th>
                <th className="border border-gray-300 p-2 text-left font-semibold text-gray-600">DETAIL</th>
                <th className="border border-gray-300 p-2 text-left font-semibold text-gray-600">REMARK</th>
                <th className="border border-gray-300 p-2 text-right font-semibold text-gray-600">CREDIT (₹)</th>
                <th className="border border-gray-300 p-2 text-right font-semibold text-gray-600">DEBIT (₹)</th>
                <th className="border border-gray-300 p-2 text-right font-semibold text-gray-600">BALANCE (₹)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-b">
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{formatDateDateOnly(transaction.date)}</td>
                  <td className="border border-gray-300 p-2">{transaction.detail}</td>
                  <td className="border border-gray-300 p-2">{transaction.remark}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {transaction.credit > 0 ? transaction.credit.toFixed(2) : '-'}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {transaction.debit > 0 ? transaction.debit.toFixed(2) : '-'}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-medium">
                    {transaction.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <footer className="text-center mt-16 pt-4 text-xs text-gray-500 border-t">
          <p className="italic">* This is a system generated statement and does not require a signature.</p>
          <p className="mt-1">Printed on {formatDateDateOnly(new Date().toISOString())}</p>
        </footer>
      </div>
    </div>
  )
}
