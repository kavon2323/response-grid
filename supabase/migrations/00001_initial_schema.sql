-- FireResponse MVP Database Schema
-- Supabase/PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'volunteer',      -- Basic firefighter
  'lieutenant',     -- Company officer
  'captain',        -- Senior company officer
  'chief',          -- Command staff
  'admin'           -- Department administrator (non-operational)
);

CREATE TYPE response_status AS ENUM (
  'pending',           -- Notification sent, no response yet
  'responding_scene',  -- Going directly to incident
  'responding_station',-- Going to station first
  'not_responding',    -- Declined/unavailable
  'standby',           -- Watching, may respond
  'en_route_scene',    -- Left station, heading to scene
  'arrived_station',   -- At station, preparing
  'arrived_scene',     -- On scene
  'cleared'            -- Finished, available
);

CREATE TYPE incident_status AS ENUM (
  'dispatched',    -- CAD alert received
  'acknowledged',  -- At least one responder committed
  'units_enroute', -- Apparatus dispatched
  'on_scene',      -- First unit arrived
  'under_control', -- Incident managed
  'cleared',       -- All units cleared
  'cancelled'      -- Call cancelled
);

CREATE TYPE incident_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE apparatus_type AS ENUM (
  'engine',
  'ladder',
  'rescue',
  'tanker',
  'ambulance',
  'brush',
  'utility',
  'command',
  'other'
);

CREATE TYPE apparatus_status AS ENUM (
  'available',     -- In station, ready
  'dispatched',    -- Assigned to incident
  'en_route',      -- Traveling to scene
  'on_scene',      -- At incident
  'returning',     -- Heading back to station
  'out_of_service' -- Maintenance/unavailable
);

CREATE TYPE equipment_status AS ENUM (
  'available',
  'in_use',
  'maintenance',
  'expired',
  'retired'
);

CREATE TYPE cad_source_type AS ENUM (
  'webhook',
  'email',
  'api_poll',
  'manual'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Departments (multi-tenant ready)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Short code like "HVFD"
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations within a department
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- e.g., "Station 1"
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius_meters INTEGER DEFAULT 100, -- For arrival detection
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, code)
);

-- Users / Members
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Links to Supabase Auth
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  primary_station_id UUID REFERENCES stations(id),

  -- Profile
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  badge_number TEXT,

  -- Role & permissions
  role user_role NOT NULL DEFAULT 'volunteer',
  is_active BOOLEAN DEFAULT TRUE,

  -- Notification settings
  push_token TEXT, -- Expo push token
  notification_preferences JSONB DEFAULT '{
    "push_enabled": true,
    "sms_fallback": false,
    "quiet_hours_start": null,
    "quiet_hours_end": null
  }',

  -- Privacy settings
  share_location_with_command BOOLEAN DEFAULT TRUE,
  share_location_with_responders BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- CAD & INCIDENTS
-- ============================================================================

