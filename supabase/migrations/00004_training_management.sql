-- FireResponse - Training Management System
-- Migration: 00004_training_management.sql
--
-- Tables:
--   - training_courses: Course definitions and requirements
--   - training_records: Individual training completions
--   - certifications: Member certifications and licenses
--   - training_events: Scheduled training/drills/meetings
--   - training_event_attendance: Event attendance tracking

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE training_category AS ENUM (
  'fire',           -- Fire suppression training
  'ems',            -- Emergency medical services
  'hazmat',         -- Hazardous materials
  'leadership',     -- Officer/leadership development
  'rescue',         -- Technical rescue
  'driver',         -- Apparatus operator/driver
  'safety',         -- Safety and health
  'communications', -- Radio/dispatch operations
  'other'           -- Miscellaneous
);

CREATE TYPE training_type AS ENUM (
  'classroom',    -- In-person classroom instruction
  'practical',    -- Hands-on practical training
  'online',       -- Online/e-learning
  'drill',        -- Department drill
  'exercise',     -- Multi-agency exercise
  'conference',   -- Conference/seminar
  'self_study'    -- Self-study/reading
);

CREATE TYPE certification_status AS ENUM (
  'active',           -- Currently valid
  'expired',          -- Past expiration date
  'pending_renewal',  -- Within renewal window
  'revoked',          -- Revoked/suspended
  'pending'           -- Application submitted, awaiting approval
);

CREATE TYPE event_type AS ENUM (
  'training',     -- Training session
  'meeting',      -- Department meeting
  'drill',        -- Fire/rescue drill
  'maintenance',  -- Equipment/station maintenance
  'inspection',   -- Inspection event
  'community',    -- Community event
  'other'         -- Other event type
);

CREATE TYPE attendance_status AS ENUM (
  'registered',   -- Signed up, not yet attended
  'attended',     -- Attended the event
  'absent',       -- Did not attend (unexcused)
  'excused',      -- Did not attend (excused)
  'cancelled'     -- Registration cancelled
);

-- ============================================================================
-- TRAINING COURSES
-- ============================================================================

-- Course catalog - defines training courses available
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Course details
  name TEXT NOT NULL,
  description TEXT,
  category training_category NOT NULL DEFAULT 'other',

  -- Requirements
  required_for_roles user_role[] DEFAULT '{}', -- Which roles must complete this
  certification_required BOOLEAN DEFAULT FALSE,
  hours DECIMAL(5, 2), -- Expected training hours

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_courses_department ON training_courses(department_id);
CREATE INDEX idx_training_courses_category ON training_courses(department_id, category);
CREATE INDEX idx_training_courses_active ON training_courses(department_id) WHERE is_active = TRUE;

-- ============================================================================
-- TRAINING RECORDS
-- ============================================================================

-- Individual training completions
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES training_courses(id) ON DELETE SET NULL, -- Nullable for ad-hoc training

  -- Training details
  title TEXT NOT NULL,
  description TEXT,
  training_type training_type NOT NULL DEFAULT 'classroom',
  hours DECIMAL(5, 2) NOT NULL,

  -- When and where
  training_date DATE NOT NULL,
  instructor_name TEXT,
  location TEXT,

  -- Results
  passed BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Attachments (certificates, completion docs, etc.)
  attachments JSONB DEFAULT '[]', -- Array of {name, url, type}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_records_department ON training_records(department_id);
