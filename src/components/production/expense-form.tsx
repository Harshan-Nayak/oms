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
type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Row'] & {
  ledgers?: { business_name: string } | null;
};
type Expense = Database['public']['Tables']['expenses']['Row'];

const expenseSchema = z.object({
  expense_date: z.string(),
  challan_no: z.string().min(1, 'Challan/Batch Number is required'),
  ledger_id: z.string().optional(), // Auto-detected from challan
  manual_ledger_id: z.string().optional(), // Manually selected ledger
  expense_for: z.array(z.string()).min(1, 'At least one expense category is required'),
  other_expense_description: z.string().optional(),
  amount_before_gst: z.number().min(0.01, 'Amount must be greater than 0'),
  sgst: z.string(),
  cgst: z.string(),
  igst: z.string(),
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
  const [challans, setChallans] = useState<IsteachingChallan[]>([]);

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
      challan_no: expense.challan_no || '',
      ledger_id: expense.ledger_id || '', // Auto-detected ledger from existing expense
      manual_ledger_id: expense.manual_ledger_id || '', // Manual ledger override from existing expense
      expense_for: expense.expense_for || [],
      other_expense_description: expense.other_expense_description || '',
      amount_before_gst: expense.amount_before_gst || 0,
      sgst: expense.sgst || 'Not Applicable',
      cgst: expense.cgst || 'Not Applicable',
      igst: expense.igst || 'Not Applicable',
    } : {
      expense_date: new Date().toISOString().split('T')[0],
      challan_no: '',
      ledger_id: '',
      manual_ledger_id: '',
      expense_for: [],
      amount_before_gst: 0,
      sgst: 'Not Applicable',
      cgst: 'Not Applicable',
      igst: 'Not Applicable',
    },
  });

  const expenseFor = watch('expense_for');
  const challanNo = watch('challan_no');
  const amountBeforeGst = watch('amount_before_gst');
  const sgst = watch('sgst');
  const cgst = watch('cgst');
  const igst = watch('igst');
  const showOtherField = expenseFor.includes('Other');

  useEffect(() => {
    // Load all stitching challans on component mount
    fetchAllStitchingChallans();
  }, []);

  useEffect(() => {
    // After challans are loaded, set up editing data
    if (expense && challans.length > 0) {
      if (expense.challan_no) {
        handleChallanSelect(expense.challan_no);
      }
      // Set the manual ledger selection if the expense has a manual ledger override
      if (expense.manual_ledger_id) {
        setValue('manual_ledger_id', expense.manual_ledger_id);
        const ledger = ledgers.find(l => l.ledger_id === expense.manual_ledger_id);
        if (ledger) {
          setSelectedLedger(ledger);
        }
      } else if (expense.ledger_id) {
        // If no manual ledger, use the auto-detected ledger
        setValue('ledger_id', expense.ledger_id);
        const ledger = ledgers.find(l => l.ledger_id === expense.ledger_id);
        if (ledger) {
          setSelectedLedger(ledger);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense, challans, ledgers]);

  const fetchAllStitchingChallans = async () => {
    const { data, error } = await supabase
      .from('isteaching_challans')
      .select('*, ledgers!inner(business_name)')
      .order('challan_no', { ascending: false });
      
    if (error) {
      console.error('Error fetching stitching challans:', error);
      setChallans([]);
    } else {
      setChallans(data || []);
    }
  };

  const handleChallanSelect = async (challanNo: string) => {
    setValue('challan_no', challanNo);
    
    // Find the selected challan and auto-fetch its ledger
    const selectedChallan = challans.find(c => c.challan_no === challanNo);
    if (selectedChallan && selectedChallan.ledger_id) {
      const ledger = ledgers.find(l => l.ledger_id === selectedChallan.ledger_id);
      setSelectedLedger(ledger || null);
      setValue('ledger_id', selectedChallan.ledger_id);
    } else {
      setSelectedLedger(null);
      setValue('ledger_id', '');
    }
  };

  // Calculate GST amounts and total
  const calculateGSTAndTotal = () => {
    const baseAmount = parseFloat(String(amountBeforeGst)) || 0;
    
    const getGSTValue = (gstType: string) => {
      if (gstType === 'Not Applicable') return 0;
      return parseFloat(gstType.replace('%', '')) / 100;
    };
    
    const sgstAmount = baseAmount * getGSTValue(sgst);
    const cgstAmount = baseAmount * getGSTValue(cgst);
    const igstAmount = baseAmount * getGSTValue(igst);
    
    const totalGST = sgstAmount + cgstAmount + igstAmount;
    const totalAmount = baseAmount + totalGST;
    
    return {
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalGST,
      totalAmount
    };
  };

  const gstCalculation = calculateGSTAndTotal();

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    setError('');

    try {
      // Determine which ledger to use: manual override takes precedence over auto-detected
      const finalLedgerId = data.manual_ledger_id || data.ledger_id;
      
      const expenseData = {
        ...data,
        ledger_id: finalLedgerId, // Use the effective ledger (manual override if present, otherwise auto-detected)
        manual_ledger_id: data.manual_ledger_id, // Preserve the manual override if any
        cost: gstCalculation.totalAmount // Store total amount in cost field for backward compatibility
      };

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
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" {...register('expense_date')} readOnly className="bg-gray-100" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="challan_no">Select Challan/Batch Number *</Label>
            <Select value={challanNo} onValueChange={handleChallanSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a challan" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {challans.map(challan => (
                  <SelectItem key={challan.id} value={challan.challan_no}>
                    {challan.challan_no} ({Array.isArray(challan.batch_number) ? challan.batch_number.join(', ') : challan.batch_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.challan_no && <p className="text-sm text-red-600">{errors.challan_no.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ledger_id">Auto-detected Ledger (from Challan)</Label>
            <Input
              value={challans.find(c => c.challan_no === challanNo)?.ledgers?.business_name || 'No ledger selected'}
              readOnly
              className="bg-gray-100"
              placeholder="Auto-fetched from selected challan"
            />
            {errors.ledger_id && <p className="text-sm text-red-600">{errors.ledger_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual_ledger_id">Manual Ledger Override (Optional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={selectedLedger && watch('manual_ledger_id') ? selectedLedger.business_name : 'No manual ledger selected'}
                readOnly
                className="bg-gray-100"
                placeholder="Select a ledger manually to override auto-detected ledger"
              />
              <LedgerSelectModal
                ledgers={ledgers}
                onLedgerSelect={(ledgerId) => {
                  setValue('manual_ledger_id', ledgerId);
                  const ledger = ledgers.find(l => l.ledger_id === ledgerId);
                  if (ledger) {
                    setSelectedLedger(ledger);
                  }
                }}
              >
                <Button type="button" variant="outline">
                  Select Ledger
                </Button>
              </LedgerSelectModal>
            </div>
            <p className="text-sm text-gray-500">
              {watch('manual_ledger_id')
                ? 'Using manual ledger override'
                : 'Using auto-detected ledger from selected challan'}
            </p>
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
            <Label htmlFor="amount_before_gst">Amount (Before GST) *</Label>
            <Input
              id="amount_before_gst"
              type="number"
              step="0.01"
              {...register('amount_before_gst', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount_before_gst && <p className="text-sm text-red-600">{errors.amount_before_gst.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sgst">SGST</Label>
              <Select value={sgst} onValueChange={(value) => setValue('sgst', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                </SelectContent>
              </Select>
              {gstCalculation.sgstAmount > 0 && (
                <p className="text-xs text-gray-500">₹{gstCalculation.sgstAmount.toFixed(2)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cgst">CGST</Label>
              <Select value={cgst} onValueChange={(value) => setValue('cgst', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                </SelectContent>
              </Select>
              {gstCalculation.cgstAmount > 0 && (
                <p className="text-xs text-gray-500">₹{gstCalculation.cgstAmount.toFixed(2)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="igst">IGST</Label>
              <Select value={igst} onValueChange={(value) => setValue('igst', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  <SelectItem value="2.5%">2.5%</SelectItem>
                  <SelectItem value="5%">5%</SelectItem>
                  <SelectItem value="6%">6%</SelectItem>
                  <SelectItem value="9%">9%</SelectItem>
                  <SelectItem value="12%">12%</SelectItem>
                  <SelectItem value="18%">18%</SelectItem>
                </SelectContent>
              </Select>
              {gstCalculation.igstAmount > 0 && (
                <p className="text-xs text-gray-500">₹{gstCalculation.igstAmount.toFixed(2)}</p>
              )}
            </div>
          </div>

          {(parseFloat(String(amountBeforeGst)) > 0 && gstCalculation.totalAmount > 0) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Base Amount:</p>
                  <p className="font-medium">₹{parseFloat(String(amountBeforeGst) || '0').toFixed(2)}</p>
                </div>
                {gstCalculation.totalGST > 0 && (
                  <div>
                    <p className="text-gray-600">Total GST:</p>
                    <p className="font-medium text-blue-600">₹{gstCalculation.totalGST.toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-700">₹{gstCalculation.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
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
