ALTER TABLE public.weaver_challans
ADD COLUMN vendor_ledger_id TEXT REFERENCES public.ledgers(ledger_id),
ADD COLUMN vendor_invoice_number TEXT,
ADD COLUMN vendor_amount NUMERIC;
