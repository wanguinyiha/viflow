-- ViFlow Schema Fixes
-- Adds missing functions, policies table, and fixes

-- 1. Create the expire_old_invitations function
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'accepted')
    AND visit_end < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a trigger to run expire_old_invitations periodically
-- We'll use a per-statement trigger on invitations table
DROP TRIGGER IF EXISTS trigger_expire_old_invitations ON invitations;
CREATE TRIGGER trigger_expire_old_invitations
  AFTER INSERT ON invitations
  FOR EACH STATEMENT EXECUTE FUNCTION expire_old_invitations();

-- 3. Create a function to manually expire old invitations (can be called via cron or app)
CREATE OR REPLACE FUNCTION expire_stale_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'accepted')
    AND visit_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Add vehicle_plate to visitor_profiles if not exists (kept for backward compatibility)
-- Note: Vehicles are stored in the vehicles table, not in visitor_profiles

-- 5. Add visit_code generation function
CREATE OR REPLACE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visit_code IS NULL OR NEW.visit_code = '' THEN
    NEW.visit_code := 'VF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply visit_code trigger to invitations
DROP TRIGGER IF EXISTS trigger_generate_visit_code ON invitations;
CREATE TRIGGER trigger_generate_visit_code
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION generate_visit_code();

-- Apply visit_code trigger to visits
DROP TRIGGER IF EXISTS trigger_generate_visit_code_visits ON visits;
CREATE TRIGGER trigger_generate_visit_code_visits
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION generate_visit_code();

-- 6. Add policies table for system settings
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for policies
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policies_select_admin" ON policies FOR
SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "policies_insert_admin" ON policies FOR
INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "policies_update_admin" ON policies FOR
UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Add RLS policies for guard access to visits
-- Guards need to be able to insert visit_logs
CREATE POLICY "visit_logs_insert_guard_v2" ON visit_logs FOR
INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'guard'
  )
);

-- 8. Add RLS for notifications - allow system/service to insert
CREATE POLICY "notifications_insert_service" ON notifications FOR
INSERT WITH CHECK (true);

-- 9. Add audit_logs insert policy for authenticated users
CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. Ensure rooms have proper constraints
-- Add check that room_number follows format (A-01 to A-10, B-01 to B-10)
DO $$
BEGIN
  -- Drop existing check if any
  ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_room_number_format;
  ALTER TABLE rooms ADD CONSTRAINT rooms_room_number_format
    CHECK (room_number ~ '^[AB]-[0-9]{2}$');
EXCEPTION WHEN others THEN
  -- Constraint might already exist
  NULL;
END $$;

-- 11. Add function to check active visitor count
CREATE OR REPLACE FUNCTION check_active_visitor_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  max_limit INTEGER := 4;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM visits
  WHERE resident_id = NEW.resident_id
    AND status IN ('authorized', 'checked_in');

  IF active_count >= max_limit THEN
    RAISE EXCEPTION 'Active visitor limit (%) reached for this resident', max_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the limit check trigger
DROP TRIGGER IF EXISTS trigger_check_active_visitor_limit ON visits;
CREATE TRIGGER trigger_check_active_visitor_limit
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION check_active_visitor_limit();

-- 12. Seed default rooms if they don't exist
DO $$
DECLARE
  blk TEXT;
  room_num TEXT;
  floor_num INTEGER;
  i INTEGER;
BEGIN
  FOR blk IN SELECT unnest(ARRAY['A', 'B']) LOOP
    FOR i IN 1..10 LOOP
      room_num := blk || '-' || LPAD(i::TEXT, 2, '0');
      floor_num := CASE WHEN i <= 5 THEN 1 ELSE 2 END;

      IF NOT EXISTS (
        SELECT 1 FROM rooms r WHERE r.room_number = room_num AND r.block = blk
      ) THEN
        INSERT INTO rooms (room_number, block, floor, is_occupied)
        VALUES (room_num, blk, floor_num, FALSE);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 13. Add Grant for policies table
GRANT ALL ON policies TO service_role;
GRANT SELECT ON policies TO authenticated;

-- 14. Create index for policies
CREATE INDEX IF NOT EXISTS idx_policies_key ON policies (key);
