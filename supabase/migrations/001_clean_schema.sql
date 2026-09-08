-- ViFlow Clean Schema
-- One hostel, Block A (rooms 1-10), Block B (rooms 1-10)
-- Four roles: admin, resident, guard, visitor

-- ENUMS

CREATE TYPE user_role AS ENUM ('admin', 'resident', 'guard', 'visitor');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');
CREATE TYPE visit_status AS ENUM ('pending', 'authorized', 'checked_in', 'checked_out', 'cancelled', 'expired', 'denied');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- TABLES

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  block TEXT NOT NULL CHECK (block IN ('A', 'B')),
  floor INTEGER NOT NULL CHECK (floor IN (1, 2)),
  is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_number, block)
);

CREATE TABLE resident_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE RESTRICT,
  student_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  id_number TEXT,
  id_document_url TEXT,
  id_verified BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url TEXT,
  photo_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(registration_number)
);

CREATE TABLE favourite_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resident_id, visitor_id)
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_code TEXT NOT NULL UNIQUE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitor_profiles(id) ON DELETE SET NULL,
  visitor_email TEXT NOT NULL,
  visitor_name TEXT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  visit_start TIMESTAMPTZ NOT NULL,
  visit_end TIMESTAMPTZ NOT NULL,
  reason TEXT,
  vehicle_registration TEXT,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  visit_code TEXT NOT NULL,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  status visit_status NOT NULL DEFAULT 'pending',
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('flagged', 'resolved', 'escalated')),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- INDEXES

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_rooms_block ON rooms(block);
CREATE INDEX idx_rooms_is_occupied ON rooms(is_occupied);
CREATE INDEX idx_resident_profiles_user_id ON resident_profiles(user_id);
CREATE INDEX idx_resident_profiles_room_id ON resident_profiles(room_id);
CREATE INDEX idx_visitor_profiles_user_id ON visitor_profiles(user_id);
CREATE INDEX idx_visitor_profiles_email ON visitor_profiles(email);
CREATE INDEX idx_vehicles_visitor_id ON vehicles(visitor_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX idx_favourite_visitors_resident ON favourite_visitors(resident_id);
CREATE INDEX idx_favourite_visitors_visitor ON favourite_visitors(visitor_id);
CREATE INDEX idx_invitations_resident_id ON invitations(resident_id);
CREATE INDEX idx_invitations_visitor_id ON invitations(visitor_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_visit_code ON invitations(visit_code);
CREATE INDEX idx_visits_invitation_id ON visits(invitation_id);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_resident_id ON visits(resident_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_visit_code ON visits(visit_code);
CREATE INDEX idx_visit_logs_visit_id ON visit_logs(visit_id);
CREATE INDEX idx_visit_logs_action ON visit_logs(action);
CREATE INDEX idx_verifications_visit_id ON verifications(visit_id);
CREATE INDEX idx_verifications_visitor_id ON verifications(visitor_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_activity_reviews_visit_id ON activity_reviews(visit_id);
CREATE INDEX idx_activity_reviews_action ON activity_reviews(action);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
-- RLS POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- rooms
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rooms_insert_admin" ON rooms FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "rooms_update_admin" ON rooms FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "rooms_delete_admin" ON rooms FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- resident_profiles
CREATE POLICY "resident_profiles_select_own" ON resident_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resident_profiles_select_admin" ON resident_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "resident_profiles_insert_admin" ON resident_profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "resident_profiles_update_admin" ON resident_profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "resident_profiles_delete_admin" ON resident_profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- visitor_profiles
CREATE POLICY "visitor_profiles_select_own" ON visitor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "visitor_profiles_select_admin_guard" ON visitor_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guard')));

-- vehicles
CREATE POLICY "vehicles_select_own" ON vehicles FOR SELECT USING (EXISTS (SELECT 1 FROM visitor_profiles WHERE id = visitor_id AND user_id = auth.uid()));
CREATE POLICY "vehicles_select_admin_guard" ON vehicles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guard')));

-- favourite_visitors
CREATE POLICY "favourite_visitors_select_own" ON favourite_visitors FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "favourite_visitors_insert_own" ON favourite_visitors FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "favourite_visitors_delete_own" ON favourite_visitors FOR DELETE USING (auth.uid() = resident_id);

-- invitations
CREATE POLICY "invitations_select_resident" ON invitations FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "invitations_select_visitor" ON invitations FOR SELECT USING (EXISTS (SELECT 1 FROM visitor_profiles WHERE id = visitor_id AND user_id = auth.uid()));
CREATE POLICY "invitations_select_admin" ON invitations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "invitations_insert_resident" ON invitations FOR INSERT WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "invitations_update_resident" ON invitations FOR UPDATE USING (auth.uid() = resident_id);
CREATE POLICY "invitations_update_admin" ON invitations FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- visits
CREATE POLICY "visits_select_resident" ON visits FOR SELECT USING (auth.uid() = resident_id);
CREATE POLICY "visits_select_visitor" ON visits FOR SELECT USING (EXISTS (SELECT 1 FROM visitor_profiles WHERE id = visitor_id AND user_id = auth.uid()));
CREATE POLICY "visits_select_admin" ON visits FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "visits_select_guard" ON visits FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));
CREATE POLICY "visits_update_guard" ON visits FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));

-- visit_logs
CREATE POLICY "visit_logs_select_admin" ON visit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "visit_logs_select_guard" ON visit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));
CREATE POLICY "visit_logs_insert_guard" ON visit_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));

-- verifications
CREATE POLICY "verifications_select_admin" ON verifications FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "verifications_select_guard" ON verifications FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));
CREATE POLICY "verifications_insert_guard" ON verifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));
CREATE POLICY "verifications_update_guard" ON verifications FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));

-- audit_logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- activity_reviews
CREATE POLICY "activity_reviews_select_admin" ON activity_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "activity_reviews_insert_admin" ON activity_reviews FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (auth.uid() = user_id);
-- FUNCTIONS & TRIGGERS

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_resident_profiles_updated_at BEFORE UPDATE ON resident_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_visitor_profiles_updated_at BEFORE UPDATE ON visitor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
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

CREATE TRIGGER trigger_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Limit active visitors to 4 per resident
CREATE OR REPLACE FUNCTION limit_active_visitors()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM visits
  WHERE resident_id = NEW.resident_id
    AND status IN ('pending', 'authorized', 'checked_in');

  IF active_count >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 active visitors per resident reached';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limit_active_visitors
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION limit_active_visitors();

-- Auto-generate visit code
CREATE OR REPLACE FUNCTION auto_generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
  next_code INTEGER;
  new_code TEXT;
BEGIN
  IF NEW.visit_code IS NULL OR NEW.visit_code = '' THEN
    SELECT COALESCE(MAX(REPLACE(visit_code, 'VF-', '')::INTEGER), 0) + 1
    INTO next_code
    FROM invitations
    WHERE visit_code LIKE 'VF-%';

    new_code := 'VF-' || LPAD(next_code::TEXT, 3, '0');
    NEW.visit_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_visit_code
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION auto_generate_visit_code();

-- Auto-expire old invitations
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

CREATE TRIGGER trigger_expire_old_invitations
  AFTER INSERT ON invitations
  FOR EACH STATEMENT EXECUTE FUNCTION expire_old_invitations();
