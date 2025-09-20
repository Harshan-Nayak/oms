-- Update batch history function to include quality_name as type in shorting entries
-- and more detailed information about stitching challans
CREATE OR REPLACE FUNCTION get_batch_history(batch_no TEXT)
RETURNS JSONB AS $
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'batch_number', wc.batch_number,
    'weaver_challan', jsonb_build_object(
      'date', wc.challan_date,
      'party', wc.ms_party_name,
      'quantity', wc.total_grey_mtr
    ),
    'shorting_entries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', se.entry_date,
        'quantity', se.shorting_qty,
        'type', se.quality_name
      ))
      FROM shorting_entries se
      WHERE se.weaver_challan_id = wc.id
    ), '[]'::jsonb),
    'isteaching_challans', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', ic.date,
        'challanNo', ic.challan_no,
        'product', ic.product_name,
        'quantity', ic.quantity,
        'top_qty', ic.top_qty,
        'top_pcs_qty', ic.top_pcs_qty,
        'bottom_qty', ic.bottom_qty,
        'bottom_pcs_qty', ic.bottom_pcs_qty,
        'both_selected', ic.both_selected,
        'both_top_qty', ic.both_top_qty,
        'both_bottom_qty', ic.both_bottom_qty
      ))
      FROM isteaching_challans ic
      WHERE ic.batch_number && ARRAY[wc.batch_number]
    ), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', e.expense_date,
        'amount', e.cost,
        'reason', e.expense_for
      ))
      FROM expenses e
      WHERE e.challan_no IN (
        SELECT ic.challan_no
        FROM isteaching_challans ic
        WHERE ic.batch_number && ARRAY[wc.batch_number]
      )
    ), '[]'::jsonb)
  )
  INTO result
  FROM weaver_challans wc
  WHERE wc.batch_number = batch_no;

  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;