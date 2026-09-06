-- ViFlow Complete Database Schema
-- Migration 002: Complete schema overhaul
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- =============================================
-- 1. UPDATE ENUM TYPES
-- =============================================

-- Add 'denied' to visit_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'visit_status'::regtype AND enumlabel = 'denied') THEN
    ALTER TYPE visit_status ADD VALUE 'denied' AFTER 'expired';
  END IF;
END $$;

-- Add 'cancelled' to invitation_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invitation_status'::regtype AND enumlabel = 'cancelled') THEN
    ALTER TYPE invitation_status ADD VALUE 'cancelled' AFTER 'expired';
  END IF;
END $$;

-- =============================================
-- 2. UPDATE VISITOR_PROFILES
-- =============================================

-- Add missing columns that code expects
ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;

-- =============================================
-- 3. CREATE HOSTELS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  total_rooms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. UPDATE ROOMS TABLE
-- =============================================

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor INTEGER NOT NULL DEFAULT 0;

-- =============================================
-- 5. RECREATE INVITATIONS TABLE
-- =============================================

-- Drop the old invitations table and recreate with correct schema
DROP TABLE IF EXISTS invitations CASCADE;

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_code TEXT NOT NULL UNIQUE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_email TEXT NOT NULL,
  visitor_name TEXT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
  visit_start TIMESTAMPTZ NOT NULL,
  visit_end TIMESTAMPTZ NOT NULL,
  reason TEXT,
  vehicle_registration TEXT,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generate unique visit code for invitations
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := 'VF-' || LPAD(FLOOR(random() * 9999)::TEXT, 4, '0');
    SELECT INTO code_exists EXISTS (SELECT 1 FROM invitations WHERE visit_code = code);
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.visit_code := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_invitation_code
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION generate_invitation_code();

-- =============================================
-- 6. UPDATE VISITS TABLE
-- =============================================

-- Add visitor_profile_id for linking to visitor_profiles
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_profile_id UUID REFERENCES visitor_profiles(id) ON DELETE SET NULL;

-- =============================================
-- 7. CREATE FAVOURITE_VISITORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS favourite_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resident_id, visitor_id)
);

-- =============================================
-- 8. CREATE VEHICLES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 9. CREATE AUDIT_LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 10. CREATE VERIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 11. POLICIES TABLE (keep existing)
-- =============================================

-- policies table already exists from 001, no changes needed

-- =============================================
-- 12. INDEXES
-- =============================================

-- Existing indexes (keep)
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_user ON visitor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_resident ON visits(resident_id);
CREATE INDEX IF NOT EXISTS idx_visits_room ON visits(room_id);
CREATE INDEX IF NOT EXISTS idx_visits_code ON visits(visit_code);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visit_logs_visit ON visit_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_rooms_resident ON rooms(resident_id);

-- New indexes
CREATE INDEX IF NOT EXISTS idx_invitations_visit_code ON invitations(visit_code);
CREATE INDEX IF NOT EXISTS idx_invitations_resident ON invitations(resident_id);
CREATE INDEX IF NOT EXISTS idx_invitations_visitor_id ON invitations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_invitations_visitor_email ON invitations(visitor_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_favourite_visitors_resident ON favourite_visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_favourite_visitors_visitor ON favourite_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_visitor ON vehicles(visitor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_verifications_visit ON verifications(visit_id);
CREATE INDEX IF NOT EXISTS idx_verifications_visitor ON verifications(visitor_id);
CREATE INDEX IF NOT EXISTS idx_hostels_name ON hostels(name);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_block ON rooms(block);

-- =============================================
-- 13. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on invitations (recreating)
DROP POLICY IF EXISTS "Residents can manage own invitations" ON invitations;
DROP POLICY IF EXISTS "Visitors can view invitations to their email" ON invitations;

-- PROFILES policies (keep existing, add admin insert for provisioning)
-- Existing policies remain:
--   "Users can view own profile"
--   "Admins can view all profiles"
--   "Users can update own profile"

-- Add: Admins can insert profiles (for provisioning guard/admin accounts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can insert profiles"
      ON profiles FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Add: Residents can view profiles of their visitors (for invitation display)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Residents can view visitor profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Residents can view visitor profiles"
      ON profiles FOR SELECT
      USING (
        role = 'visitor'
        AND EXISTS (
          SELECT 1 FROM invitations i
          WHERE i.visitor_id = profiles.id
          AND i.resident_id = auth.uid()
        )
      );
  END IF;
END $$;

-- VISITOR_PROFILES policies (update existing)
DROP POLICY IF EXISTS "Visitors can manage own profile" ON visitor_profiles;
DROP POLICY IF EXISTS "Guards can view visitor profiles" ON visitor_profiles;

CREATE POLICY "Visitors can manage own profile"
  ON visitor_profiles FOR ALL USING (
    user_id = auth.uid()
  );

CREATE POLICY "Guards and admins can view visitor profiles"
  ON visitor_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

CREATE POLICY "Residents can view their visitors' profiles"
  ON visitor_profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.visitor_id = visitor_profiles.user_id
      AND i.resident_id = auth.uid()
    )
  );

-- ROOMS policies (update existing)
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;

CREATE POLICY "Authenticated users can view rooms"
  ON rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INVITATIONS policies
CREATE POLICY "Residents can manage own invitations"
  ON invitations FOR ALL USING (
    resident_id = auth.uid()
  );

CREATE POLICY "Visitors can view invitations to their email"
  ON invitations FOR SELECT USING (
    visitor_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR visitor_id = auth.uid()
  );

CREATE POLICY "Guards can view all invitations"
  ON invitations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

-- VISITS policies (keep existing)
-- Existing policies remain

-- VISIT_LOGS policies (keep existing)
-- Existing policies remain

-- HOSTELS policies
CREATE POLICY "Authenticated users can view hostels"
  ON hostels FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage hostels"
  ON hostels FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- FAVOURITE_VISITORS policies
CREATE POLICY "Residents can manage own favourites"
  ON favourite_visitors FOR ALL USING (
    resident_id = auth.uid()
  );

CREATE POLICY "Admins can view all favourites"
  ON favourite_visitors FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- VEHICLES policies
CREATE POLICY "Visitors can manage own vehicles"
  ON vehicles FOR ALL USING (
    visitor_id = auth.uid()
  );

CREATE POLICY "Guards and admins can view vehicles"
  ON vehicles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

CREATE POLICY "Residents can view visitor vehicles"
  ON vehicles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.visitor_id = vehicles.visitor_id
      AND i.resident_id = auth.uid()
    )
  );

