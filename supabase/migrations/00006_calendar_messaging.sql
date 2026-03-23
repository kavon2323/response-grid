-- FireResponse - Calendar/Scheduling and Group Messaging
-- Migration: 00006_calendar_messaging.sql

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Note: event_type already exists from 00004_training_management.sql
-- Add 'social' value if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'social' AND enumtypid = 'event_type'::regtype) THEN
    ALTER TYPE event_type ADD VALUE 'social';
  END IF;
END $$;

CREATE TYPE event_recurring AS ENUM (
  'none',
  'daily',
  'weekly',
  'monthly'
);

CREATE TYPE rsvp_status AS ENUM (
  'yes',
  'no',
  'maybe'
);

CREATE TYPE announcement_priority AS ENUM (
  'normal',
  'important',
  'urgent'
);

CREATE TYPE message_target_type AS ENUM (
  'all',
  'role',
  'station',
  'custom'
);

-- ============================================================================
-- CALENDAR / EVENTS
-- ============================================================================

-- Department events (meetings, trainings, drills, etc.)
CREATE TABLE department_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'other',
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,

  -- Recurrence
  recurring event_recurring DEFAULT 'none',
  recurring_until TIMESTAMPTZ,

  -- Creator
  created_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Options
  is_mandatory BOOLEAN DEFAULT FALSE,
  notify_members BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_department_events_department ON department_events(department_id);
CREATE INDEX idx_department_events_start_time ON department_events(start_time);
CREATE INDEX idx_department_events_type ON department_events(event_type);
CREATE INDEX idx_department_events_created_by ON department_events(created_by_user_id);

-- Event RSVPs
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES department_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response
  status rsvp_status NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(status);

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================

-- Department announcements / bulletin board
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority announcement_priority DEFAULT 'normal',

  -- Creator
  posted_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Targeting (null = all members)
  target_roles user_role[],

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Display options
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Read tracking (array of user IDs who have read)
  read_by UUID[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_department ON announcements(department_id);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_posted_by ON announcements(posted_by_user_id);
CREATE INDEX idx_announcements_expires ON announcements(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_announcements_pinned ON announcements(department_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);

-- ============================================================================
-- GROUP MESSAGING
-- ============================================================================

-- Group messages
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Sender
  sender_user_id UUID NOT NULL REFERENCES users(id),

  -- Content
  subject TEXT,
  body TEXT NOT NULL,

  -- Targeting
  target_type message_target_type NOT NULL DEFAULT 'all',
  target_roles user_role[],           -- Used when target_type = 'role'
  target_station_ids UUID[],          -- Used when target_type = 'station'
  target_user_ids UUID[],             -- Used when target_type = 'custom'

  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_messages_department ON group_messages(department_id);
CREATE INDEX idx_group_messages_sender ON group_messages(sender_user_id);
CREATE INDEX idx_group_messages_target_type ON group_messages(target_type);
CREATE INDEX idx_group_messages_sent ON group_messages(sent_at DESC);

-- Message read receipts
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE department_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Department Events policies
CREATE POLICY "Users can view events in their department"
  ON department_events FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Command can create events"
  ON department_events FOR INSERT
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can update events in their department"
  ON department_events FOR UPDATE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can delete events in their department"
  ON department_events FOR DELETE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Event RSVP policies
CREATE POLICY "Users can view RSVPs for events in their department"
  ON event_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM department_events WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Users can create their own RSVPs"
  ON event_rsvps FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND
    event_id IN (
      SELECT id FROM department_events WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Users can update their own RSVPs"
  ON event_rsvps FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own RSVPs"
  ON event_rsvps FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Announcements policies
CREATE POLICY "Users can view announcements in their department"
  ON announcements FOR SELECT
  USING (
    department_id = get_user_department_id() AND
    (
      -- Not expired (or no expiration)
      expires_at IS NULL OR expires_at > NOW()
    ) AND
    (
      -- Targeted to all or user's role
      target_roles IS NULL OR
      get_user_role() = ANY(target_roles)
    )
  );

CREATE POLICY "Command can view all announcements in their department"
  ON announcements FOR SELECT
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can update announcements in their department"
  ON announcements FOR UPDATE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can delete announcements in their department"
  ON announcements FOR DELETE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Group Messages policies
CREATE POLICY "Users can view messages targeted to them"
  ON group_messages FOR SELECT
  USING (
    department_id = get_user_department_id() AND
    (
      target_type = 'all' OR
      (target_type = 'role' AND get_user_role() = ANY(target_roles)) OR
      (target_type = 'station' AND (SELECT primary_station_id FROM users WHERE auth_id = auth.uid()) = ANY(target_station_ids)) OR
      (target_type = 'custom' AND (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(target_user_ids))
    )
  );

CREATE POLICY "Command can view all messages in their department"
  ON group_messages FOR SELECT
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can delete messages in their department"
  ON group_messages FOR DELETE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Message Reads policies
CREATE POLICY "Users can view read receipts for messages they can access"
  ON message_reads FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM group_messages WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND
    message_id IN (
      SELECT id FROM group_messages WHERE department_id = get_user_department_id()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to mark an announcement as read by a user
CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();

  UPDATE announcements
  SET read_by = array_append(read_by, v_user_id)
  WHERE id = p_announcement_id
    AND department_id = get_user_department_id()
    AND NOT (v_user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread announcement count for current user
CREATE OR REPLACE FUNCTION get_unread_announcement_count()
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_count INTEGER;
BEGIN
  SELECT id, role INTO v_user_id, v_user_role FROM users WHERE auth_id = auth.uid();

  SELECT COUNT(*) INTO v_count
  FROM announcements
  WHERE department_id = get_user_department_id()
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (target_roles IS NULL OR v_user_role = ANY(target_roles))
    AND NOT (v_user_id = ANY(read_by));

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get unread message count for current user
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();

  SELECT COUNT(*) INTO v_count
  FROM group_messages gm
  WHERE gm.department_id = get_user_department_id()
    AND (
      gm.target_type = 'all' OR
      (gm.target_type = 'role' AND get_user_role() = ANY(gm.target_roles)) OR
      (gm.target_type = 'station' AND (SELECT primary_station_id FROM users WHERE id = v_user_id) = ANY(gm.target_station_ids)) OR
      (gm.target_type = 'custom' AND v_user_id = ANY(gm.target_user_ids))
    )
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr WHERE mr.message_id = gm.id AND mr.user_id = v_user_id
    );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get upcoming events for a user
CREATE OR REPLACE FUNCTION get_upcoming_events(p_days INTEGER DEFAULT 30)
RETURNS SETOF department_events AS $$
BEGIN
  RETURN QUERY
  SELECT de.*
  FROM department_events de
  WHERE de.department_id = get_user_department_id()
    AND de.start_time >= NOW()
    AND de.start_time <= NOW() + (p_days || ' days')::INTERVAL
  ORDER BY de.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
