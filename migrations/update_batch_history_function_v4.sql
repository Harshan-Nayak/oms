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
    )
  )
  INTO result
  FROM weaver_challans wc
  WHERE wc.batch_number = batch_no;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;