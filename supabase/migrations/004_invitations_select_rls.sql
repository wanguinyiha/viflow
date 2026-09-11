-- Allow authenticated users (guards) to search invitations by visit_code
-- This is needed for the guard verify fallback search
CREATE POLICY "invitations_select_by_visit_code" ON invitations FOR
SELECT USING (
  auth.role() = 'authenticated'
);
