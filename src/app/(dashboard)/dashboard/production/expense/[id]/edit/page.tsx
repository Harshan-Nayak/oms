import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ExpenseForm } from '@/components/production/expense-form';
import { Database } from '@/types/database';

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const supabase = createServerSupabaseClient();
  const resolvedParams = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: expense, error } = await supabase
    .from('expenses')
    .select(`
      *,
      ledgers!expenses_ledger_id_fkey ( business_name ),
      manual_ledgers:ledgers!expenses_manual_ledger_id_fkey ( business_name )
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (error || !expense) {
    notFound();
  }

  const { data: ledgers } = await supabase.from('ledgers').select('*');

  return (
    <div className="p-6">
      <ExpenseForm
        ledgers={ledgers || []}
        userId={user.id}
        onSuccessRedirect={`/dashboard/production/expense/${resolvedParams.id}`}
        expense={expense}
      />
    </div>
  );
}
