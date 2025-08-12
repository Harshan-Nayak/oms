# Bhaktinandan OMS - Next.js Setup Guide

## 🚀 Quick Start

### 1. Install Missing Dependencies

```bash
npm install @radix-ui/react-label @radix-ui/react-avatar @radix-ui/react-checkbox tailwindcss-animate
```

### 2. Environment Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your Project URL and Anon Key

2. **Update Environment Variables**:
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edit_logs TEXT
);

-- Create weaver_challans table
CREATE TABLE public.weaver_challans (
  id SERIAL PRIMARY KEY,
  challan_date DATE NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  challan_no TEXT UNIQUE NOT NULL,
  ms_party_name TEXT NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id),
  delivery_at TEXT,
  bill_no TEXT,
  total_grey_mtr DECIMAL(10,2) NOT NULL,
  fold_cm DECIMAL(8,2),
  width_inch DECIMAL(8,2),
  taka INTEGER NOT NULL,
  transport_name TEXT,
  lr_number TEXT,
  transport_charge DECIMAL(10,2),
  quality_details JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edit_logs TEXT
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  po_date DATE NOT NULL,
  supplier_name TEXT NOT NULL,
  ledger_id TEXT REFERENCES ledgers(ledger_id),
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

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weaver_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

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

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ledger-documents', 'ledger-documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 4. Create Test User

In Supabase SQL editor, create a test admin user:

```sql
-- First, you need to sign up through the application or Supabase Auth
-- Then update the profile role:
UPDATE public.profiles 
SET user_role = 'Admin', 
    first_name = 'Admin', 
    last_name = 'User'
WHERE email = 'your-email@example.com';
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and you'll be redirected to the login page.

## 🔐 Default Login Credentials

After setting up, create a user through Supabase Auth and update their role to Admin:

- **Email**: your-email@example.com
- **Password**: your-password
- **Role**: Admin

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Authentication pages
│   ├── (dashboard)/           # Protected dashboard pages
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page (redirects)
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Layout components (sidebar, header)
│   └── dashboard/             # Dashboard-specific components
├── lib/
│   ├── supabase/              # Supabase configuration
│   └── utils.ts               # Utility functions
└── types/
    └── database.ts            # TypeScript types
```

## 🎯 Next Steps

1. **Set up Supabase project** ✅
2. **Configure environment variables** ✅
3. **Create database schema** ✅
4. **Test authentication** ✅
5. **Start building modules**:
   - Products Management
   - Ledger Management
   - Production Workflow
   - Purchase Orders
   - User Management

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure all Supabase credentials are correct
2. **Database Setup**: Ensure all tables and RLS policies are created
3. **Authentication**: Check if the user profile exists and has the correct role

### Support:

For issues or questions, check the README.md for detailed module implementation guides.
