"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  History,
  Calendar,
  IndianRupee,
  Loader2
} from 'lucide-react';
import { Database } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { LedgerSelectModal } from '@/components/production/ledger-select-modal';
import Image from 'next/image';
import { formatDate, formatCurrency } from '@/lib/utils';

type PaymentVoucher = Database['public']['Tables']['payment_vouchers']['Row'] & {
  ledgers?: {
    business_name: string;
    business_logo: string | null;
  } | null;
};

type Ledger = Database['public']['Tables']['ledgers']['Row'];
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role'];
type StitchingChallan = Database['public']['Tables']['isteaching_challans']['Row'];

interface PaymentVoucherContentProps {
  userId: string;
  ledgers: Ledger[];
  userRole: UserRole;
  paymentVouchers: PaymentVoucher[];
  totalCount: number;
  stitchingChallans: StitchingChallan[];
}

export function PaymentVoucherContent({ 
  userId, 
  ledgers, 
  userRole, 
  paymentVouchers,
  totalCount,
  stitchingChallans
}: PaymentVoucherContentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager';

  const voucherSequenceMap = useMemo(() => {
    const sortedVouchers = [...paymentVouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let creditCounter = 1;
    let debitCounter = 1;
    const map = new Map<number, number>();
    sortedVouchers.forEach(voucher => {
      if (voucher.payment_type === 'Credit') {
        map.set(voucher.id, creditCounter++);
      } else {
        map.set(voucher.id, debitCounter++);
      }
    });
    return map;
  }, [paymentVouchers]);

  const filteredPaymentVouchers = paymentVouchers.filter(voucher => {
    const matchesSearch = !searchTerm || 
      voucher.payment_for.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.ledgers?.business_name && voucher.ledgers.business_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesParty = !partyFilter || partyFilter === 'all' || voucher.ledger_id === partyFilter;
    
    const matchesDate = (!startDateFilter || new Date(voucher.date) >= new Date(startDateFilter)) &&
                        (!endDateFilter || new Date(voucher.date) < new Date(new Date(endDateFilter).setDate(new Date(endDateFilter).getDate() + 1)));

    const matchesType = !typeFilter || typeFilter === 'all' || voucher.payment_type === typeFilter;

    return matchesSearch && matchesParty && matchesDate && matchesType;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setPartyFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setTypeFilter('');
  };

  const handleDeletePaymentVoucher = async (voucherId: number) => {
    if (!confirm(`Are you sure you want to delete this payment voucher? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(voucherId);

    try {
      const { error } = await supabase
        .from('payment_vouchers')
        .delete()
        .eq('id', voucherId);

      if (error) {
        showToast('Failed to delete payment voucher. Please try again.', 'error');
        return;
      }

      showToast('Payment voucher has been deleted successfully.', 'success');
      router.refresh();
    } catch (err) {
      console.error('Error deleting payment voucher:', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ledger_id: '',
    payment_for: '',
    payment_type: 'Credit',
    amount: '',
    transaction_to_settle: '',
    sgst: 'Not Applicable',
    cgst: 'Not Applicable',
    igst: 'Not Applicable'
  });
  const [challanSearchTerm, setChallanSearchTerm] = useState('');
// Define types for better type safety
type Transaction = {
  id: string;
  type: string;
  reference: string;
  date: string;
  amount: number;
  description: string;
};

type QualityDetail = {
  quality_name: string;
  rate?: number;
  grey_mtr?: number;
};

// ... existing code ...

  const [availableTransactions, setAvailableTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleLedgerSelect = (ledgerId: string) => {
    setFormData(prev => ({
      ...prev,
      ledger_id: ledgerId,
      transaction_to_settle: ''
    }));
    
    // Fetch available transactions when ledger is selected
    if (ledgerId) {
      fetchAvailableTransactions(ledgerId, formData.payment_type);
    } else {
      setAvailableTransactions([]);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If payment type changes, reset transaction selection and reload transactions
    if (field === 'payment_type' && formData.ledger_id) {
      setFormData(prev => ({ ...prev, transaction_to_settle: '' }));
      fetchAvailableTransactions(formData.ledger_id, value);
    }
  };

  const filteredStitchingChallans = stitchingChallans.filter(challan =>
    challan.challan_no.toLowerCase().includes(challanSearchTerm.toLowerCase()) ||
    challan.quality.toLowerCase().includes(challanSearchTerm.toLowerCase())
  );

  // Function to fetch available transactions for settlement
  const fetchAvailableTransactions = async (ledgerId: string, paymentType: string) => {
    setLoadingTransactions(true);
    try {
      const transactions: Transaction[] = [];
      
      if (paymentType === 'Credit') {
        // For Credit payments, fetch Debit transactions (what the ledger owes)
        
        // Fetch weaver challans with vendor amounts (debit transactions)
        const { data: weaverChallans } = await supabase
          .from('weaver_challans')
          .select('id, challan_no, challan_date, vendor_amount, batch_number')
          .eq('vendor_ledger_id', ledgerId)
          .not('vendor_amount', 'is', null)
          .gt('vendor_amount', 0);
        
        if (weaverChallans) {
          transactions.push(...weaverChallans.map(challan => ({
            id: `weaver_${challan.id}`,
            type: 'Weaver Challan',
            reference: challan.challan_no,
            date: challan.challan_date,
            amount: challan.vendor_amount,
            description: `Batch: ${challan.batch_number}`
          })));
        }
        
        // Fetch stitching challans (debit transactions)
        const { data: stitchingChallans } = await supabase
          .from('isteaching_challans')
          .select('id, challan_no, date, transport_charge, quality, batch_number')
          .eq('ledger_id', ledgerId)
          .not('transport_charge', 'is', null)
          .gt('transport_charge', 0);
        
        if (stitchingChallans) {
          transactions.push(...stitchingChallans.map(challan => ({
            id: `stitching_${challan.id}`,
            type: 'Stitching Challan',
            reference: challan.challan_no,
            date: challan.date,
            amount: challan.transport_charge,
            description: `Quality: ${challan.quality}, Batch: ${Array.isArray(challan.batch_number) ? challan.batch_number.join(', ') : challan.batch_number}`
          })));
        }
        
      } else {
        // For Debit payments, fetch Credit transactions (what we owe to the ledger)
        
        // Fetch weaver challans as credit transactions (when ledger is the main party)
        const { data: weaverChallans } = await supabase
          .from('weaver_challans')
          .select('id, challan_no, challan_date, total_grey_mtr, batch_number, quality_details')
          .eq('ledger_id', ledgerId);
        
        if (weaverChallans) {
          transactions.push(...weaverChallans.map(challan => {
            const qualityName = Array.isArray(challan.quality_details) && 
                               challan.quality_details.length > 0 && 
                               challan.quality_details[0] && 
                               typeof challan.quality_details[0] === 'object' && 
                               'quality_name' in challan.quality_details[0]
              ? (challan.quality_details[0] as QualityDetail).quality_name
              : 'N/A';
              
            return {
              id: `weaver_${challan.id}`,
              type: 'Weaver Challan',
              reference: challan.challan_no,
              date: challan.challan_date,
              amount: challan.total_grey_mtr, // Using total_grey_mtr as reference amount
              description: `Batch: ${challan.batch_number}, Quality: ${qualityName}`
            };
          }));
        }
      }
      
      // Sort transactions by date (newest first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAvailableTransactions(transactions);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to fetch available transactions', 'error');
      setAvailableTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Calculate GST amounts and total
  const calculateGSTAndTotal = () => {
    const baseAmount = parseFloat(formData.amount) || 0;
    
    const getGSTValue = (gstType: string) => {
      if (gstType === 'Not Applicable') return 0;
      return parseFloat(gstType.replace('%', '')) / 100;
    };
    
    const sgstAmount = baseAmount * getGSTValue(formData.sgst);
    const cgstAmount = baseAmount * getGSTValue(formData.cgst);
    const igstAmount = baseAmount * getGSTValue(formData.igst);
    
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

  const validateForm = () => {
    if (!formData.ledger_id) {
      showToast('Please select a ledger', 'error');
      return false;
    }
    
    if (!formData.payment_for.trim()) {
      showToast('Please enter payment for details', 'error');
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('payment_vouchers')
        .insert({
          date: formData.date,
          ledger_id: formData.ledger_id,
          payment_for: formData.payment_for,
          payment_type: formData.payment_type,
          amount: gstCalculation.totalAmount, // Store the total amount including GST
          created_by: userId
        });
      
      if (error) throw error;
      
      showToast('Payment voucher created successfully', 'success');
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        ledger_id: '',
        payment_for: '',
        payment_type: 'Credit',
        amount: '',
        transaction_to_settle: '',
        sgst: 'Not Applicable',
        cgst: 'Not Applicable',
        igst: 'Not Applicable'
      });
      setAvailableTransactions([]);
      setShowCreateForm(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating payment voucher:', error);
      showToast('Failed to create payment voucher. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Find selected ledger for display
  const selectedLedger = ledgers.find(ledger => ledger.ledger_id === formData.ledger_id);

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Payment Voucher</h1>
            <p className="text-gray-600 mt-1">
              Create a new payment voucher
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            Back to List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Payment Voucher</CardTitle>
            <CardDescription>Fill in the details below to create a new payment voucher</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500">Date is set to today&apos;s date and cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ledger_id">Select Ledger</Label>
                  <LedgerSelectModal 
                    ledgers={ledgers} 
                    onLedgerSelect={handleLedgerSelect}
                  >
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      type="button"
                    >
                      {selectedLedger ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex items-center justify-center">
                            {selectedLedger.business_logo ? (
                              <Image
                                src={selectedLedger.business_logo}
                                alt={selectedLedger.business_name}
                                width={24}
                                height={24}
                                className="rounded object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xs font-bold text-gray-600">
                                {selectedLedger.business_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span>{selectedLedger.business_name}</span>
                        </div>
                      ) : (
                        <span>Select a ledger</span>
                      )}
                    </Button>
                  </LedgerSelectModal>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="payment_for">Payment For</Label>
                  <Input
                    id="payment_for"
                    value={formData.payment_for}
                    onChange={(e) => handleChange('payment_for', e.target.value)}
                    placeholder="Enter payment details"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select value={formData.payment_type} onValueChange={(value) => handleChange('payment_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Credit">Credit</SelectItem>
                      <SelectItem value="Debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction_to_settle">Select Transaction to Settle</Label>
                  <Select 
                    value={formData.transaction_to_settle} 
                    onValueChange={(value) => handleChange('transaction_to_settle', value)}
                    disabled={!formData.ledger_id || loadingTransactions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.ledger_id 
                          ? "Select a ledger first" 
                          : loadingTransactions 
                            ? "Loading transactions..." 
                            : availableTransactions.length === 0
                              ? "No transactions available"
                              : "Select a transaction to settle"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-60">
                      {availableTransactions.map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          <div className="flex flex-col">
                            <div className="font-medium">
                              {transaction.type} - {transaction.reference}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(transaction.date)} | ₹{transaction.amount} | {transaction.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingTransactions && (
                    <p className="text-sm text-blue-600 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading available transactions...
                    </p>
                  )}
                  {!loadingTransactions && formData.ledger_id && availableTransactions.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No {formData.payment_type === 'Credit' ? 'debit' : 'credit'} transactions found for settlement
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Without GST)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500">Enter amount with up to 2 decimal places</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sgst">SGST</Label>
                    <Select value={formData.sgst} onValueChange={(value) => handleChange('sgst', value)}>
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
                    <Select value={formData.cgst} onValueChange={(value) => handleChange('cgst', value)}>
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
                    <Select value={formData.igst} onValueChange={(value) => handleChange('igst', value)}>
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
                
                {(parseFloat(formData.amount) > 0 && gstCalculation.totalAmount > 0) && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Base Amount:</p>
                        <p className="font-medium">₹{parseFloat(formData.amount || '0').toFixed(2)}</p>
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
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="stitching-challans">
                  <AccordionTrigger>Show Stitching Challans</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search challans..."
                        value={challanSearchTerm}
                        onChange={(e) => setChallanSearchTerm(e.target.value)}
                      />
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Challan No</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Quality</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStitchingChallans.map(challan => (
                              <TableRow key={challan.id}>
                                <TableCell>{challan.challan_no}</TableCell>
                                <TableCell>{formatDate(challan.date)}</TableCell>
                                <TableCell>{challan.quality}</TableCell>
                                <TableCell>{formatCurrency(challan.transport_charge || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Payment Voucher'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Vouchers</h1>
          <p className="text-gray-600 mt-1">
            Manage payment vouchers ({totalCount} total vouchers)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Voucher
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter Vouchers
          </CardTitle>
          <CardDescription>
            Use the search bar for quick searches or expand the filters for more options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="filters">
              <AccordionTrigger>Advanced Filters</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Party Name</Label>
                    <Select value={partyFilter} onValueChange={setPartyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Parties" />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="all">All Parties</SelectItem>
                        {ledgers.map(ledger => (
                          <SelectItem key={ledger.ledger_id} value={ledger.ledger_id}>
                            {ledger.business_name}
                          </SelectItem>
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
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                        <SelectItem value="Debit">Debit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredPaymentVouchers.length}
            </div>
            <div className="text-sm text-gray-600">Filtered Vouchers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(filteredPaymentVouchers.reduce((sum, voucher) => sum + voucher.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Amount</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredPaymentVouchers.map(v => v.ledger_id)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Ledgers</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Voucher List</CardTitle>
          <CardDescription>
            {filteredPaymentVouchers.length} of {totalCount} vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead>Payment For</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPaymentVouchers.map((voucher) => {
                const date = new Date(voucher.date);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const sequenceId = voucherSequenceMap.get(voucher.id) || 0;
                const paddedId = sequenceId.toString().padStart(3, '0');
                const type = voucher.payment_type === 'Credit' ? 'C' : 'D';
                const voucherId = `VCH-${type}-${year}${month}${paddedId}`;

                return (
                <TableRow key={voucher.id}>
                  <TableCell>{voucherId}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(voucher.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(voucher.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded mr-2 flex items-center justify-center">
                        {voucher.ledgers?.business_logo ? (
                          <Image
                            src={voucher.ledgers.business_logo}
                            alt={voucher.ledgers.business_name || ''}
                            width={24}
                            height={24}
                            className="rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-600">
                            {voucher.ledgers?.business_name?.charAt(0) || 'N/A'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {voucher.ledgers?.business_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {voucher.payment_for}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      voucher.payment_type === 'Credit' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {voucher.payment_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {voucher.amount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className='bg-white'>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/payment-voucher/${voucher.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/production/payment-voucher/${voucher.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/payment-voucher/${voucher.id}/logs`)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Change Logs
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeletePaymentVoucher(voucher.id)}
                            disabled={deletingId === voucher.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === voucher.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
          
          {filteredPaymentVouchers.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No payment vouchers found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your search or create a new payment voucher
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