-- CAD Integration Sources
CREATE TABLE cad_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type cad_source_type NOT NULL,
  config JSONB DEFAULT '{}', -- API keys, endpoints, parsing rules
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw CAD Payloads (audit log)
CREATE TABLE cad_raw_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cad_source_id UUID REFERENCES cad_sources(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  raw_payload JSONB NOT NULL,
  parsed_successfully BOOLEAN DEFAULT FALSE,
  incident_id UUID, -- Linked after parsing
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cad_raw_logs_department ON cad_raw_logs(department_id);
CREATE INDEX idx_cad_raw_logs_received ON cad_raw_logs(received_at DESC);

-- Incidents (normalized from CAD)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  cad_source_id UUID REFERENCES cad_sources(id),

  -- CAD reference
  cad_incident_id TEXT, -- Original ID from CAD system

  -- Incident details
  incident_type TEXT NOT NULL, -- "Structure Fire", "MVA", "Medical"
  incident_type_code TEXT, -- CAD code like "SF", "MVA"
  priority incident_priority DEFAULT 'medium',
  status incident_status DEFAULT 'dispatched',

  -- Location
  address TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  cross_street TEXT,
  location_notes TEXT,

  -- Details
  description TEXT,
  caller_name TEXT,
  caller_phone TEXT,
  dispatch_notes TEXT,

  -- Timestamps
  dispatched_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  first_unit_enroute_at TIMESTAMPTZ,
  first_unit_arrived_at TIMESTAMPTZ,
  under_control_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_department ON incidents(department_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_dispatched ON incidents(dispatched_at DESC);
CREATE INDEX idx_incidents_cad_id ON incidents(department_id, cad_incident_id);

-- ============================================================================
-- RESPONSE TRACKING
-- ============================================================================

-- Individual responder assignments to incidents
CREATE TABLE incident_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response status
  status response_status DEFAULT 'pending',
  destination TEXT, -- 'scene' or 'station'

  -- Timestamps
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ, -- When they selected a status
  arrived_station_at TIMESTAMPTZ,
  departed_station_at TIMESTAMPTZ,
  arrived_scene_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,

  -- ETA tracking
  current_eta_minutes INTEGER,
  eta_updated_at TIMESTAMPTZ,

  -- Apparatus assignment
  apparatus_id UUID, -- Set when they board a truck
  apparatus_assigned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(incident_id, user_id)
);

CREATE INDEX idx_incident_responses_incident ON incident_responses(incident_id);
CREATE INDEX idx_incident_responses_user ON incident_responses(user_id);
CREATE INDEX idx_incident_responses_status ON incident_responses(status);

-- Real-time location updates for responders
CREATE TABLE responder_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_response_id UUID NOT NULL REFERENCES incident_responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(6, 2),
  heading DECIMAL(5, 2), -- 0-360 degrees
  speed_mps DECIMAL(6, 2), -- meters per second

  -- Computed
  eta_minutes INTEGER,
  distance_to_destination_meters INTEGER,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by time for efficient cleanup (locations are ephemeral)
CREATE INDEX idx_responder_locations_response ON responder_locations(incident_response_id);
CREATE INDEX idx_responder_locations_incident ON responder_locations(incident_id);
CREATE INDEX idx_responder_locations_recorded ON responder_locations(recorded_at DESC);

-- Status change audit log
CREATE TABLE response_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_response_id UUID NOT NULL REFERENCES incident_responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  incident_id UUID NOT NULL REFERENCES incidents(id),

  previous_status response_status,
  new_status response_status NOT NULL,

  -- Context
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_response_status_log_incident ON response_status_log(incident_id);

-- ============================================================================
-- APPARATUS / VEHICLES
-- ============================================================================

CREATE TABLE apparatus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id),

  -- Identity
  name TEXT NOT NULL, -- "Engine 1", "Ladder 2"
  unit_number TEXT NOT NULL,
  apparatus_type apparatus_type NOT NULL,

  -- Vehicle details
  vin TEXT,
  license_plate TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,

  -- Status
  status apparatus_status DEFAULT 'available',
  current_incident_id UUID REFERENCES incidents(id),

  -- For MVP: inferred location from assigned user
  inferred_latitude DECIMAL(10, 8),
  inferred_longitude DECIMAL(11, 8),
  inferred_location_user_id UUID REFERENCES users(id),
  inferred_location_updated_at TIMESTAMPTZ,

  -- Capacity
  seat_capacity INTEGER DEFAULT 4,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apparatus_department ON apparatus(department_id);
CREATE INDEX idx_apparatus_station ON apparatus(station_id);
CREATE INDEX idx_apparatus_status ON apparatus(status);

