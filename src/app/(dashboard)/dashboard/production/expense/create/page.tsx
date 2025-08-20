import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExpenseForm } from '@/components/production/expense-form';
import { Database } from '@/types/database';

type Ledger = Database['public']['Tables']['ledgers']['Row'];

export default async function CreateExpensePage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: ledgers } = await supabase.from('ledgers').select('*');

  return (
    <div className="p-6">
      <ExpenseForm ledgers={ledgers || []} userId={user.id} onSuccessRedirect="/dashboard/production/expense" />
    </div>
  );
}
