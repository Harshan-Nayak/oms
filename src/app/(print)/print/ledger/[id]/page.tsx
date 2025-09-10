import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintLedgerClient from './PrintLedgerClient'

interface PrintLedgerPageProps {
  params: Promise<{
    id: string
  }>
}

async function getLedgerData(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch ledger details
 const { data: ledger, error } = await supabase
    .from('ledgers')
    .select('*')
    .eq('ledger_id', id)
    .single()

  if (error || !ledger) {
    notFound()
  }

  // Fetch related transactions for passbook
  const { data: challans } = await supabase
    .from('weaver_challans')
    .select('challan_no, challan_date, transport_charge, vendor_amount, sgst, cgst, igst')
    .eq('ledger_id', id)

  const { data: paymentVouchers } = await supabase
    .from('payment_vouchers')
    .select('id, date, payment_for, payment_type, amount')
    .eq('ledger_id', id)

  return {
    ledger,
    challans: challans || [],
    paymentVouchers: paymentVouchers || []
  }
}

export default async function PrintLedgerPage({ params }: PrintLedgerPageProps) {
  const resolvedParams = await params;
  const ledgerData = await getLedgerData(resolvedParams.id)

  return <PrintLedgerClient ledgerData={ledgerData} />
}
