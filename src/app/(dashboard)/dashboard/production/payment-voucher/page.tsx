import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentVoucherContent } from '@/components/production/payment-voucher-content';

export default async function PaymentVoucherPage() {
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

  // Fetch payment vouchers with ledger details
  const { data: paymentVouchers, count } = await supabase
    .from('payment_vouchers')
    .select(`
      *,
      ledgers (
        business_name,
        business_logo
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  // Fetch ledgers for dropdown
  const { data: ledgers } = await supabase.from('ledgers').select('*');

  // Fetch stitching challans
  const { data: stitchingChallans } = await supabase.from('isteaching_challans').select('*');

  return (
    <PaymentVoucherContent 
      userId={user.id} 
      ledgers={ledgers || []} 
      userRole={profile.user_role}
      paymentVouchers={paymentVouchers || []}
      totalCount={count || 0}
      stitchingChallans={stitchingChallans || []}
    />
  );
}
