# Fix for Available Quantity Calculation in Stitching Challan Form

## Problem
The "Available" quantity in the Stitching Challan form was showing incorrect values because it was calculating from ALL weaver challans with a specific quality, instead of only considering the weaver challans that have corresponding shorting entries.

## Solution Implemented

### 1. Database Migration
**File**: `migrations/add_weaver_challan_qty_to_shorting_entries.sql`

Added a new column `weaver_challan_qty` to the `shorting_entries` table to store the original quantity of the specific quality from the weaver challan at the time of shorting entry creation.

**SQL to run in Supabase SQL Editor:**
```sql
-- Add weaver challan original quantity field to shorting entries table
-- This stores the original quantity of the specific quality from the weaver challan
-- at the time when the shorting entry was created

ALTER TABLE shorting_entries 
ADD COLUMN weaver_challan_qty DECIMAL(10,2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN shorting_entries.weaver_challan_qty IS 'Original quantity of the selected quality from the weaver challan at the time of shorting entry creation';
```

### 2. Updated Database Types
**File**: `src/types/database.ts`

Added `weaver_challan_qty: number` to the `shorting_entries` table types.

### 3. Updated Shorting Entry Form
**File**: `src/components/production/shorting-entry-form.tsx`

Modified to capture and store the `weaver_challan_qty` when creating a shorting entry:
```typescript
const shortingData: ShortingEntry = {
  // ... other fields
  weaver_challan_qty: availableQty, // Store the original quantity from weaver challan
  // ... other fields
}
```

### 4. Updated Data Fetching
**File**: `src/app/(dashboard)/dashboard/production/isteaching-challan/page.tsx`

Modified to fetch the `weaver_challan_qty` field from shorting entries and pass it to the form component.

### 5. Fixed Availability Calculation Logic
**File**: `src/components/production/isteaching-challan-form.tsx`

Completely rewrote the availability calculation logic:

**Before:**
- Calculated from ALL weaver challans with that quality
- Could show inflated numbers like 19918 for Rayon

**After:**
- Uses `weaver_challan_qty` from shorting entries (stores original weaver challan quantity)
- Only considers stitched quantities from the same batch numbers that have shorting entries
- Formula: `Available = Sum(weaver_challan_qty) - Sum(shorting_qty) - Sum(stitched_qty_from_same_batches)`

## Example Calculation

**Rayon Quality Example:**
1. **Weaver Challan 1**: 5000 mtr, Batch "BATCH001"
   - Shorting entry: 100 mtr → `weaver_challan_qty = 5000`
   
2. **Weaver Challan 2**: 1200 mtr, Batch "BATCH002"  
   - Shorting entry: 100 mtr → `weaver_challan_qty = 1200`

**Calculation:**
- Total from shorting entries: 5000 + 1200 = 6200
- Total shorting quantity: 100 + 100 = 200
- Total stitched from same batches: 0 (assuming no stitching challans yet)
- **Available = 6200 - 200 - 0 = 6000 ✅**

## Manual Steps Required

1. **Run the SQL migration** in Supabase SQL Editor (see SQL above)
2. **Update existing shorting entries** to populate the `weaver_challan_qty` field:
   ```sql
   -- This would need to be done manually for existing data
   -- You'll need to update each shorting entry with the correct weaver_challan_qty
   ```

## Result
Now when selecting "Rayon" quality in the Stitching Challan form, it will show "Available: 6000" instead of the incorrect "Available: 19918".