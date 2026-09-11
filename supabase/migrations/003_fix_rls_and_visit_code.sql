-- ViFlow Hotfix: RLS + visit_code collision fix

-- 1. Fix visit_code generation to avoid collisions
-- Use a loop that retries with new random codes if collision occurs
CREATE OR REPLACE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
  attempts INTEGER := 0;
  code TEXT;
BEGIN
  IF NEW.visit_code IS NULL OR NEW.visit_code = '' THEN
    LOOP
      code := 'VF-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || RANDOM()::TEXT) FROM 1 FOR 4));
      attempts := attempts + 1;

      -- Check if code already exists in invitations or visits
      IF NOT EXISTS (
        SELECT 1 FROM invitations WHERE visit_code = code
        UNION ALL
        SELECT 1 FROM visits WHERE visit_code = code
      ) THEN
        NEW.visit_code := code;
        EXIT;
      END IF;

      -- Safety valve: if we somehow can't generate a unique code after 10 tries, use UUID suffix
      IF attempts >= 10 THEN
        NEW.visit_code := 'VF-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 4));
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Allow authenticated residents to lookup visitor_profiles by email
-- This is needed for the invitation flow where the resident checks if a visitor already exists
CREATE POLICY "visitor_profiles_select_email_lookup" ON visitor_profiles FOR
SELECT USING (
  auth.role() = 'authenticated'
);
