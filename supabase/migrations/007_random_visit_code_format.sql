-- Update visit_code generation to use full alphanumeric (5 chars, excluding confusing chars)
-- Format: VF-XXXXX where X is from ABCDEFGHJKLMNPQRSTUVWXYZ23456789
-- Excludes: I, O, 0, 1 (to avoid confusion)

CREATE OR REPLACE FUNCTION generate_visit_code()
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

      -- Check if code already exists in invitations or visits
      IF NOT EXISTS (
        SELECT 1 FROM invitations WHERE visit_code = code
        UNION ALL
        SELECT 1 FROM visits WHERE visit_code = code
      ) THEN
        NEW.visit_code := code;
        EXIT;
      END IF;

      -- Safety valve
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
