'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Database } from '@/types/database'

type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row']

interface PassbookProps {
  ledgerId: string;
  vendorChallans?: WeaverChallan[];
}

interface Transaction {
  date: string;
  detail: string;
  remark: string;
  credit: number;
  debit: number;
  balance: number;
}

export default function Passbook({ ledgerId, vendorChallans }: PassbookProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function processTransactions() {
      setLoading(true);
      let allTransactions: Omit<Transaction, 'balance'>[] = [];

      if (vendorChallans) {
        // This is a vendor passbook, only use the provided challans
        // For vendor passbook, show Total Amount (After GST) in DEBIT column
        const vendorTransactions = (vendorChallans || []).map(vc => {
          // Calculate GST amounts for vendor challans
          const calculateGSTAmount = (percentage: string | undefined | null, baseAmount: number) => {
            if (!percentage || percentage === 'Not Applicable') return 0;
            const rate = parseFloat(percentage.replace('%', '')) / 100;
            return baseAmount * rate;
          };
          
          const baseAmount = vc.vendor_amount || 0;
          const sgstAmount = calculateGSTAmount(vc.sgst, baseAmount);
          const cgstAmount = calculateGSTAmount(vc.cgst, baseAmount);
          const igstAmount = calculateGSTAmount(vc.igst, baseAmount);
          const totalAmountAfterGST = baseAmount + sgstAmount + cgstAmount + igstAmount;
          
          return {
            date: vc.challan_date,
            detail: 'Vendor Challan',
            remark: vc.vendor_invoice_number || vc.challan_no,
            credit: 0,
            debit: totalAmountAfterGST,
          };
        });
        
        allTransactions = vendorTransactions;
      } else {
        // This is a regular passbook, fetch all related transactions
        const { data: challans, error: challanError } = await supabase
          .from('weaver_challans')
          .select('challan_no, challan_date, transport_charge, vendor_amount, sgst, cgst, igst')
          .eq('ledger_id', ledgerId);

        // Also fetch vendor challans for this ledger to include in regular passbook
        const { data: vendorChallansForRegular, error: vendorChallanError } = await supabase
          .from('weaver_challans')
          .select('challan_no, challan_date, vendor_amount, vendor_invoice_number, sgst, cgst, igst')
          .eq('vendor_ledger_id', ledgerId);

        const { data: paymentVouchers, error: paymentVoucherError } = await supabase
          .from('payment_vouchers')
          .select('id, date, payment_for, payment_type, amount')
          .eq('ledger_id', ledgerId);

        if (challanError || paymentVoucherError || vendorChallanError) {
          console.error('Error fetching data:', challanError || paymentVoucherError || vendorChallanError);
        } else {
          const challanTransactions = (challans || []).map(c => {
            // Calculate GST amounts based on vendor_amount (not total_grey_mtr * rate)
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
            
            // Debug logging for the specific challan
            if (c.challan_no === 'BNG-CH-20250910-001') {
              console.log('Debug - Weaver Challan BNG-CH-20250910-001:', {
                vendor_amount: c.vendor_amount,
                baseAmount: baseAmount,
                sgst: c.sgst,
                cgst: c.cgst,
                igst: c.igst,
                sgstAmount: sgstAmount,
                cgstAmount: cgstAmount,
                igstAmount: igstAmount,
                vendorAmountWithGST: vendorAmountWithGST,
                transportCharge: transportCharge,
                totalCredit: totalCredit
              });
            }
            
            return {
              date: c.challan_date,
              detail: 'Weaver Challan',
              remark: c.challan_no,
              credit: totalCredit,
              debit: 0,
            };
          });

          const sortedVouchers = [...(paymentVouchers || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          let creditCounter = 1;
          let debitCounter = 1;
          const voucherSequenceMap = new Map<number, number>();
          sortedVouchers.forEach(voucher => {
            if (voucher.payment_type === 'Credit') {
              voucherSequenceMap.set(voucher.id, creditCounter++);
            } else {
              voucherSequenceMap.set(voucher.id, debitCounter++);
            }
          });

          const paymentVoucherTransactions = (paymentVouchers || []).map(pv => {
            const date = new Date(pv.date);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const sequenceId = voucherSequenceMap.get(pv.id) || 0;
            const paddedId = sequenceId.toString().padStart(3, '0');
            const type = pv.payment_type === 'Credit' ? 'C' : 'D';
            const remark = `VCH-${type}-${year}${month}${paddedId}`;

            return {
              date: pv.date,
              detail: pv.payment_for,
              remark: remark,
              credit: pv.payment_type === 'Credit' ? pv.amount : 0,
              debit: pv.payment_type === 'Debit' ? pv.amount : 0,
            };
          });
          
          // Add vendor challan transactions to regular passbook as DEBIT entries
          const vendorChallanTransactions = (vendorChallansForRegular || []).map(vc => {
            // Calculate GST amounts for vendor challans
            const calculateGSTAmount = (percentage: string | undefined | null, baseAmount: number) => {
              if (!percentage || percentage === 'Not Applicable') return 0;
              const rate = parseFloat(percentage.replace('%', '')) / 100;
              return baseAmount * rate;
            };
            
            const baseAmount = vc.vendor_amount || 0;
            const sgstAmount = calculateGSTAmount(vc.sgst, baseAmount);
            const cgstAmount = calculateGSTAmount(vc.cgst, baseAmount);
            const igstAmount = calculateGSTAmount(vc.igst, baseAmount);
            const totalAmountAfterGST = baseAmount + sgstAmount + cgstAmount + igstAmount;
            
            return {
              date: vc.challan_date,
              detail: 'Vendor Challan',
              remark: vc.vendor_invoice_number || vc.challan_no,
              credit: 0,
              debit: totalAmountAfterGST,
            };
          });
          
          allTransactions = [...challanTransactions, ...vendorChallanTransactions, ...paymentVoucherTransactions];
        }
      }

      const sortedTransactions = allTransactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let runningBalance = 0;
      const transactionsWithBalance = sortedTransactions.map(tx => {
        runningBalance += tx.credit - tx.debit;
        return { ...tx, balance: runningBalance };
      });

      setTransactions(transactionsWithBalance.reverse());
      setLoading(false);
    }

    processTransactions();
  }, [ledgerId, vendorChallans, supabase]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passbook</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading passbook...</p>
        ) : (
          <>
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
                {currentTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{indexOfFirstTransaction + index + 1}</TableCell>
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
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {Math.ceil(transactions.length / transactionsPerPage)}
              </span>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastTransaction >= transactions.length}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
