# Setup.sql Database Schema Update - Summary

## Changes Made to setup.sql

### 1. Updated weaver_challans Table Definition
- **Added GST Fields from Migration**:
  - `sgst TEXT CHECK (sgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable'))`
  - `cgst TEXT CHECK (cgst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable'))`
  - `igst TEXT CHECK (igst IN ('2.5%', '5%', '6%', '9%', '12%', '18%', 'Not Applicable'))`
- **Added Documentation Comments**:
  - Added COMMENT statements for each GST field explaining their purpose

### 2. Updated isteaching_challans Table Definition
- **Added Product Fields from Migration**:
  - `category TEXT` - Product category
  - `sub_category TEXT` - Product sub category  
  - `status TEXT CHECK (status IN ('Active', 'Inactive', 'Pipeline')) DEFAULT 'Active'` - Product status with constraint
  - `brand TEXT` - Product brand
  - `made_in TEXT` - Manufacturing location

## Migration Files Integrated

### From `migrations/add_gst_fields_to_weaver_challans.sql`:
✅ **GST Fields Added**:
- SGST (State Goods and Services Tax)
- CGST (Central Goods and Services Tax)
- IGST (Integrated Goods and Services Tax)
- All with proper check constraints for valid percentage values
- Includes 'Not Applicable' option for cases where GST doesn't apply

### From `migrations/add_product_fields_to_isteaching_challans.sql`:
✅ **Product Fields Added**:
- Category field for product categorization
- Sub Category for more detailed classification
- Status field with constraint for Active/Inactive/Pipeline states
- Brand field for product branding
- Made In field for manufacturing location
- Note: wash_care_instructions removal logic not needed in setup.sql as it's a new table creation

## Benefits of Updated setup.sql

1. **Complete Schema**: New installations will have all fields from the start
2. **No Migration Required**: Fresh installations won't need to run separate migration files
3. **Consistency**: Schema matches the current application requirements
4. **Documentation**: Proper comments explain the purpose of GST fields
5. **Constraints**: Proper data validation through CHECK constraints

## Database Deployment Options

### For New Installations:
- Run the updated `setup.sql` directly
- All tables will be created with complete schema including GST and product fields

### For Existing Installations:
- Apply migration files in sequence:
  1. `migrations/add_product_fields_to_isteaching_challans.sql`
  2. `migrations/add_gst_fields_to_weaver_challans.sql`

## Schema Consistency Verification

### weaver_challans Table Now Includes:
- ✅ All original fields (challan_date, batch_number, etc.)
- ✅ GST fields (sgst, cgst, igst) with proper constraints
- ✅ Vendor fields (vendor_ledger_id, vendor_invoice_number, vendor_amount)
- ✅ Documentation comments for GST fields

### isteaching_challans Table Now Includes:
- ✅ All original fields (challan_no, date, quality, etc.)
- ✅ Product fields (category, sub_category, status, brand, made_in)
- ✅ Cloth details fields (cloth_type, top_qty, etc.)
- ✅ Proper constraints for status field

## Notes
- All new fields are optional (nullable) to maintain backward compatibility
- GST fields default to NULL (can be set to 'Not Applicable' in application)
- Product status field defaults to 'Active' for new records
- Check constraints ensure data integrity for enumerated values
- Schema supports both existing and new application features

## Files Updated
1. ✅ `setup.sql` - Updated with complete schema including new fields
2. ✅ Maintains compatibility with existing migration files
3. ✅ Ready for both fresh installations and existing database migrations