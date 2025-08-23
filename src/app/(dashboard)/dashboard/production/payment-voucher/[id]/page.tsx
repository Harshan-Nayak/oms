import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentVoucherView } from '@/components/production/payment-voucher-view';

export default async function PaymentVoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Resolve the params Promise
  const resolvedParams = await params;
  
  // Check if the ID is a valid number
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return <div className="p-6 text-center">Invalid payment voucher ID</div>;
  }

  // Fetch the payment voucher
  const { data: paymentVoucher, error: voucherError } = await supabase
    .from('payment_vouchers')
    .select(`
      *,
      ledgers (
        business_name,
        business_logo,
        contact_person_name,
        mobile_number,
        email,
        address,
        city,
        state,
        country,
        zip_code,
        gst_number
      )
    `)
    .eq('id', id)
    .single();

  if (voucherError) {
    console.error('Error fetching payment voucher:', voucherError);
    return <div className="p-6 text-center">Error loading payment voucher: {voucherError.message}</div>;
  }

  if (!paymentVoucher) {
    return <div className="p-6 text-center">Payment voucher not found</div>;
  }

  // Fetch creator profile separately
  let creatorProfile = null;
  if (paymentVoucher.created_by) {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', paymentVoucher.created_by)
      .single();
    
    if (!profileError) {
      creatorProfile = data;
    }
  }

  // Merge the creator profile with the payment voucher data
  const paymentVoucherWithCreator = {
    ...paymentVoucher,
    creator: creatorProfile
  };

  return (
    <PaymentVoucherView 
      paymentVoucher={paymentVoucherWithCreator} 
      userRole={profile.user_role} 
      userId={user.id}
    />
  );
}