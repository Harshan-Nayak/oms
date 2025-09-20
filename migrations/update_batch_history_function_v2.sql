CREATE OR REPLACE FUNCTION get_batch_history(batch_no TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  weaver_challan_id INT;
BEGIN
  -- Get the ID of the weaver_challan for the given batch number
  SELECT id INTO weaver_challan_id
  FROM weaver_challans
  WHERE batch_number = batch_no;

  -- If no weaver_challan is found, return NULL
  IF weaver_challan_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build the JSONB object with the batch history
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
        'quantity', se.shorting_qty
      ))
      FROM shorting_entries se
      WHERE se.weaver_challan_id = weaver_challan_id
    ), '[]'::jsonb),
    'isteaching_challans', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', ic.date,
        'challanNo', ic.challan_no,
        'product', ic.product_name,
        'quantity', ic.quantity
      ))
      FROM isteaching_challans ic
      WHERE batch_no = ANY(ic.batch_number)
    ), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', e.expense_date,
        'amount', e.cost,
        'reason', e.expense_for
      ))
      FROM expenses e
      JOIN isteaching_challans ic ON e.challan_no = ic.challan_no
      WHERE batch_no = ANY(ic.batch_number)
    ), '[]'::jsonb)
  )
  INTO result
  FROM weaver_challans wc
  WHERE wc.id = weaver_challan_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;