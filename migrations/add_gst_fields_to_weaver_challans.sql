-- Add GST fields to weaver_challans table
ALTER TABLE public.weaver_challans
ADD COLUMN sgst TEXT CHECK (sgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')),
ADD COLUMN cgst TEXT CHECK (cgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')),
ADD COLUMN igst TEXT CHECK (igst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable'));

-- Add comments for documentation
COMMENT ON COLUMN public.weaver_challans.sgst IS 'State Goods and Services Tax percentage';
COMMENT ON COLUMN public.weaver_challans.cgst IS 'Central Goods and Services Tax percentage';
COMMENT ON COLUMN public.weaver_challans.igst IS 'Integrated Goods and Services Tax percentage';