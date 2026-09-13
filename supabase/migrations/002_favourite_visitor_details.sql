-- Add resident-stored visitor details to favourite_visitors
-- These store the resident's cached copy of visitor info so they can
-- update phone/email if the visitor changes their details

ALTER TABLE favourite_visitors
  ADD COLUMN visitor_name TEXT,
  ADD COLUMN visitor_email TEXT,
  ADD COLUMN visitor_phone TEXT;

-- Allow residents to update their own favourites
CREATE POLICY "favourite_visitors_update_own" ON favourite_visitors FOR
UPDATE USING (auth.uid () = resident_id);
