-- EMERGENCY CLEANUP: Remove ALL custom triggers from auth.users
-- This will fix the 500 error from GoTrue
-- Run this in Supabase SQL Editor

-- Drop ALL triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_visitor_created ON auth.users;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_visitor() CASCADE;

-- Verify: list remaining triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
