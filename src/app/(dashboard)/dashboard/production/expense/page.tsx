import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExpenseContent } from '@/components/production/expense-content';

export default async function ExpensePage() {
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

  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      ledgers!expenses_ledger_id_fkey (business_name),
      manual_ledgers:ledgers!expenses_manual_ledger_id_fkey (business_name)
    `);
  const { data: ledgers } = await supabase.from('ledgers').select('*');

  return (
    <div className="p-6">
      <ExpenseContent userId={user.id} expenses={expenses || []} ledgers={ledgers || []} userRole={profile.user_role} />
    </div>
  );
}
