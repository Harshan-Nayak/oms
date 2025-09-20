# How to View the Enhanced Batch History Feature

## Overview
The enhanced batch history feature provides comprehensive production statistics and detailed information about how raw materials are utilized in the production process.

## Prerequisites
1. Make sure you have applied the latest database migration
2. Ensure the development server is running

## Steps to View the Enhanced Batch History

### 1. Apply Database Migration
First, you need to apply the enhanced database function:

```sql
-- Run this SQL in your Supabase SQL editor
CREATE OR REPLACE FUNCTION get_batch_history(batch_no TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'batch_number', wc.batch_number,
    'weaver_challan', jsonb_build_object(
      'date', wc.challan_date,
      'party', wc.ms_party_name,
      'quantity', wc.total_grey_mtr
    ),
    'shorting_entries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', se.entry_date,
        'quantity', se.shorting_qty,
        'type', se.quality_name
      ))
      FROM shorting_entries se
      WHERE se.weaver_challan_id = wc.id
    ), '[]'::jsonb),
    'isteaching_challans', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', ic.date,
        'challanNo', ic.challan_no,
        'product', ic.product_name,
        'quantity', ic.quantity,
        'top_qty', ic.top_qty,
        'top_pcs_qty', ic.top_pcs_qty,
        'bottom_qty', ic.bottom_qty,
        'bottom_pcs_qty', ic.bottom_pcs_qty,
        'both_selected', ic.both_selected,
        'both_top_qty', ic.both_top_qty,
        'both_bottom_qty', ic.both_bottom_qty
      ))
      FROM isteaching_challans ic
      WHERE ic.batch_number && ARRAY[wc.batch_number]
    ), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', e.expense_date,
        'amount', e.cost,
        'reason', e.expense_for
      ))
      FROM expenses e
      WHERE e.challan_no IN (
        SELECT ic.challan_no
        FROM isteaching_challans ic
        WHERE ic.batch_number && ARRAY[wc.batch_number]
      )
    ), '[]'::jsonb)
  )
  INTO result
  FROM weaver_challans wc
  WHERE wc.batch_number = batch_no;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Start the Development Server
If not already running, start the development server:

```bash
cd oms-nextjs
npm run dev
```

The server should start on http://localhost:3001 (port 3000 might be in use)

### 3. Navigate to Batch History Page
1. Open your browser and go to: http://localhost:3001
2. Log in with your credentials
3. Navigate to a batch history page by visiting:
   ```
   http://localhost:3001/dashboard/production/batch/[BATCH_NUMBER]
   ```
   Replace `[BATCH_NUMBER]` with an actual batch number from your database, for example:
   ```
   http://localhost:3001/dashboard/production/batch/B12345
   ```

## What You Should See

### Enhanced Summary Cards
You should see additional summary cards including:
- Total Top Quantity (meters and pieces)
- Total Bottom Quantity (meters and pieces)
- Average quantity per challan
- Utilization rate (efficiency metric)

### Enhanced Stitching Challans Table
The stitching challans table now includes:
- Separate columns for top and bottom section data
- Clear display of meters and pieces for each section
- Support for both regular and "both selected" stitching data

### Detailed Production Metrics
- Top section quantities in both meters and pieces
- Bottom section quantities in both meters and pieces
- Utilization rate showing production efficiency
- Average quantity per challan for better planning

## Troubleshooting

### If You Don't See the Enhanced Features:
1. Make sure you applied the database migration
2. Check that you're viewing a batch that has stitching challans with top/bottom data
3. Clear your browser cache and refresh the page
4. Restart the development server

### If You Get Errors:
1. Check the browser console for any JavaScript errors
2. Verify that all dependencies are installed correctly
3. Ensure the database connection is working properly

## Example Batch Numbers to Test
Look in your database for batches that have stitching challans associated with them. These will show the enhanced features most clearly.

For example, if you have a batch B12345 that has been used in stitching challans, navigating to:
```
http://localhost:3001/dashboard/production/batch/B12345
```

Should show all the enhanced features including the additional summary cards and detailed stitching information.