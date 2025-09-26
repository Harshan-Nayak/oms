-- Migration to add manual ledger selection field to expenses table
-- This allows storing both the auto-detected ledger from challan and manual override

-- Add new field for manual ledger selection
ALTER TABLE public.expenses 
ADD COLUMN manual_ledger_id TEXT REFERENCES public.ledgers(ledger_id) ON DELETE SET NULL;

-- Add comment for the new field
COMMENT ON COLUMN public.expenses.manual_ledger_id IS 'Manually selected ledger by user, overrides auto-detected ledger from challan when set';

-- Update the original ledger_id column comment
COMMENT ON COLUMN public.expenses.ledger_id IS 'Auto-detected ledger from selected challan';
