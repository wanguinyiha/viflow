-- Extend notifications table with entity references and notification/alert distinction
-- entity_type: 'invitation', 'visit', 'verification', 'activity_review', 'room', 'profile', null (general)
-- entity_id: UUID of the related entity (optional)
-- link: relative URL path to navigate to when clicked (e.g., '/dashboard/resident/invitations/abc123')
-- kind: 'notification' (informational) or 'alert' (requires attention/action)

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'notification';

-- Index for efficient unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);
-- Index for entity lookups
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications (entity_type, entity_id);
