-- Add new product fields to isteaching_challans table
ALTER TABLE public.isteaching_challans
ADD COLUMN category TEXT,
ADD COLUMN sub_category TEXT,
ADD COLUMN status TEXT CHECK (status IN ('Active', 'Inactive', 'Pipeline')) DEFAULT 'Active',
ADD COLUMN brand TEXT,
ADD COLUMN made_in TEXT;

-- Remove wash_care_instructions if it exists (check first to avoid error)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'isteaching_challans' 
        AND column_name = 'wash_care_instructions'
    ) THEN
        ALTER TABLE public.isteaching_challans DROP COLUMN wash_care_instructions;
    END IF;
END $$;