-- AUDIT_LOGS policies
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guards and admins can insert audit logs"
  ON audit_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

-- VERIFICATIONS policies
CREATE POLICY "Guards can manage verifications"
  ON verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard')
  );

CREATE POLICY "Admins can view all verifications"
  ON verifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Visitors can view own verifications"
  ON verifications FOR SELECT USING (
    visitor_id = auth.uid()
  );

-- POLICIES table (keep existing)
-- Existing policies remain

-- =============================================
-- 14. BUSINESS RULE: 4-Active-Visitor Limit
-- =============================================

CREATE OR REPLACE FUNCTION check_active_visitor_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  max_visitors INTEGER := 4;
BEGIN
  -- Count active visits (authorized or checked_in) for this resident
  SELECT COUNT(*) INTO active_count
  FROM visits
  WHERE resident_id = NEW.resident_id
  AND status IN ('authorized', 'checked_in');

  IF active_count >= max_visitors THEN
    RAISE EXCEPTION 'Maximum active visitors (%) reached for this resident. Current active: %', max_visitors, active_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_active_visitor_limit') THEN
    CREATE TRIGGER enforce_active_visitor_limit
      BEFORE INSERT ON visits
      FOR EACH ROW
      WHEN (NEW.status IN ('authorized', 'checked_in'))
      EXECUTE FUNCTION check_active_visitor_limit();
  END IF;
END $$;

-- =============================================
-- 15. BUSINESS RULE: Auto-expire invitations
-- =============================================

CREATE OR REPLACE FUNCTION auto_expire_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = now()
  WHERE status IN ('pending', 'accepted')
  AND visit_end < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 16. BUSINESS RULE: Prevent invitation reuse
-- =============================================

CREATE OR REPLACE FUNCTION check_invitation_reuse()
RETURNS TRIGGER AS $$
DECLARE
  existing_visit INTEGER;
BEGIN
  -- Check if this invitation already has a visit
  SELECT COUNT(*) INTO existing_visit
  FROM visits
  WHERE invitation_id = NEW.invitation_id;

  IF existing_visit > 0 THEN
    RAISE EXCEPTION 'This invitation has already been used. Each visit requires a new invitation.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_invitation_reuse') THEN
    CREATE TRIGGER prevent_invitation_reuse
      BEFORE INSERT ON visits
      FOR EACH ROW
      WHEN (NEW.invitation_id IS NOT NULL)
      EXECUTE FUNCTION check_invitation_reuse();
  END IF;
END $$;

-- =============================================
-- 17. HELPER: Updated_at trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
    CREATE TRIGGER set_updated_at_profiles
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_visitor_profiles') THEN
    CREATE TRIGGER set_updated_at_visitor_profiles
      BEFORE UPDATE ON visitor_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_invitations') THEN
    CREATE TRIGGER set_updated_at_invitations
      BEFORE UPDATE ON invitations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_visits') THEN
    CREATE TRIGGER set_updated_at_visits
      BEFORE UPDATE ON visits
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_vehicles') THEN
    CREATE TRIGGER set_updated_at_vehicles
      BEFORE UPDATE ON vehicles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_hostels') THEN
    CREATE TRIGGER set_updated_at_hostels
      BEFORE UPDATE ON hostels
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- =============================================
-- 18. HELPER: Auto-create visitor_profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_visitor()
RETURNS TRIGGER AS $$
BEGIN
  IF (COALESCE(NEW.raw_user_meta_data->>'role', 'visitor') = 'visitor') THEN
    INSERT INTO public.visitor_profiles (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger to also create visitor profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add a second trigger for visitor profile creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_visitor_created') THEN
    CREATE TRIGGER on_auth_visitor_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_visitor();
  END IF;
END $$;