CREATE INDEX idx_training_records_user ON training_records(user_id);
CREATE INDEX idx_training_records_course ON training_records(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_training_records_date ON training_records(department_id, training_date DESC);
CREATE INDEX idx_training_records_user_date ON training_records(user_id, training_date DESC);

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================

-- Member certifications and licenses
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Certification details
  name TEXT NOT NULL,
  issuing_authority TEXT,
  certification_number TEXT,

  -- Dates
  issued_date DATE NOT NULL,
  expiration_date DATE, -- Null for non-expiring certifications

  -- Status
  status certification_status DEFAULT 'active',

  -- Documentation
  document_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_department ON certifications(department_id);
CREATE INDEX idx_certifications_user ON certifications(user_id);
CREATE INDEX idx_certifications_expiration ON certifications(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_certifications_status ON certifications(department_id, status);
CREATE INDEX idx_certifications_user_status ON certifications(user_id, status);

-- ============================================================================
-- TRAINING EVENTS
-- ============================================================================

-- Scheduled training sessions, meetings, drills, etc.
CREATE TABLE training_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'training',
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Instructor/lead
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Capacity
  max_attendees INTEGER, -- Null for unlimited

  -- Requirements
  is_mandatory BOOLEAN DEFAULT FALSE,

  -- Link to course (if applicable)
  course_id UUID REFERENCES training_courses(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_time is after start_time
  CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

CREATE INDEX idx_training_events_department ON training_events(department_id);
CREATE INDEX idx_training_events_start ON training_events(department_id, start_time);
CREATE INDEX idx_training_events_type ON training_events(department_id, event_type);
-- Note: Can't use NOW() in partial index, use regular index instead
CREATE INDEX idx_training_events_start_desc ON training_events(department_id, start_time DESC);
CREATE INDEX idx_training_events_instructor ON training_events(instructor_id) WHERE instructor_id IS NOT NULL;
CREATE INDEX idx_training_events_course ON training_events(course_id) WHERE course_id IS NOT NULL;

-- ============================================================================
-- TRAINING EVENT ATTENDANCE
-- ============================================================================

-- Attendance tracking for training events
CREATE TABLE training_event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attendance
  status attendance_status DEFAULT 'registered',
  check_in_time TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One attendance record per user per event
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendance_event ON training_event_attendance(event_id);
CREATE INDEX idx_event_attendance_user ON training_event_attendance(user_id);
CREATE INDEX idx_event_attendance_status ON training_event_attendance(event_id, status);
CREATE INDEX idx_event_attendance_user_status ON training_event_attendance(user_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_event_attendance ENABLE ROW LEVEL SECURITY;

-- Training courses policies
CREATE POLICY "Users can view training courses in their department"
  ON training_courses FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Command can manage training courses"
  ON training_courses FOR ALL
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Training records policies
CREATE POLICY "Users can view training records in their department"
  ON training_records FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Users can insert their own training records"
  ON training_records FOR INSERT
  WITH CHECK (
    department_id = get_user_department_id() AND
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Command can manage all training records"
  ON training_records FOR ALL
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Certifications policies
CREATE POLICY "Users can view certifications in their department"
  ON certifications FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Users can manage their own certifications"
  ON certifications FOR ALL
  USING (
    department_id = get_user_department_id() AND
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Command can manage all certifications"
  ON certifications FOR ALL
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Training events policies
CREATE POLICY "Users can view training events in their department"
  ON training_events FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Command can manage training events"
  ON training_events FOR ALL
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Event attendance policies
CREATE POLICY "Users can view attendance in their department"
  ON training_event_attendance FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM training_events WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Users can manage their own attendance"
  ON training_event_attendance FOR ALL
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid()) AND
    event_id IN (
      SELECT id FROM training_events WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Command can manage all attendance"
  ON training_event_attendance FOR ALL
  USING (
    is_command_level() AND
    event_id IN (
      SELECT id FROM training_events WHERE department_id = get_user_department_id()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for training_courses
CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON training_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get expiring certifications for a department
CREATE OR REPLACE FUNCTION get_expiring_certifications(
  p_department_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  certification_id UUID,
  user_id UUID,
  user_name TEXT,
  certification_name TEXT,
  expiration_date DATE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS certification_id,
    c.user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    c.name AS certification_name,
    c.expiration_date,
    (c.expiration_date - CURRENT_DATE)::INTEGER AS days_until_expiration
  FROM certifications c
  JOIN users u ON u.id = c.user_id
  WHERE c.department_id = p_department_id
    AND c.expiration_date IS NOT NULL
    AND c.expiration_date <= CURRENT_DATE + p_days_ahead
    AND c.status IN ('active', 'pending_renewal')
  ORDER BY c.expiration_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get training hours for a user in a date range
CREATE OR REPLACE FUNCTION get_user_training_hours(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_hours DECIMAL,
  by_category JSONB,
  by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tr.hours), 0) AS total_hours,
    COALESCE(
      jsonb_object_agg(
        COALESCE(tc.category::TEXT, 'other'),
        category_hours.hours
      ) FILTER (WHERE category_hours.hours IS NOT NULL),
      '{}'::JSONB
    ) AS by_category,
    COALESCE(
      jsonb_object_agg(
        tr2.training_type::TEXT,
        type_hours.hours
      ) FILTER (WHERE type_hours.hours IS NOT NULL),
      '{}'::JSONB
    ) AS by_type
  FROM training_records tr
  LEFT JOIN training_courses tc ON tc.id = tr.course_id
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(tc2.category::TEXT, 'other') AS cat,
      SUM(tr2.hours) AS hours
    FROM training_records tr2
    LEFT JOIN training_courses tc2 ON tc2.id = tr2.course_id
    WHERE tr2.user_id = p_user_id
      AND (p_start_date IS NULL OR tr2.training_date >= p_start_date)
      AND (p_end_date IS NULL OR tr2.training_date <= p_end_date)
    GROUP BY COALESCE(tc2.category::TEXT, 'other')
  ) category_hours ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      tr3.training_type,
      SUM(tr3.hours) AS hours
    FROM training_records tr3
    WHERE tr3.user_id = p_user_id
      AND (p_start_date IS NULL OR tr3.training_date >= p_start_date)
      AND (p_end_date IS NULL OR tr3.training_date <= p_end_date)
    GROUP BY tr3.training_type
  ) type_hours ON TRUE
  CROSS JOIN LATERAL (
    SELECT training_type FROM training_records WHERE user_id = p_user_id LIMIT 1
  ) tr2
  WHERE tr.user_id = p_user_id
    AND (p_start_date IS NULL OR tr.training_date >= p_start_date)
    AND (p_end_date IS NULL OR tr.training_date <= p_end_date)
  GROUP BY TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to auto-update certification status based on expiration
CREATE OR REPLACE FUNCTION update_certification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on expiration_date
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      -- Only change to pending_renewal if currently active
      IF NEW.status = 'active' THEN
        NEW.status := 'pending_renewal';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_certification_status
  BEFORE INSERT OR UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_certification_status();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for upcoming training events with attendance counts
CREATE OR REPLACE VIEW training_events_summary AS
SELECT
  te.*,
  u.first_name || ' ' || u.last_name AS instructor_name,
  tc.name AS course_name,
  COALESCE(att.registered_count, 0) AS registered_count,
  COALESCE(att.attended_count, 0) AS attended_count
FROM training_events te
LEFT JOIN users u ON u.id = te.instructor_id
LEFT JOIN training_courses tc ON tc.id = te.course_id
LEFT JOIN LATERAL (
  SELECT
    event_id,
    COUNT(*) FILTER (WHERE status = 'registered') AS registered_count,
    COUNT(*) FILTER (WHERE status = 'attended') AS attended_count
  FROM training_event_attendance
  WHERE event_id = te.id
  GROUP BY event_id
) att ON att.event_id = te.id;

-- View for member certification summary
CREATE OR REPLACE VIEW member_certifications_summary AS
SELECT
  u.id AS user_id,
  u.department_id,
  u.first_name,
  u.last_name,
  COUNT(c.id) AS total_certifications,
  COUNT(c.id) FILTER (WHERE c.status = 'active') AS active_count,
  COUNT(c.id) FILTER (WHERE c.status = 'expired') AS expired_count,
  COUNT(c.id) FILTER (WHERE c.status = 'pending_renewal') AS pending_renewal_count,
  MIN(c.expiration_date) FILTER (WHERE c.status IN ('active', 'pending_renewal')) AS next_expiration
FROM users u
LEFT JOIN certifications c ON c.user_id = u.id
GROUP BY u.id, u.department_id, u.first_name, u.last_name;
