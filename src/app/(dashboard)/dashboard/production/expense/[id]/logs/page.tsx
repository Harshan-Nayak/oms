import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface ExpenseLogsPageProps {
  params: Promise<{ id: string }>;
}

type ChangeValue = {
  old: unknown;
  new: unknown;
};

export default async function ExpenseLogsPage({ params }: ExpenseLogsPageProps) {
  const supabase = createServerSupabaseClient();
  const resolvedParams = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: logs, error: logsError } = await supabase
    .from('expense_logs')
    .select(`*`)
    .eq('expense_id', resolvedParams.id)
    .order('changed_at', { ascending: false });

  if (logsError || !logs) {
    notFound();
  }

  // Fetch profiles separately
  const userIds = [...new Set(logs.map(log => log.changed_by).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  const profilesMap = new Map(profiles?.map(p => [p.id, p.email]));

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/production/expense/${resolvedParams.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expense
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Change Logs</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>History of changes made to this expense.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="border-b pb-4">
                <p className="text-sm text-gray-500">
                  Changed by {profilesMap.get(log.changed_by!) || 'Unknown'} on {formatDate(log.changed_at)}
                </p>
                <div className="mt-2 space-y-2">
                  {Object.entries(log.changes || {}).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-semibold">{key}:</span> 
                      <span className="text-red-500 line-through"> {JSON.stringify((value as ChangeValue).old)}</span> → 
                      <span className="text-green-500"> {JSON.stringify((value as ChangeValue).new)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
