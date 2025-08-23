import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentVoucherLogs } from '@/components/production/payment-voucher-logs';

export default async function PaymentVoucherLogsPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Check if user has permission to view logs
  const canView = profile.user_role === 'Admin' || profile.user_role === 'Manager';
  if (!canView) {
    return redirect('/dashboard/production/payment-voucher');
  }

  // Resolve the params Promise
  const resolvedParams = await params;
  
  // Check if the ID is a valid number
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) {
    return <div className="p-6 text-center">Invalid payment voucher ID</div>;
  }

  const { data: paymentVoucher, error: voucherError } = await supabase
    .from('payment_vouchers')
    .select(`
      *,
      ledgers (business_name)
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

  const { data: logs, error: logsError } = await supabase
    .from('payment_voucher_logs')
    .select(`*`)
    .eq('payment_voucher_id', id)
    .order('changed_at', { ascending: false });

  if (logsError) {
    console.error('Error fetching payment voucher logs:', logsError);
    return <div className="p-6 text-center">Error loading payment voucher logs: {logsError.message}</div>;
  }

  // Fetch user profiles separately for the changers
  const userIds = [...new Set(logs?.map(log => log.changed_by).filter(Boolean) || [])];
  const { data: users } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  // Create a map for easy lookup
  const usersMap = new Map(users?.map(u => [u.id, u]) || []);

  // Enhance logs with changer information
  const enhancedLogs = (logs || []).map(log => ({
    ...log,
    changer: log.changed_by ? usersMap.get(log.changed_by) : null,
    changes: log.changes && typeof log.changes === 'object' ? log.changes : {}
  }));

  return (
    <PaymentVoucherLogs 
      paymentVoucher={paymentVoucher} 
      logs={enhancedLogs}
    />
  );
}