CREATE TABLE public.shorting_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ledger_id TEXT REFERENCES public.ledgers(ledger_id),
  weaver_challan_id INTEGER REFERENCES public.weaver_challans(id),
  quality_name TEXT,
  shorting_qty NUMERIC(10, 2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
