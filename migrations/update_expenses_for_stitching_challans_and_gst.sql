-- Migration to update expenses table for stitching challans and GST support

-- Step 1: Add GST fields to expenses table
ALTER TABLE public.expenses 
ADD COLUMN amount_before_gst DECIMAL(10,2),
ADD COLUMN sgst TEXT CHECK (sgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable',
ADD COLUMN cgst TEXT CHECK (cgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable',
ADD COLUMN igst TEXT CHECK (igst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable';

-- Step 2: Drop the foreign key constraint to weaver_challans
ALTER TABLE public.expenses 
DROP CONSTRAINT expenses_challan_no_fkey;

-- Step 3: Add foreign key constraint to isteaching_challans
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_challan_no_fkey 
FOREIGN KEY (challan_no) REFERENCES public.isteaching_challans(challan_no) ON DELETE SET NULL;

-- Step 4: Add comments for the new GST fields
COMMENT ON COLUMN public.expenses.amount_before_gst IS 'Amount before GST calculation';
COMMENT ON COLUMN public.expenses.sgst IS 'State Goods and Services Tax percentage';
COMMENT ON COLUMN public.expenses.cgst IS 'Central Goods and Services Tax percentage';
COMMENT ON COLUMN public.expenses.igst IS 'Integrated Goods and Services Tax percentage';

-- Step 5: Migrate existing data - set amount_before_gst to current cost value
UPDATE public.expenses 
SET amount_before_gst = cost 
WHERE amount_before_gst IS NULL;

-- Step 6: Make amount_before_gst NOT NULL after data migration
ALTER TABLE public.expenses 
ALTER COLUMN amount_before_gst SET NOT NULL;