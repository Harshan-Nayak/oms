# Applying the Batch History Database Migration

To enable the enhanced batch history feature with quality names in shorting entries, you need to apply the database migration.

## Prerequisites

- Access to your Supabase project database
- Supabase CLI installed (optional but recommended)

## Method 1: Using Supabase CLI

1. Navigate to your project directory:
   ```bash
   cd oms-nextjs
   ```

2. Apply the migration:
   ```bash
   supabase migration up
   ```

## Method 2: Manual SQL Execution

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/update_batch_history_function_v5.sql`:
   ```sql
   -- Update batch history function to include quality_name as type in shorting entries
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
           'quantity', ic.quantity
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

4. Click "Run" to execute the query

## Verification

After applying the migration, you can verify it works by:

1. Navigating to any batch history page in your application
2. Checking that shorting entries now display the quality name as the type
3. Confirming that all summary cards show the correct information

## Troubleshooting

If you encounter any issues:

1. Ensure you have the latest version of the migration file
2. Check that your database user has the necessary permissions
3. Verify that all referenced tables exist and have the correct structure