-- FIX: Recreate trigger functions only
-- Run this in Supabase SQL Editor, then use the app's POST /api/seed endpoint

-- Recreate handle_new_user
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

-- Recreate handle_new_visitor
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

-- Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_visitor_created ON auth.users;
CREATE TRIGGER on_auth_visitor_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_visitor();

-- Ensure storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('visitor-photos', 'visitor-photos', false)
ON CONFLICT (id) DO NOTHING;
