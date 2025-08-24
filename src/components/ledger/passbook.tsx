'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface PassbookProps {
  ledgerId: string
}

interface Transaction {
  date: string;
  detail: string;
  remark: string;
  credit: number;
  debit: number;
  balance: number;
}

export default function Passbook({ ledgerId }: PassbookProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      const { data: challans, error: challanError } = await supabase
        .from('weaver_challans')
        .select('challan_no, challan_date, total_grey_mtr, quality_details')
        .eq('ledger_id', ledgerId);

      const { data: paymentVouchers, error: paymentVoucherError } = await supabase
        .from('payment_vouchers')
        .select('id, date, payment_for, payment_type, amount')
        .eq('ledger_id', ledgerId);

      if (challanError || paymentVoucherError) {
        console.error('Error fetching data:', challanError || paymentVoucherError);
      } else {
        const challanTransactions = (challans || []).map(c => ({
          date: c.challan_date,
          detail: 'Weaver Challan',
          remark: c.challan_no,
          credit: c.total_grey_mtr * (c.quality_details?.[0]?.rate || 0),
          debit: 0,
        }));

        const paymentVoucherTransactions = (paymentVouchers || []).map(pv => ({
          date: pv.date,
          detail: 'Payment Voucher',
          remark: pv.payment_for,
          credit: pv.payment_type === 'Credit' ? pv.amount : 0,
          debit: pv.payment_type === 'Debit' ? pv.amount : 0,
        }));

        const allTransactions = [...challanTransactions, ...paymentVoucherTransactions]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        const transactionsWithBalance = allTransactions.map(tx => {
          runningBalance += tx.credit - tx.debit;
          return { ...tx, balance: runningBalance };
        });

        setTransactions(transactionsWithBalance.reverse());
      }
      setLoading(false);
    }

    fetchData();
  }, [ledgerId, supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passbook</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading passbook...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>DETAIL</TableHead>
                <TableHead>REMARK</TableHead>
                <TableHead>CREDIT</TableHead>
                <TableHead>DEBIT</TableHead>
                <TableHead>BALANCE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.detail}</TableCell>
                  <TableCell>{transaction.remark}</TableCell>
                  <TableCell>₹{transaction.credit.toFixed(2)}</TableCell>
                  <TableCell>₹{transaction.debit.toFixed(2)}</TableCell>
                  <TableCell>₹{transaction.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
