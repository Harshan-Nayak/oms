import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentVoucherEditForm } from '@/components/production/payment-voucher-edit-form';

export default async function PaymentVoucherEditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) {
    return redirect('/login');
  }

  // Check if user has permission to edit
  const canEdit = profile.user_role === 'Admin' || profile.user_role === 'Manager';
  if (!canEdit) {
    return redirect('/dashboard/production/payment-voucher');
  }

  // Resolve the params Promise
  const resolvedParams = await params;
  
  // Check if the ID is a valid number
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return <div className="p-6 text-center">Invalid payment voucher ID</div>;
  }

  const { data: paymentVoucher, error } = await supabase
    .from('payment_vouchers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching payment voucher:', error);
    return <div className="p-6 text-center">Error loading payment voucher: {error.message}</div>;
  }

  if (!paymentVoucher) {
    return <div className="p-6 text-center">Payment voucher not found</div>;
  }

  const { data: ledgers } = await supabase.from('ledgers').select('*');

  return (
    <PaymentVoucherEditForm 
      paymentVoucher={paymentVoucher} 
      ledgers={ledgers || []}
      userId={user.id}
    />
  );
}