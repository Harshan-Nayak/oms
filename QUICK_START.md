# 🚀 **QUICK START GUIDE - Fix Supabase Error**

## ❌ **Current Error:** 
`TypeError: Invalid URL` - This happens because Supabase environment variables are not configured.

## ✅ **Solution 1: Set up Supabase (5 minutes)**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up/Login
3. Click "New Project"
4. Enter:
   - **Name:** `bhaktinandan-oms`
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to you
5. Click "Create new project" (takes 2-3 minutes)

### **Step 2: Get Your Credentials**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Keys** → **anon/public** key
   - **Project API Keys** → **service_role** key (⚠️ Keep secret!)

### **Step 3: Update Environment Variables**
Replace the content in your `oms-nextjs/.env.local` file:

```env
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 4: Run Database Setup**
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire content from `oms-nextjs/SETUP.md` (all the SQL)
4. Click "Run" to create tables and policies

### **Step 5: Start the App**
```bash
cd oms-nextjs
npm run dev
```

---

## ✅ **Solution 2: Quick Development Setup (1 minute)**

If you want to test the UI without setting up Supabase right now:

### **Update Environment Variables for Development**
Replace your `oms-nextjs/.env.local` with:

```env
# Temporary development setup
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo-key
SUPABASE_SERVICE_ROLE_KEY=demo-service-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Note:** This will let you see the UI, but authentication and data features won't work.

---

## 🎯 **Recommended: Use Solution 1**

**Solution 1** gives you the full working system with:
- ✅ Authentication
- ✅ Database operations
- ✅ File uploads
- ✅ All features working

**Choose Solution 1 for the complete experience!** 🚀
