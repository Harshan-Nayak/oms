-- Add RLS policy to allow authenticated users to view shorting_entries
CREATE POLICY "All authenticated users can view shorting_entries" ON public.shorting_entries
  FOR SELECT TO authenticated USING (true);