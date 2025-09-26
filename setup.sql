-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_role TEXT CHECK (user_role IN ('Admin', 'Manager', 'User')) DEFAULT 'User',
  user_status TEXT CHECK (user_status IN ('Active', 'Inactive')) DEFAULT 'Active',
  profile_photo TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  document_type TEXT,
  document_number TEXT,
  dob DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  product_image TEXT,
  product_name TEXT NOT NULL,
  product_sku TEXT UNIQUE NOT NULL,
  product_category TEXT NOT NULL,
  product_sub_category TEXT,
  product_size TEXT,
  product_color TEXT,
  product_description TEXT,
  product_material TEXT,
  product_brand TEXT DEFAULT 'Bhaktinandan',
  product_country TEXT DEFAULT 'India',
  product_status TEXT CHECK (product_status IN ('Active', 'Inactive')) DEFAULT 'Active',
  product_qty INTEGER DEFAULT 0,
  wash_care TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create ledgers table
CREATE TABLE public.ledgers (
  ledger_id TEXT PRIMARY KEY,
  business_logo TEXT,
  business_name TEXT NOT NULL,
  contact_person_name TEXT,
  mobile_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  country TEXT,
  zip_code TEXT,
  gst_number TEXT,
  pan_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weaver_challans table
CREATE TABLE public.weaver_challans (
  id SERIAL PRIMARY KEY,
  challan_date DATE NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  challan_no TEXT UNIQUE NOT NULL,
  ms_party_name TEXT NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  total_grey_mtr DECIMAL(10,2) NOT NULL,
  fold_cm DECIMAL(8,2),
  width_inch DECIMAL(8,2),
  taka INTEGER NOT NULL,
  transport_name TEXT,
  lr_number TEXT,
  transport_charge DECIMAL(10,2),
  quality_details JSONB,
  taka_details JSONB,
  vendor_ledger_id TEXT REFERENCES ledgers(ledger_id),
  vendor_invoice_number TEXT,
  vendor_amount NUMERIC,
  sgst TEXT CHECK (sgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')),
  cgst TEXT CHECK (cgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')),
  igst TEXT CHECK (igst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  po_date DATE NOT NULL,
  supplier_name TEXT NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('Draft', 'Sent', 'Confirmed', 'Partial', 'Completed', 'Cancelled')) DEFAULT 'Draft',
  description TEXT,
  delivery_date DATE,
  terms_conditions TEXT,
  items JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ledger_logs table
CREATE TABLE public.ledger_logs (
  id SERIAL PRIMARY KEY,
  ledger_id TEXT REFERENCES public.ledgers(ledger_id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create isteaching_challans table
CREATE TABLE public.isteaching_challans (
  id SERIAL PRIMARY KEY,
  challan_no TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  quality TEXT NOT NULL,
  batch_number TEXT[] NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  product_name TEXT,
  product_description TEXT,
  product_image TEXT,
  product_sku TEXT,
  product_qty INTEGER,
  product_color TEXT,
  product_size JSONB,
  category TEXT,
  sub_category TEXT,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Pipeline')) DEFAULT 'Active',
  brand TEXT,
  made_in TEXT,
  transport_name TEXT,
  lr_number TEXT,
  transport_charge DECIMAL(10,2),
  selected_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cloth_type TEXT[],
  top_qty NUMERIC,
  top_pcs_qty NUMERIC,
  bottom_qty NUMERIC,
  bottom_pcs_qty NUMERIC,
  both_selected BOOLEAN DEFAULT FALSE,
  both_top_qty NUMERIC(10,2),
  both_bottom_qty NUMERIC(10,2)
);

-- Add index for better query performance
CREATE INDEX idx_isteaching_challans_selected_product_id ON isteaching_challans(selected_product_id);

-- Add comments for GST fields in weaver_challans
COMMENT ON COLUMN public.weaver_challans.sgst IS 'State Goods and Services Tax percentage';
COMMENT ON COLUMN public.weaver_challans.cgst IS 'Central Goods and Services Tax percentage';
COMMENT ON COLUMN public.weaver_challans.igst IS 'Integrated Goods and Services Tax percentage';

-- Create isteaching_challan_logs table
CREATE TABLE public.isteaching_challan_logs (
  id SERIAL PRIMARY KEY,
  challan_id INTEGER REFERENCES public.isteaching_challans(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weaver_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isteaching_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isteaching_challan_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products policies (Admin and Manager can manage, User can view)
CREATE POLICY "All authenticated users can view products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert products" ON public.products
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update products" ON public.products
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Ledgers policies
CREATE POLICY "All authenticated users can view ledgers" ON public.ledgers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert ledgers" ON public.ledgers
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update ledgers" ON public.ledgers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete ledgers" ON public.ledgers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Ledger Logs policies
CREATE POLICY "Admin and Manager can view ledger logs" ON public.ledger_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can insert ledger logs" ON public.ledger_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Purchase Orders policies
CREATE POLICY "All authenticated users can view purchase orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert purchase orders" ON public.purchase_orders
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update purchase orders" ON public.purchase_orders
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete purchase orders" ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Weaver Challans policies
CREATE POLICY "All authenticated users can view weaver challans" ON public.weaver_challans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert weaver challans" ON public.weaver_challans
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update weaver challans" ON public.weaver_challans
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete weaver challans" ON public.weaver_challans
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Isteaching Challans policies
CREATE POLICY "All authenticated users can view isteaching challans" ON public.isteaching_challans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert isteaching challans" ON public.isteaching_challans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update isteaching challans" ON public.isteaching_challans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete isteaching challans" ON public.isteaching_challans
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Isteaching Challan Logs policies
CREATE POLICY "Admin and Manager can view isteaching challan logs" ON public.isteaching_challan_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can insert isteaching challan logs" ON public.isteaching_challan_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ledger-documents', 'ledger-documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can view ledger documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'ledger-documents');

CREATE POLICY "Authenticated users can upload ledger documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ledger-documents');

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup (FIXED - was incomplete in original)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log ledger changes
CREATE OR REPLACE FUNCTION public.log_ledger_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb := '{}'::jsonb;
  r record;
BEGIN
  FOR r IN SELECT * FROM jsonb_each(to_jsonb(NEW))
  LOOP
    IF r.key <> 'updated_at' AND r.value <> (to_jsonb(OLD) -> r.key) THEN
      changes := changes || jsonb_build_object(r.key, jsonb_build_object('old', (to_jsonb(OLD) -> r.key), 'new', r.value));
    END IF;
  END LOOP;

  IF changes <> '{}'::jsonb THEN
    INSERT INTO public.ledger_logs (ledger_id, changed_by, changes)
    VALUES (NEW.ledger_id, auth.uid(), changes);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to log ledger changes
CREATE TRIGGER on_ledger_update
  AFTER UPDATE ON public.ledgers
  FOR EACH ROW EXECUTE FUNCTION public.log_ledger_changes();

-- Create expenses table
CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  manual_ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  challan_no TEXT REFERENCES isteaching_challans(challan_no) ON DELETE SET NULL,
  expense_for TEXT[] NOT NULL,
  other_expense_description TEXT,
  cost DECIMAL(10,2) NOT NULL,
  amount_before_gst DECIMAL(10,2) NOT NULL,
  sgst TEXT CHECK (sgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable',
  cgst TEXT CHECK (cgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable',
  igst TEXT CHECK (igst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable')) DEFAULT 'Not Applicable',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for ledger columns
COMMENT ON COLUMN public.expenses.ledger_id IS 'Auto-detected ledger from selected challan';
COMMENT ON COLUMN public.expenses.manual_ledger_id IS 'Manually selected ledger by user, overrides auto-detected ledger from challan when set';

-- Create expense_logs table
CREATE TABLE public.expense_logs (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES public.expenses(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_logs ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "All authenticated users can view expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Expense Logs policies
CREATE POLICY "Admin and Manager can view expense logs" ON public.expense_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can insert expense logs" ON public.expense_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Function to log expense changes
CREATE OR REPLACE FUNCTION public.log_expense_changes()
RETURNS TRIGGER AS $
DECLARE
  changes jsonb := '{}'::jsonb;
  r record;
BEGIN
  FOR r IN SELECT * FROM jsonb_each(to_jsonb(NEW))
  LOOP
    IF r.key <> 'updated_at' AND r.value <> (to_jsonb(OLD) -> r.key) THEN
      changes := changes || jsonb_build_object(r.key, jsonb_build_object('old', (to_jsonb(OLD) -> r.key), 'new', r.value));
    END IF;
  END LOOP;

  IF changes <> '{}'::jsonb THEN
    INSERT INTO public.expense_logs (expense_id, changed_by, changes)
    VALUES (NEW.id, auth.uid(), changes);
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to log expense changes
CREATE TRIGGER on_expense_update
  AFTER UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_expense_changes();

-- Create payment_vouchers table
CREATE TABLE public.payment_vouchers (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id) ON DELETE SET NULL,
  payment_for TEXT NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('Credit', 'Debit')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE public.payment_vouchers
  ADD CONSTRAINT payment_vouchers_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id);

-- Create payment_voucher_logs table
CREATE TABLE public.payment_voucher_logs (
  id SERIAL PRIMARY KEY,
  payment_voucher_id INTEGER REFERENCES public.payment_vouchers(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_voucher_logs ENABLE ROW LEVEL SECURITY;

-- Payment Vouchers policies
CREATE POLICY "All authenticated users can view payment vouchers" ON public.payment_vouchers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Manager can insert payment vouchers" ON public.payment_vouchers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can update payment vouchers" ON public.payment_vouchers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can delete payment vouchers" ON public.payment_vouchers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Payment Voucher Logs policies
CREATE POLICY "Admin and Manager can view payment voucher logs" ON public.payment_voucher_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admin and Manager can insert payment voucher logs" ON public.payment_voucher_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('Admin', 'Manager')
    )
  );

-- Function to log payment voucher changes
CREATE OR REPLACE FUNCTION public.log_payment_voucher_changes()
RETURNS TRIGGER AS $
DECLARE
  changes jsonb := '{}'::jsonb;
  r record;
BEGIN
  FOR r IN SELECT * FROM jsonb_each(to_jsonb(NEW))
  LOOP
    IF r.key <> 'updated_at' AND r.value <> (to_jsonb(OLD) -> r.key) THEN
      changes := changes || jsonb_build_object(r.key, jsonb_build_object('old', (to_jsonb(OLD) -> r.key), 'new', r.value));
    END IF;
  END LOOP;

  IF changes <> '{}'::jsonb THEN
    INSERT INTO public.payment_voucher_logs (payment_voucher_id, changed_by, changes)
    VALUES (NEW.id, auth.uid(), changes);
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to log payment voucher changes
CREATE TRIGGER on_payment_voucher_update
  AFTER UPDATE ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_voucher_changes();

-- Function to log isteaching_challan changes
CREATE OR REPLACE FUNCTION public.log_isteaching_challan_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes jsonb := '{}'::jsonb;
  r record;
BEGIN
  FOR r IN SELECT * FROM jsonb_each(to_jsonb(NEW))
  LOOP
    IF r.key <> 'updated_at' AND r.value <> (to_jsonb(OLD) -> r.key) THEN
      changes := changes || jsonb_build_object(r.key, jsonb_build_object('old', (to_jsonb(OLD) -> r.key), 'new', r.value));
    END IF;
  END LOOP;

  IF changes <> '{}'::jsonb THEN
    INSERT INTO public.isteaching_challan_logs (challan_id, changed_by, changes)
    VALUES (NEW.id, auth.uid(), changes);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to log isteaching_challan changes
CREATE TRIGGER on_isteaching_challan_update
  AFTER UPDATE ON public.isteaching_challans
  FOR EACH ROW EXECUTE FUNCTION public.log_isteaching_challan_changes();

-- Set up first admin user (UPDATE - replace email with your actual email)
-- Note: This should be run AFTER you've signed up with your email in the app
-- UPDATE public.profiles
-- SET user_role = 'Admin',
--     first_name = 'Admin',
--     last_name = 'User'
-- WHERE email = 'your-email@example.com';



CREATE TABLE public.shorting_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ledger_id TEXT REFERENCES public.ledgers(ledger_id),
  weaver_challan_id INTEGER REFERENCES public.weaver_challans(id),
  quality_name TEXT,
  shorting_qty NUMERIC(10, 2) NOT NULL,
  weaver_challan_qty DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to explain the weaver_challan_qty column
COMMENT ON COLUMN public.shorting_entries.weaver_challan_qty IS 'Original quantity of the selected quality from the weaver challan at the time of shorting entry creation';
