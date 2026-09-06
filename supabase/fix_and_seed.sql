-- FIX: Recreate trigger functions and seed demo users
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. Recreate handle_new_user trigger function
-- =============================================
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

-- =============================================
-- 2. Recreate handle_new_visitor trigger function
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

-- =============================================
-- 3. Recreate triggers
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_visitor_created ON auth.users;
CREATE TRIGGER on_auth_visitor_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_visitor();

-- =============================================
-- 4. Ensure storage buckets exist
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('visitor-photos', 'visitor-photos', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. Create demo users directly via SQL
-- =============================================

-- Repair users created by an older version of this script. Supabase Auth
-- scans confirmation_token as a non-null string when handling password login.
UPDATE auth.users
SET confirmation_token = ''
WHERE confirmation_token IS NULL;

-- Admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@viflow.com';
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, created_at, updated_at, raw_user_meta_data, raw_app_meta_data)
    VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@viflow.com', crypt('admin123', gen_salt('bf')), now(), '', now(), now(), '{"full_name":"Sarah Mwangi","role":"admin"}', '{"provider":"email","providers":["email"]}');
  END IF;
END $$;

-- Resident
DO $$
DECLARE
  resident_id UUID;
BEGIN
  SELECT id INTO resident_id FROM auth.users WHERE email = 'resident@viflow.com';
  IF resident_id IS NULL THEN
    resident_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, created_at, updated_at, raw_user_meta_data, raw_app_meta_data)
    VALUES (resident_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'resident@viflow.com', crypt('resident123', gen_salt('bf')), now(), '', now(), now(), '{"full_name":"Tendai Wanjiru","role":"resident"}', '{"provider":"email","providers":["email"]}');
  END IF;
END $$;

-- Visitor
DO $$
DECLARE
  visitor_id UUID;
BEGIN
  SELECT id INTO visitor_id FROM auth.users WHERE email = 'visitor@viflow.com';
  IF visitor_id IS NULL THEN
    visitor_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, created_at, updated_at, raw_user_meta_data, raw_app_meta_data)
    VALUES (visitor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'visitor@viflow.com', crypt('visitor123', gen_salt('bf')), now(), '', now(), now(), '{"full_name":"Amara Kimani","role":"visitor"}', '{"provider":"email","providers":["email"]}');
  END IF;
END $$;

-- Guard
DO $$
DECLARE
  guard_id UUID;
BEGIN
  SELECT id INTO guard_id FROM auth.users WHERE email = 'guard@viflow.com';
  IF guard_id IS NULL THEN
    guard_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, created_at, updated_at, raw_user_meta_data, raw_app_meta_data)
    VALUES (guard_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guard@viflow.com', crypt('guard123', gen_salt('bf')), now(), '', now(), now(), '{"full_name":"James Otieno","role":"guard"}', '{"provider":"email","providers":["email"]}');
  END IF;
END $$;

-- =============================================
-- 6. Create hostel and rooms
-- =============================================
INSERT INTO hostels (name, address, total_rooms) VALUES ('Main Hostel', 'University Campus', 5)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  hostel_id UUID;
  resident_id UUID;
BEGIN
  SELECT id INTO hostel_id FROM hostels WHERE name = 'Main Hostel' LIMIT 1;
  SELECT id INTO resident_id FROM profiles WHERE email = 'resident@viflow.com';

  IF hostel_id IS NOT NULL THEN
    INSERT INTO rooms (room_number, block, floor, resident_id, is_occupied, hostel_id) VALUES
      ('214', 'C', 2, resident_id, true, hostel_id),
      ('108', 'A', 1, NULL, true, hostel_id),
      ('301', 'B', 3, NULL, true, hostel_id),
      ('205', 'C', 2, NULL, false, hostel_id),
      ('110', 'A', 1, NULL, false, hostel_id)
    ON CONFLICT (room_number, block) DO NOTHING;
  END IF;
END $$;

-- =============================================
-- 7. Verify
-- =============================================
SELECT 'Users:' as label, count(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles:', count(*) FROM profiles
UNION ALL
SELECT 'Visitor Profiles:', count(*) FROM visitor_profiles
UNION ALL
SELECT 'Rooms:', count(*) FROM rooms;
