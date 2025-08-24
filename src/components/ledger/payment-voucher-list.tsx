import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PaymentVoucherListProps {
  ledgerId: string
}

export default async function PaymentVoucherList({ ledgerId }: PaymentVoucherListProps) {
  const supabase = createServerSupabaseClient()
  const { data: paymentVouchers, error } = await supabase
    .from('payment_vouchers')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching payment vouchers:', error.message)
    return <p className="text-red-500">Error loading payment vouchers. Check server logs for details.</p>
  }

  if (!paymentVouchers || paymentVouchers.length === 0) {
    return <p>No payment vouchers found for this ledger.</p>
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voucher ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment For</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentVouchers.map(voucher => (
            <TableRow key={voucher.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/production/payment-voucher/${voucher.id}`} className="text-blue-600 hover:underline">
                  {voucher.id}
                </Link>
              </TableCell>
              <TableCell>{formatDate(voucher.date)}</TableCell>
              <TableCell>{voucher.payment_for}</TableCell>
              <TableCell>
                <Badge variant={voucher.payment_type === 'Credit' ? 'default' : 'secondary'}>
                  {voucher.payment_type}
                </Badge>
              </TableCell>
              <TableCell>₹{voucher.amount.toLocaleString('en-IN')}</TableCell>
              <TableCell>
                <Link href={`/dashboard/production/payment-voucher/${voucher.id}`}>
                  <span className="text-blue-600 hover:underline">View Details</span>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
