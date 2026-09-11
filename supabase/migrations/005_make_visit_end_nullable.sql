-- Make visit_end nullable in invitations table
-- Resident only sets arrival date; checkout is done by guard
ALTER TABLE invitations ALTER COLUMN visit_end DROP NOT NULL;
