-- Migration to add inventory classification field to isteaching_challans table

-- Add new field for inventory classification
ALTER TABLE public.isteaching_challans 
ADD COLUMN inventory_classification TEXT CHECK (inventory_classification IN ('unclassified', 'good', 'bad', 'wastage', 'shorting')) DEFAULT 'unclassified';

-- Add comment for the new field
COMMENT ON COLUMN public.isteaching_challans.inventory_classification IS 'Indicates the inventory classification of the challan (unclassified, good, bad, wastage, shorting)';

-- Create index for better query performance
CREATE INDEX idx_isteaching_challans_inventory_classification ON isteaching_challans(inventory_classification);