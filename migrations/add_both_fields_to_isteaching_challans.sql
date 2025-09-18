-- Migration to add 'Both (Top + Bottom)' fields to isteaching_challans table

-- Add new fields for the Both (Top + Bottom) functionality
ALTER TABLE public.isteaching_challans 
ADD COLUMN both_selected BOOLEAN DEFAULT FALSE,
ADD COLUMN both_top_qty NUMERIC(10,2),
ADD COLUMN both_bottom_qty NUMERIC(10,2);

-- Add comments for the new fields
COMMENT ON COLUMN public.isteaching_challans.both_selected IS 'Indicates if Both (Top + Bottom) option is selected';
COMMENT ON COLUMN public.isteaching_challans.both_top_qty IS 'Top quantity when Both option is selected';
COMMENT ON COLUMN public.isteaching_challans.both_bottom_qty IS 'Bottom quantity when Both option is selected';