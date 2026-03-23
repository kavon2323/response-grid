-- FireResponse - Apparatus Maintenance and Truck Checks
-- Migration: 00005_apparatus_maintenance.sql

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE maintenance_type AS ENUM (
  'scheduled',    -- Regular scheduled maintenance
  'repair',       -- Unscheduled repair
  'inspection',   -- Required inspection
  'recall'        -- Manufacturer recall
);

CREATE TYPE maintenance_status AS ENUM (
  'scheduled',    -- Planned for future
  'in_progress',  -- Currently being worked on
  'completed',    -- Finished
  'cancelled'     -- Cancelled/not needed
);

CREATE TYPE check_type AS ENUM (
  'daily',        -- Daily truck check
  'weekly',       -- Weekly inspection
  'monthly',      -- Monthly inspection
  'annual'        -- Annual inspection
);

CREATE TYPE check_status AS ENUM (
  'passed',           -- All items passed
  'failed',           -- Critical failure
  'needs_attention'   -- Minor issues found
);

CREATE TYPE issue_severity AS ENUM (
  'low',       -- Minor issue, can wait
  'medium',    -- Should be addressed soon
  'high',      -- Needs prompt attention
  'critical'   -- Apparatus should not be used
);

CREATE TYPE issue_status AS ENUM (
  'open',        -- Newly reported
  'in_progress', -- Being worked on
  'resolved',    -- Fixed
  'deferred'     -- Intentionally postponed
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Apparatus Maintenance Records
CREATE TABLE apparatus_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apparatus_id UUID NOT NULL REFERENCES apparatus(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Maintenance details
  maintenance_type maintenance_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Who performed the work
  performed_by TEXT, -- Can be external vendor or member name
  vendor TEXT,
  cost DECIMAL(10, 2),

  -- Vehicle readings at time of maintenance
  odometer_reading INTEGER,
  engine_hours DECIMAL(10, 2),

  -- Scheduling
  scheduled_date DATE,
  completed_date DATE,
  next_due_date DATE,

  -- Status
  status maintenance_status DEFAULT 'scheduled',

  -- Parts and notes
  parts_used JSONB DEFAULT '[]', -- Array of {name, quantity, cost, part_number}
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apparatus_maintenance_apparatus ON apparatus_maintenance(apparatus_id);
CREATE INDEX idx_apparatus_maintenance_department ON apparatus_maintenance(department_id);
CREATE INDEX idx_apparatus_maintenance_status ON apparatus_maintenance(status);
CREATE INDEX idx_apparatus_maintenance_scheduled ON apparatus_maintenance(scheduled_date) WHERE status = 'scheduled';
CREATE INDEX idx_apparatus_maintenance_next_due ON apparatus_maintenance(next_due_date) WHERE next_due_date IS NOT NULL;

-- Apparatus Checks (Daily/Weekly/Monthly inspections)
CREATE TABLE apparatus_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apparatus_id UUID NOT NULL REFERENCES apparatus(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Check details
  check_type check_type NOT NULL,
  performed_by_user_id UUID NOT NULL REFERENCES users(id),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Vehicle readings
  odometer_reading INTEGER,
  fuel_level INTEGER, -- Percentage 0-100

  -- Results
  status check_status NOT NULL,
  checklist_items JSONB DEFAULT '[]', -- Array of {item, passed, notes}
  overall_notes TEXT,
  issues_found JSONB DEFAULT '[]', -- Array of {description, severity, photo_url}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apparatus_checks_apparatus ON apparatus_checks(apparatus_id);
CREATE INDEX idx_apparatus_checks_department ON apparatus_checks(department_id);
CREATE INDEX idx_apparatus_checks_date ON apparatus_checks(check_date DESC);
CREATE INDEX idx_apparatus_checks_user ON apparatus_checks(performed_by_user_id);
CREATE INDEX idx_apparatus_checks_status ON apparatus_checks(status) WHERE status != 'passed';

-- Apparatus Issues (Problems reported by members)
CREATE TABLE apparatus_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apparatus_id UUID NOT NULL REFERENCES apparatus(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- Reporter
  reported_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  severity issue_severity NOT NULL DEFAULT 'medium',

  -- Status tracking
  status issue_status DEFAULT 'open',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apparatus_issues_apparatus ON apparatus_issues(apparatus_id);
CREATE INDEX idx_apparatus_issues_department ON apparatus_issues(department_id);
CREATE INDEX idx_apparatus_issues_status ON apparatus_issues(status) WHERE status IN ('open', 'in_progress');
CREATE INDEX idx_apparatus_issues_severity ON apparatus_issues(severity) WHERE status IN ('open', 'in_progress');
CREATE INDEX idx_apparatus_issues_reported_by ON apparatus_issues(reported_by_user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_apparatus_maintenance_updated_at
  BEFORE UPDATE ON apparatus_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_apparatus_issues_updated_at
  BEFORE UPDATE ON apparatus_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE apparatus_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatus_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatus_issues ENABLE ROW LEVEL SECURITY;

-- Apparatus Maintenance Policies
CREATE POLICY "Users can view maintenance in their department"
  ON apparatus_maintenance FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Command can insert maintenance records"
  ON apparatus_maintenance FOR INSERT
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can update maintenance records"
  ON apparatus_maintenance FOR UPDATE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  )
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can delete maintenance records"
  ON apparatus_maintenance FOR DELETE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Apparatus Checks Policies
CREATE POLICY "Users can view checks in their department"
  ON apparatus_checks FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Users can insert checks for their department"
  ON apparatus_checks FOR INSERT
  WITH CHECK (
    department_id = get_user_department_id() AND
    performed_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can update their own checks"
  ON apparatus_checks FOR UPDATE
  USING (
    performed_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    performed_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Command can update any check in their department"
  ON apparatus_checks FOR UPDATE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  )
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

-- Apparatus Issues Policies
CREATE POLICY "Users can view issues in their department"
  ON apparatus_issues FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Users can report issues for their department"
  ON apparatus_issues FOR INSERT
  WITH CHECK (
    department_id = get_user_department_id() AND
    reported_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can update their own issues"
  ON apparatus_issues FOR UPDATE
  USING (
    reported_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    reported_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Command can update any issue in their department"
  ON apparatus_issues FOR UPDATE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  )
  WITH CHECK (
    is_command_level() AND department_id = get_user_department_id()
  );

CREATE POLICY "Command can delete issues in their department"
  ON apparatus_issues FOR DELETE
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );
