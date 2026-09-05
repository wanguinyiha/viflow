-- ViFlow Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.

-- =============================================
-- 1. ENUM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('visitor', 'resident', 'guard', 'admin');
CREATE TYPE visit_status AS ENUM ('pending', 'authorized', 'checked_in', 'checked_out', 'cancelled', 'expired');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- =============================================
-- 2. PROFILES (extends auth.users)
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'visitor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 3. VISITOR PROFILES (reusable visitor data)
-- =============================================

CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_document_url TEXT,
  id_verified BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  photo_verified BOOLEAN NOT NULL DEFAULT false,
  vehicle_plate TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. ROOMS
-- =============================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  block TEXT NOT NULL,
  resident_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_number, block)
);

-- =============================================
-- 5. INVITATIONS
-- =============================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_email TEXT NOT NULL,
  visit_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 6. VISITS
-- =============================================

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_code TEXT NOT NULL UNIQUE,  -- e.g. VF-2941
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  status visit_status NOT NULL DEFAULT 'pending',
  qr_code_data TEXT,  -- JSON payload encoded in the QR
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 7. VISIT LOG (audit trail)
-- =============================================

CREATE TABLE visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'authorized', 'checked_in', 'checked_out', 'cancelled'
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 8. POLICIES (hostel-level settings)
-- =============================================

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default policies
INSERT INTO policies (key, value) VALUES
  ('pass_expiry_same_day', 'true'),
  ('id_verification_required', 'true'),
  ('overnight_needs_warden', 'true');

-- =============================================
-- 9. INDEXES
-- =============================================

CREATE INDEX idx_visitor_profiles_user ON visitor_profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_invitations_resident ON invitations(resident_id);
CREATE INDEX idx_invitations_visitor_email ON invitations(visitor_email);
CREATE INDEX idx_visits_visitor ON visits(visitor_id);
CREATE INDEX idx_visits_resident ON visits(resident_id);
CREATE INDEX idx_visits_room ON visits(room_id);
CREATE INDEX idx_visits_code ON visits(visit_code);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visit_logs_visit ON visit_logs(visit_id);
CREATE INDEX idx_rooms_resident ON rooms(resident_id);

-- =============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Visitor profiles: owner can manage, guards/admins can read at check-in
CREATE POLICY "Visitors can manage own profile"
  ON visitor_profiles FOR ALL USING (
    user_id = auth.uid()
  );
CREATE POLICY "Guards can view visitor profiles"
  ON visitor_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

-- Rooms: everyone authenticated can read, admins can manage
CREATE POLICY "Authenticated users can view rooms"
  ON rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Invitations: resident can manage their own, visitor can see invites to their email
CREATE POLICY "Residents can manage own invitations"
  ON invitations FOR ALL USING (
    resident_id = auth.uid()
  );
CREATE POLICY "Visitors can view invitations to their email"
  ON invitations FOR SELECT USING (
    visitor_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Visits: participant access (visitor, resident, guard, admin)
CREATE POLICY "Participants can view visits"
  ON visits FOR SELECT USING (
    visitor_id = auth.uid()
    OR resident_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );
CREATE POLICY "Residents can create visits"
  ON visits FOR INSERT WITH CHECK (
    resident_id = auth.uid()
  );
CREATE POLICY "Guards can update visit status"
  ON visits FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard')
  );
CREATE POLICY "Admins can manage all visits"
  ON visits FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Visit logs: participants can read, guards can insert
CREATE POLICY "Participants can view visit logs"
  ON visit_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visits v
      WHERE v.id = visit_logs.visit_id
        AND (v.visitor_id = auth.uid() OR v.resident_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );
CREATE POLICY "Guards can insert visit logs"
  ON visit_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guard', 'admin'))
  );

-- Policies: admins can manage, everyone can read
CREATE POLICY "Authenticated users can view policies"
  ON policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage policies"
  ON policies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- 11. HELPER: Generate unique visit code
-- =============================================

CREATE OR REPLACE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'VF-' || LPAD(FLOOR(random() * 9999)::TEXT, 4, '0');
    SELECT INTO exists EXISTS (SELECT 1 FROM visits WHERE visit_code = code);
    EXIT WHEN NOT exists;
  END LOOP;
  NEW.visit_code := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_visit_code
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION generate_visit_code();
