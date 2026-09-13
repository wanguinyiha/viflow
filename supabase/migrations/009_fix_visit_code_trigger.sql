-- Force replace the visit_code trigger with alphanumeric format
-- This ensures the old hex-only trigger is completely replaced

-- 1. Drop existing triggers
DROP TRIGGER IF EXISTS trigger_generate_visit_code ON invitations;
DROP TRIGGER IF EXISTS trigger_generate_visit_code_visits ON visits;

-- 2. Drop and recreate the function
DROP FUNCTION IF EXISTS generate_visit_code();

CREATE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  attempts INTEGER := 0;
BEGIN
  IF NEW.visit_code IS NULL OR NEW.visit_code = '' THEN
    LOOP
      code := 'VF-';
      FOR i IN 1..5 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      attempts := attempts + 1;

      IF NOT EXISTS (
        SELECT 1 FROM invitations WHERE visit_code = code
        UNION ALL
        SELECT 1 FROM visits WHERE visit_code = code
      ) THEN
        NEW.visit_code := code;
        EXIT;
      END IF;

      IF attempts >= 10 THEN
        code := 'VF-';
        FOR i IN 1..5 LOOP
          code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        NEW.visit_code := code;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-create triggers
CREATE TRIGGER trigger_generate_visit_code
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION generate_visit_code();

CREATE TRIGGER trigger_generate_visit_code_visits
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION generate_visit_code();
