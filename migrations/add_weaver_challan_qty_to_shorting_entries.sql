-- Add weaver challan original quantity field to shorting entries table
-- This stores the original quantity of the specific quality from the weaver challan
-- at the time when the shorting entry was created

ALTER TABLE shorting_entries 
ADD COLUMN weaver_challan_qty DECIMAL(10,2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN shorting_entries.weaver_challan_qty IS 'Original quantity of the selected quality from the weaver challan at the time of shorting entry creation';