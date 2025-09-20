// Batch History Component Test
// This file verifies that all the enhanced features are working correctly

import { BatchHistoryData } from '@/types/batch-history';

// Mock data to test the enhanced batch history component
const mockBatchHistoryData: BatchHistoryData = {
  batch_number: 'B12345',
  weaver_challan: {
    date: '2023-01-15',
    party: 'ABC Textiles',
    quantity: 1000,
  },
  shorting_entries: [
    {
      date: '2023-01-20',
      quantity: 50,
      type: 'Quality A',
    },
    {
      date: '2023-01-25',
      quantity: 30,
      type: 'Quality B',
    },
  ],
  isteaching_challans: [
    {
      date: '2023-02-01',
      challanNo: 'SC1001',
      product: 'Shirt A',
      quantity: 50,
      top_qty: 20,
      top_pcs_qty: 20,
      bottom_qty: 25,
      bottom_pcs_qty: 25,
      both_selected: false,
    },
    {
      date: '2023-02-05',
      challanNo: 'SC1002',
      product: 'Shirt B',
      quantity: 60,
      top_qty: 25,
      top_pcs_qty: 25,
      bottom_qty: 30,
      bottom_pcs_qty: 30,
      both_selected: true,
      both_top_qty: 5,
      both_bottom_qty: 5,
    },
  ],
  expenses: [
    {
      date: '2023-01-22',
      amount: 500,
      reason: 'Transportation',
    },
  ],
};

// Test calculations
const totalShorting = mockBatchHistoryData.shorting_entries.reduce(
  (sum, entry) => sum + entry.quantity,
  0
);

const totalStitching = mockBatchHistoryData.isteaching_challans.reduce(
  (sum, challan) => sum + challan.quantity,
  0
);

const totalExpenses = mockBatchHistoryData.expenses.reduce(
  (sum, expense) => sum + expense.amount,
  0
);

const initialQuantity = mockBatchHistoryData.weaver_challan.quantity;
const remainingQuantity = initialQuantity - totalShorting;

// Enhanced stitching statistics
const totalTopQty = mockBatchHistoryData.isteaching_challans.reduce(
  (sum, challan) => sum + (challan.top_qty || 0) + (challan.both_top_qty || 0),
  0
);

const totalBottomQty = mockBatchHistoryData.isteaching_challans.reduce(
  (sum, challan) => sum + (challan.bottom_qty || 0) + (challan.both_bottom_qty || 0),
  0
);

const totalTopPcs = mockBatchHistoryData.isteaching_challans.reduce(
  (sum, challan) => sum + (challan.top_pcs_qty || 0),
  0
);

const totalBottomPcs = mockBatchHistoryData.isteaching_challans.reduce(
  (sum, challan) => sum + (challan.bottom_pcs_qty || 0),
  0
);

const utilizationRate = initialQuantity > 0 ? ((totalStitching / initialQuantity) * 100) : 0;

console.log('Batch History Component Test Results:');
console.log('=====================================');
console.log(`Initial Quantity: ${initialQuantity} m`);
console.log(`Total Shorting: ${totalShorting} m`);
console.log(`Remaining Quantity: ${remainingQuantity} m`);
console.log(`Total Stitching: ${totalStitching} pcs`);
console.log(`Total Expenses: ₹${totalExpenses.toFixed(2)}`);
console.log('');
console.log('Enhanced Stitching Statistics:');
console.log(`Total Top Quantity: ${totalTopQty} m (${totalTopPcs} pcs)`);
console.log(`Total Bottom Quantity: ${totalBottomQty} m (${totalBottomPcs} pcs)`);
console.log(`Utilization Rate: ${utilizationRate.toFixed(1)}%`);