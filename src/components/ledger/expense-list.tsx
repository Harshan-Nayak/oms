"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import Link from 'next/link';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  weaver_challans?: { id: number } | null;
};

interface ExpenseListProps {
  ledgerId: string;
}

export default function ExpenseList({ ledgerId }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*, weaver_challans(id)')
        .eq('ledger_id', ledgerId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
      } else {
        setExpenses(data || []);
      }
      setLoading(false);
    };

    fetchExpenses();
  }, [ledgerId]);

  if (loading) {
    return <p>Loading expenses...</p>;
  }

  if (expenses.length === 0) {
    return <p>No expenses found for this ledger.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Challan No</TableHead>
              <TableHead>Expense For</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.expense_date}</TableCell>
                <TableCell>
                  {expense.weaver_challans?.id ? (
                    <Link href={`/dashboard/production/weaver-challan/${expense.weaver_challans.id}`}>
                      <span className="text-blue-600 hover:underline">{expense.challan_no}</span>
                    </Link>
                  ) : (
                    expense.challan_no
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {expense.expense_for.map(item => (
                      <Badge key={item} variant="secondary">
                        {item === 'Other' ? expense.other_expense_description || 'Other' : item}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">₹{expense.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
