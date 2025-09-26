"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, History } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  ledgers?: { business_name: string } | null;
  manual_ledgers?: { business_name: string } | null;
};
type Ledger = Database['public']['Tables']['ledgers']['Row'];
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role'];

interface ExpenseContentProps {
  userId: string;
  expenses: Expense[];
  ledgers: Ledger[];
  userRole: UserRole;
}

export function ExpenseContent({ userId, expenses: initialExpenses, ledgers, userRole }: ExpenseContentProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canEdit = userRole === 'Admin' || userRole === 'Manager';

  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm ||
      expense.challan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.ledgers?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.manual_ledgers?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_for.join(', ').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesParty = !partyFilter || partyFilter === 'all' || expense.ledger_id === partyFilter || expense.manual_ledger_id === partyFilter;
    
    const matchesDate = (!startDateFilter || new Date(expense.expense_date) >= new Date(startDateFilter)) &&
                        (!endDateFilter || new Date(expense.expense_date) < new Date(new Date(endDateFilter).setDate(new Date(endDateFilter).getDate() + 1)));

    return matchesSearch && matchesParty && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setPartyFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm(`Are you sure you want to delete this expense? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(expenseId);

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        showToast('Failed to delete expense. Please try again.', 'error');
        return;
      }

      showToast(`Expense has been deleted successfully.`, 'success');
      router.refresh();
    } catch (err) {
      console.error('Error deleting expense:', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => router.push('/dashboard/production/expense/create')}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Search className="h-5 w-5 mr-2" />Search & Filter Expenses</CardTitle>
          <CardDescription>Use the search bar for quick searches or expand the filters for more options.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="filters">
              <AccordionTrigger>Advanced Filters</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Party Name</Label>
                    <Select value={partyFilter} onValueChange={setPartyFilter}>
                      <SelectTrigger><SelectValue placeholder="All Parties" /></SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="all">All Parties</SelectItem>
                        {ledgers.map(ledger => (
                          <SelectItem key={ledger.ledger_id} value={ledger.ledger_id}>{ledger.business_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Reset Filters</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{filteredExpenses.length}</div><div className="text-sm text-gray-600">Filtered Expenses</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">₹{filteredExpenses.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)}</div><div className="text-sm text-gray-600">Total Cost</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{new Set(filteredExpenses.flatMap(e => [e.ledger_id, e.manual_ledger_id].filter(Boolean))).size}</div><div className="text-sm text-gray-600">Unique Ledgers</div></CardContent></Card>
      </div>

      {loading ? <p>Loading expenses...</p> : (
        <div className="border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ledger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense For</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{expense.expense_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{expense.manual_ledger_id ? expense.manual_ledgers?.business_name : expense.ledgers?.business_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{expense.expense_for.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{expense.cost}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className='bg-white'>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/production/expense/${expense.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/production/expense/${expense.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/production/expense/${expense.id}/logs`)}>
                          <History className="mr-2 h-4 w-4" /> Change Logs
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deletingId === expense.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
