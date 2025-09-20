# Batch History Feature

This feature provides a comprehensive view of all information related to a specific batch number in the production process.

## Features

- Displays weaver challan details (initial batch creation)
- Shows all shorting entries for the batch
- Lists all stitching challans that used this batch with detailed top/bottom breakdown
- Tracks all expenses associated with the batch
- Provides summary statistics and remaining quantity calculations
- Shows detailed production metrics including top/bottom quantities and utilization rates

## Database Migration

To enable the full functionality of the batch history feature, you need to apply the database migration that includes the quality name as the type field in shorting entries and detailed stitching challan information.

### Applying the Migration

1. Connect to your Supabase database
2. Run the migration script:
   ```sql
   -- Update batch history function to include quality_name as type in shorting entries
   -- and more detailed information about stitching challans
   CREATE OR REPLACE FUNCTION get_batch_history(batch_no TEXT)
   RETURNS JSONB AS $
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
   $ LANGUAGE plpgsql SECURITY DEFINER;
   ```

## UI Components

The batch history is displayed using the following components:

1. **Summary Cards** - Show key metrics at a glance
   - Initial weaver challan quantity
   - Total shorting quantity
   - Remaining quantity after shorting
   - Total stitching quantity
   - Total expenses

2. **Additional Production Statistics Cards** - Show detailed production metrics
   - Total top quantity (meters and pieces)
   - Total bottom quantity (meters and pieces)
   - Average quantity per challan
   - Utilization rate (efficiency metric)

3. **Weaver Challan Card** - Displays initial batch creation details

4. **Shorting Entries Table** - Lists all quantity reductions with types

5. **Stitching Challans Table** - Shows products created from this batch with detailed top/bottom breakdown

6. **Expenses Table** - Tracks all costs associated with the batch

## Accessing Batch History

Navigate to `/dashboard/production/batch/[batch_number]` where `[batch_number]` is the specific batch you want to view.

For example: `/dashboard/production/batch/B12345`