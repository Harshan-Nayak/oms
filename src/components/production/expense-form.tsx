"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LedgerSelectModal } from './ledger-select-modal';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from "@radix-ui/react-popover"

type Ledger = Database['public']['Tables']['ledgers']['Row'];
type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];

const expenseSchema = z.object({
  expense_date: z.string(),
  ledger_id: z.string().min(1, 'Ledger selection is required'),
  challan_no: z.string().min(1, 'Challan/Batch Number is required'),
  expense_for: z.array(z.string()).min(1, 'At least one expense category is required'),
  other_expense_description: z.string().optional(),
  cost: z.number().min(0.01, 'Cost must be greater than 0'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  ledgers: Ledger[];
  userId: string;
  onSuccessRedirect: string;
  expense?: Expense;
}

const expenseOptions = [
  'Transport', 'Washing', 'Iron', 'Stitching', 'Packing', 'Printing',
  'Dyeing', 'Embroidery', 'Labeling', 'Trimming', 'Thread / Accessories',
  'Finishing / Touch Up', 'Packaging Material', 'Barcode / Tag Printing',
  'Fusing / Interlining', 'Other'
];

export function ExpenseForm({ ledgers, userId, onSuccessRedirect, expense }: ExpenseFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [challans, setChallans] = useState<WeaverChallan[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      expense_date: expense.expense_date,
      ledger_id: expense.ledger_id || '',
      challan_no: expense.challan_no || '',
      expense_for: expense.expense_for || [],
      other_expense_description: expense.other_expense_description || '',
      cost: expense.cost || 0,
    } : {
      expense_date: new Date().toISOString().split('T')[0],
      ledger_id: '',
      challan_no: '',
      expense_for: [],
      cost: 0,
    },
  });

  const expenseFor = watch('expense_for');
  const challanNo = watch('challan_no');
  const showOtherField = expenseFor.includes('Other');

  useEffect(() => {
    if (expense) {
      const ledger = ledgers.find(l => l.ledger_id === expense.ledger_id);
      setSelectedLedger(ledger || null);
      if (expense.ledger_id) {
        handleLedgerSelect(expense.ledger_id, expense.challan_no);
      }
    }
  }, [expense, ledgers]);

  const handleLedgerSelect = async (ledgerId: string, defaultChallan?: string | null) => {
    const ledger = ledgers.find(l => l.ledger_id === ledgerId);
    setSelectedLedger(ledger || null);
    setValue('ledger_id', ledgerId);
    if (!defaultChallan) {
      setValue('challan_no', ''); // Reset challan selection
    }

    if (ledgerId) {
      const { data, error } = await supabase
        .from('weaver_challans')
        .select('*')
        .eq('ledger_id', ledgerId);
      if (error) {
        console.error('Error fetching challans:', error);
        setChallans([]);
      } else {
        setChallans(data || []);
        if (defaultChallan) {
          setValue('challan_no', defaultChallan);
        }
      }
    } else {
      setChallans([]);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    setError('');

    try {
      const expenseData = { ...data };

      if (expense) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ ...expenseData, updated_at: new Date().toISOString() })
          .eq('id', expense.id);

        if (updateError) {
          setError('Failed to update expense. Please try again.');
          showToast('Failed to update expense.', 'error');
          return;
        }
        showToast('Expense updated successfully!', 'success');
      } else {
        const { error: insertError } = await supabase.from('expenses').insert([{ ...expenseData, created_by: userId }]);

        if (insertError) {
          setError('Failed to add expense. Please try again.');
          showToast('Failed to add expense.', 'error');
          return;
        }
        showToast('Expense added successfully!', 'success');
      }
      router.push(onSuccessRedirect);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      showToast('An unexpected error occurred.', 'error');
      console.error('Error adding expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{expense ? 'Edit Expense' : 'Add Expense'}</CardTitle>
          <CardDescription>{expense ? 'Update the details of the expense.' : 'Fill in the details for the new expense.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...register('expense_date')} readOnly className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger_id">Select Ledger *</Label>
              <LedgerSelectModal ledgers={ledgers} onLedgerSelect={handleLedgerSelect}>
                <Button type="button" variant="outline" className="w-full justify-start">
                  {selectedLedger ? selectedLedger.business_name : '-- Select Ledger --'}
                </Button>
              </LedgerSelectModal>
              {errors.ledger_id && <p className="text-sm text-red-600">{errors.ledger_id.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challan_no">Select Challan/Batch Number *</Label>
            <Select value={challanNo} onValueChange={(value) => setValue('challan_no', value)} disabled={!selectedLedger}>
              <SelectTrigger>
                <SelectValue placeholder="Select a challan" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {challans.map(challan => (
                  <SelectItem key={challan.id} value={challan.challan_no}>
                    {challan.challan_no} ({challan.batch_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.challan_no && <p className="text-sm text-red-600">{errors.challan_no.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Expense For *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {expenseFor.length > 0 ? expenseFor.join(', ') : 'Select expense types'}
                </Button>
              </PopoverTrigger>
              <PopoverPrimitive.Portal>
                <PopoverContent className="w-full p-0 bg-white z-50">
                  <div className="space-y-2 p-4 max-h-60 overflow-y-auto">
                    {expenseOptions.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={expenseFor.includes(option)}
                          onCheckedChange={(checked) => {
                            let newValues: string[];
                            if (option === 'Other') {
                              newValues = checked ? ['Other'] : [];
                            } else {
                              if (checked) {
                                newValues = [...expenseFor.filter(v => v !== 'Other'), option];
                              } else {
                                newValues = expenseFor.filter(v => v !== option);
                              }
                            }
                            setValue('expense_for', newValues);
                          }}
                        />
                        <Label htmlFor={option}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </PopoverPrimitive.Portal>
            </Popover>
            {errors.expense_for && <p className="text-sm text-red-600">{errors.expense_for.message}</p>}
          </div>

          {showOtherField && (
            <div className="space-y-2">
              <Label htmlFor="other_expense_description">Other Expense Details</Label>
              <Input
                id="other_expense_description"
                {...register('other_expense_description')}
                placeholder="e.g., Special Handling, Courier Charges"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (₹) *</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              {...register('cost', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.cost && <p className="text-sm text-red-600">{errors.cost.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {expense ? 'Updating...' : 'Adding Expense...'}
            </>
          ) : (
            expense ? 'Update Expense' : 'Add Expense'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
