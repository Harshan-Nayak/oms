import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface ViewExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewExpensePage({ params }: ViewExpensePageProps) {
  const supabase = createServerSupabaseClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: expense, error } = await supabase
    .from('expenses')
    .select(`
      *,
      ledgers ( business_name ),
      weaver_challans ( batch_number )
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (error || !expense) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', expense.created_by)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/production/expense">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Details</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense #{expense.id}</CardTitle>
          <CardDescription>Details of the recorded expense.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <p>{new Date(expense.expense_date).toLocaleDateString()}</p>
            </div>
            <div>
              <Label>Ledger</Label>
              <p>{expense.ledgers?.business_name}</p>
            </div>
            <div>
              <Label>Challan/Batch Number</Label>
              <p>{expense.challan_no} ({expense.weaver_challans?.batch_number})</p>
            </div>
            <div>
              <Label>Cost</Label>
              <p>₹{expense.cost.toFixed(2)}</p>
            </div>
            <div>
              <Label>Entry By</Label>
              <p>{profile?.email || 'N/A'}</p>
            </div>
            <div>
              <Label>Entry Date</Label>
              <p>{formatDate(expense.created_at)}</p>
            </div>
          </div>
          <div>
            <Label>Expense For</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {expense.expense_for.map((item: string) => (
                <Badge key={item} variant="secondary">
                  {item === 'Other' ? expense.other_expense_description || 'Other' : item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