-- Apparatus assignments to incidents
CREATE TABLE apparatus_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apparatus_id UUID NOT NULL REFERENCES apparatus(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Who took the truck
  assigned_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Crew manifest
  crew_user_ids UUID[] DEFAULT '{}',

  -- Status tracking
  status apparatus_status DEFAULT 'dispatched',

  -- Timestamps
  dispatched_at TIMESTAMPTZ DEFAULT NOW(),
  en_route_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  returned_station_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apparatus_assignments_apparatus ON apparatus_assignments(apparatus_id);
CREATE INDEX idx_apparatus_assignments_incident ON apparatus_assignments(incident_id);

-- ============================================================================
-- EQUIPMENT & INVENTORY
-- ============================================================================

-- Equipment categories
CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requires_inspection BOOLEAN DEFAULT FALSE,
  inspection_interval_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment items
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES equipment_categories(id),

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  asset_tag TEXT,

  -- Status
  status equipment_status DEFAULT 'available',

  -- Assignment
  assigned_station_id UUID REFERENCES stations(id),
  assigned_apparatus_id UUID REFERENCES apparatus(id),
  assigned_user_id UUID REFERENCES users(id),

  -- Dates
  purchase_date DATE,
  warranty_expiration DATE,
  expiration_date DATE, -- For consumables like medical supplies
  last_inspection_date DATE,
  next_inspection_due DATE,

  -- Cost tracking
  purchase_cost DECIMAL(10, 2),

  -- Metadata
  notes TEXT,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_station ON equipment(assigned_station_id);
CREATE INDEX idx_equipment_apparatus ON equipment(assigned_apparatus_id);
CREATE INDEX idx_equipment_expiration ON equipment(expiration_date) WHERE expiration_date IS NOT NULL;

-- Equipment maintenance/inspection logs
CREATE TABLE equipment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,

  -- Log type
  log_type TEXT NOT NULL, -- 'inspection', 'maintenance', 'repair', 'note'

  -- Details
  description TEXT NOT NULL,
  performed_by_user_id UUID REFERENCES users(id),

  -- Inspection specific
  passed BOOLEAN, -- For inspections

  -- Cost tracking
  cost DECIMAL(10, 2),
  vendor TEXT,

  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_logs_equipment ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_logged ON equipment_logs(logged_at DESC);

-- ============================================================================
-- AUDIT & SYSTEM
-- ============================================================================

-- General audit log for sensitive actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES users(id),

  -- Action details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'incident', 'user', 'equipment', etc.
  entity_id UUID,

  -- Change details
  old_values JSONB,
  new_values JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_department ON audit_logs(department_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Push notification log
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  incident_id UUID REFERENCES incidents(id),

  -- Notification details
  notification_type TEXT NOT NULL, -- 'incident_alert', 'reminder', etc.
  title TEXT,
  body TEXT,
  data JSONB,

  -- Delivery status
  expo_ticket_id TEXT,
  delivered BOOLEAN,
  delivery_error TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_incident ON notification_logs(incident_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE responder_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's department
CREATE OR REPLACE FUNCTION get_user_department_id()
RETURNS UUID AS $$
  SELECT department_id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is command level
CREATE OR REPLACE FUNCTION is_command_level()
RETURNS BOOLEAN AS $$
  SELECT role IN ('lieutenant', 'captain', 'chief', 'admin')
  FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Department policies: users can only see their own department
CREATE POLICY "Users can view own department"
  ON departments FOR SELECT
  USING (id = get_user_department_id());

-- Station policies
CREATE POLICY "Users can view stations in their department"
  ON stations FOR SELECT
  USING (department_id = get_user_department_id());

-- User policies
CREATE POLICY "Users can view members in their department"
  ON users FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Incident policies
CREATE POLICY "Users can view incidents in their department"
  ON incidents FOR SELECT
  USING (department_id = get_user_department_id());

-- Incident response policies
CREATE POLICY "Users can view responses in their department's incidents"
  ON incident_responses FOR SELECT
  USING (
    incident_id IN (
      SELECT id FROM incidents WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Users can update their own responses"
  ON incident_responses FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Location policies: privacy-aware
CREATE POLICY "Command can view all responder locations"
  ON responder_locations FOR SELECT
  USING (
    is_command_level() AND
    incident_id IN (
      SELECT id FROM incidents WHERE department_id = get_user_department_id()
    )
  );

CREATE POLICY "Responders can view locations if user allows"
  ON responder_locations FOR SELECT
  USING (
    incident_id IN (
      SELECT id FROM incidents WHERE department_id = get_user_department_id()
    ) AND
    user_id IN (
      SELECT id FROM users WHERE share_location_with_responders = true
    )
  );

CREATE POLICY "Users can insert their own locations"
  ON responder_locations FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Apparatus policies
CREATE POLICY "Users can view apparatus in their department"
  ON apparatus FOR SELECT
  USING (department_id = get_user_department_id());

-- Equipment policies
CREATE POLICY "Users can view equipment in their department"
  ON equipment FOR SELECT
  USING (department_id = get_user_department_id());

CREATE POLICY "Command can modify equipment"
  ON equipment FOR ALL
  USING (
    is_command_level() AND department_id = get_user_department_id()
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_incident_responses_updated_at
  BEFORE UPDATE ON incident_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_apparatus_updated_at
  BEFORE UPDATE ON apparatus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check if user is near a station (for apparatus selection)
CREATE OR REPLACE FUNCTION is_user_at_station(
  p_user_lat DECIMAL,
  p_user_lon DECIMAL,
  p_station_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_station_lat DECIMAL;
  v_station_lon DECIMAL;
  v_geofence_radius INTEGER;
  v_distance DECIMAL;
BEGIN
  SELECT latitude, longitude, geofence_radius_meters
  INTO v_station_lat, v_station_lon, v_geofence_radius
  FROM stations WHERE id = p_station_id;

  IF v_station_lat IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate distance using PostGIS
  v_distance := ST_Distance(
    ST_SetSRID(ST_MakePoint(p_user_lon, p_user_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(v_station_lon, v_station_lat), 4326)::geography
  );

  RETURN v_distance <= v_geofence_radius;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get incident summary for a department
CREATE OR REPLACE FUNCTION get_incident_summary(p_incident_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'incident', row_to_json(i),
    'responders', (
      SELECT jsonb_agg(jsonb_build_object(
        'response', row_to_json(ir),
        'user', jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'role', u.role
        )
      ))
      FROM incident_responses ir
      JOIN users u ON u.id = ir.user_id
      WHERE ir.incident_id = i.id
    ),
    'apparatus', (
      SELECT jsonb_agg(jsonb_build_object(
        'assignment', row_to_json(aa),
        'apparatus', row_to_json(a)
      ))
      FROM apparatus_assignments aa
      JOIN apparatus a ON a.id = aa.apparatus_id
      WHERE aa.incident_id = i.id
    )
  ) INTO v_result
  FROM incidents i
  WHERE i.id = p_incident_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SEED DATA FUNCTION (for development)
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_demo_department()
RETURNS void AS $$
DECLARE
  v_dept_id UUID;
  v_station1_id UUID;
  v_station2_id UUID;
BEGIN
  -- Create demo department
  INSERT INTO departments (name, code, address, city, state, zip)
  VALUES ('Hillside Volunteer Fire Department', 'HVFD', '123 Main St', 'Hillside', 'NY', '10001')
  RETURNING id INTO v_dept_id;

  -- Create stations
  INSERT INTO stations (department_id, name, code, address, city, state, zip, latitude, longitude, is_primary)
  VALUES (v_dept_id, 'Station 1 - Headquarters', 'STA1', '123 Main St', 'Hillside', 'NY', '10001', 40.7128, -74.0060, true)
  RETURNING id INTO v_station1_id;

  INSERT INTO stations (department_id, name, code, address, city, state, zip, latitude, longitude)
  VALUES (v_dept_id, 'Station 2 - North', 'STA2', '456 North Ave', 'Hillside', 'NY', '10002', 40.7200, -74.0000)
  RETURNING id INTO v_station2_id;

  -- Create apparatus
  INSERT INTO apparatus (department_id, station_id, name, unit_number, apparatus_type, seat_capacity)
  VALUES
    (v_dept_id, v_station1_id, 'Engine 1', 'E1', 'engine', 6),
    (v_dept_id, v_station1_id, 'Ladder 1', 'L1', 'ladder', 6),
    (v_dept_id, v_station1_id, 'Rescue 1', 'R1', 'rescue', 4),
    (v_dept_id, v_station2_id, 'Engine 2', 'E2', 'engine', 6),
    (v_dept_id, v_station2_id, 'Tanker 2', 'T2', 'tanker', 2);

  -- Create equipment categories
  INSERT INTO equipment_categories (department_id, name, requires_inspection, inspection_interval_days)
  VALUES
    (v_dept_id, 'SCBA', true, 30),
    (v_dept_id, 'Medical Supplies', false, null),
    (v_dept_id, 'Hose', true, 365),
    (v_dept_id, 'PPE', true, 180),
    (v_dept_id, 'Tools', true, 90);

  -- Create CAD source
  INSERT INTO cad_sources (department_id, name, source_type, config)
  VALUES (v_dept_id, 'County CAD', 'webhook', '{"api_key": "placeholder"}');

  RAISE NOTICE 'Demo department created with ID: %', v_dept_id;
END;
$$ LANGUAGE plpgsql;

-- COMMENT: Run SELECT seed_demo_department(); to create demo data
