-- Fix missing INSERT/UPDATE RLS policies that block registration flow
-- visitor_profiles: visitors need to insert/update their own profile
CREATE POLICY "visitor_profiles_insert_own" ON visitor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visitor_profiles_update_own" ON visitor_profiles FOR UPDATE USING (auth.uid() = user_id);

-- visits: allow insert for authenticated users (registration creates visits from invitations)
CREATE POLICY "visits_insert_authenticated" ON visits FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- vehicles: visitors need to insert their own vehicles
CREATE POLICY "vehicles_insert_own" ON vehicles FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM visitor_profiles
        WHERE id = visitor_id AND user_id = auth.uid()
    )
);
