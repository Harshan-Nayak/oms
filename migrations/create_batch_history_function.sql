CREATE OR REPLACE FUNCTION get_batch_history(batch_no TEXT)
RETURNS JSONB AS $$
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
    'shorting_entries', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', se.entry_date,
        'quantity', se.shorting_qty
      ))
      FROM shorting_entries se
      WHERE se.weaver_challan_id = wc.id
    ),
    'isteaching_challans', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', ic.date,
        'challanNo', ic.challan_no,
        'product', ic.product_name,
        'quantity', ic.quantity
      ))
      FROM isteaching_challans ic
      WHERE ic.batch_number && ARRAY[wc.batch_number]
    ),
    'expenses', (
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
    )
  )
  INTO result
  FROM weaver_challans wc
  WHERE wc.batch_number = batch_no;

  RETURN result;
END;
$$ LANGUAGE plpgsql;