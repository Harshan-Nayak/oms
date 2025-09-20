'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BatchHistoryData } from '@/types/batch-history';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type BatchHistoryProps = {
  batchNumber: string;
};

export default function BatchHistory({ batchNumber }: BatchHistoryProps) {
  const [history, setHistory] = useState<BatchHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_batch_history', {
        batch_no: batchNumber,
      });

      if (error) {
        console.error('Error fetching batch history:', error);
        setHistory(null);
      } else {
        console.log('Fetched batch history data:', data);
        setHistory(data);
      }

      setLoading(false);
    };

    fetchHistory();
  }, [batchNumber]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg font-medium">Loading batch history...</span>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Data Found</CardTitle>
            <CardDescription>
              No history found for batch {batchNumber}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate total quantities
  const totalShorting = history.shorting_entries?.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  ) || 0;
  
  const totalStitching = history.isteaching_challans?.reduce(
    (sum, challan) => sum + challan.quantity,
    0
  ) || 0;
  
  const totalExpenses = history.expenses?.reduce(
    (sum, expense) => sum + expense.amount,
    0
  ) || 0;

  // Calculate remaining quantity
  const initialQuantity = history.weaver_challan?.quantity || 0;
  const remainingQuantity = initialQuantity - totalShorting;

  // Calculate stitching statistics
  const totalTopQty = history.isteaching_challans?.reduce(
    (sum, challan) => sum + (challan.top_qty || 0) + (challan.both_top_qty || 0),
    0
  ) || 0;
  
  const totalBottomQty = history.isteaching_challans?.reduce(
    (sum, challan) => sum + (challan.bottom_qty || 0) + (challan.both_bottom_qty || 0),
    0
  ) || 0;
  
  const totalTopPcs = history.isteaching_challans?.reduce(
    (sum, challan) => sum + (challan.top_pcs_qty || 0),
    0
  ) || 0;
  
  const totalBottomPcs = history.isteaching_challans?.reduce(
    (sum, challan) => sum + (challan.bottom_pcs_qty || 0),
    0
  ) || 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Batch History</h1>
        <p className="text-muted-foreground">
          Detailed information for batch <span className="font-semibold">{batchNumber}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weaver Challan</CardDescription>
            <CardTitle className="text-2xl">
              {history.weaver_challan?.quantity || 0} m
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {history.weaver_challan?.party || 'No party'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shorting</CardDescription>
            <CardTitle className="text-2xl">{totalShorting} m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {history.shorting_entries?.length || 0} entries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-2xl">{remainingQuantity} m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              After shorting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Stitching</CardDescription>
            <CardTitle className="text-2xl">{totalStitching} pcs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {history.isteaching_challans?.length || 0} challans
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl">₹{totalExpenses.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {history.expenses?.length || 0} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stitching Statistics */}
      {history.isteaching_challans && history.isteaching_challans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Top Qty</CardDescription>
              <CardTitle className="text-2xl">{totalTopQty} m</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalTopPcs} pcs
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bottom Qty</CardDescription>
              <CardTitle className="text-2xl">{totalBottomQty} m</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalBottomPcs} pcs
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg per Challan</CardDescription>
              <CardTitle className="text-2xl">
                {(totalStitching / history.isteaching_challans.length).toFixed(1)} pcs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Average quantity
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Utilization Rate</CardDescription>
              <CardTitle className="text-2xl">
                {initialQuantity > 0 ? ((totalStitching / initialQuantity) * 100).toFixed(1) : '0'}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Efficiency metric
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weaver Challan Details */}
        {history.weaver_challan && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weaver Challan</CardTitle>
                <Badge variant="secondary">Received</Badge>
              </div>
              <CardDescription>
                Initial batch creation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{history.weaver_challan.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">{history.weaver_challan.party}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {history.weaver_challan.quantity} meters
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="font-medium">{batchNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shorting Entries */}
        {history.shorting_entries && history.shorting_entries.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Shorting Entries</CardTitle>
                <Badge>{history.shorting_entries.length} entries</Badge>
              </div>
              <CardDescription>
                Quantity reductions during processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.shorting_entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.quantity} m</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.type || 'Unspecified'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Stitching Challans */}
        {history.isteaching_challans && history.isteaching_challans.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Stitching Challans</CardTitle>
                <Badge>{history.isteaching_challans.length} challans</Badge>
              </div>
              <CardDescription>
                Products stitched from this batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Challan #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Top (m/pcs)</TableHead>
                    <TableHead className="text-right">Bottom (m/pcs)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.isteaching_challans.map((challan, index) => (
                    <TableRow key={index}>
                      <TableCell>{challan.date}</TableCell>
                      <TableCell>{challan.challanNo}</TableCell>
                      <TableCell>{challan.product}</TableCell>
                      <TableCell className="text-right">{challan.quantity} pcs</TableCell>
                      <TableCell className="text-right">
                        {challan.top_qty ? `${challan.top_qty}m` : ''}
                        {challan.both_selected && challan.both_top_qty ? `${challan.both_top_qty}m` : ''}
                        {challan.top_pcs_qty ? `/${challan.top_pcs_qty}pcs` : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        {challan.bottom_qty ? `${challan.bottom_qty}m` : ''}
                        {challan.both_selected && challan.both_bottom_qty ? `${challan.both_bottom_qty}m` : ''}
                        {challan.bottom_pcs_qty ? `/${challan.bottom_pcs_qty}pcs` : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Expenses */}
        {history.expenses && history.expenses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Expenses</CardTitle>
                <Badge>₹{totalExpenses.toFixed(2)}</Badge>
              </div>
              <CardDescription>
                Costs associated with this batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.expenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}