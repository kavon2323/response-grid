/**
 * FireResponse - Database Types
 * Auto-generated types from Supabase schema
 * These types are shared between mobile app and admin portal
 */

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'volunteer' | 'lieutenant' | 'captain' | 'chief' | 'admin';

export type ResponseStatus =
  | 'pending'
  | 'responding_scene'
  | 'responding_station'
  | 'not_responding'
  | 'standby'
  | 'en_route_scene'
  | 'arrived_station'
  | 'arrived_scene'
  | 'cleared';

export type IncidentStatus =
  | 'dispatched'
  | 'acknowledged'
  | 'units_enroute'
  | 'on_scene'
  | 'under_control'
  | 'cleared'
  | 'cancelled';

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export type ApparatusType =
  | 'engine'
  | 'ladder'
  | 'rescue'
  | 'tanker'
  | 'ambulance'
  | 'brush'
  | 'utility'
  | 'command'
  | 'other';

export type ApparatusStatus =
  | 'available'
  | 'dispatched'
  | 'en_route'
  | 'on_scene'
  | 'returning'
  | 'out_of_service';

export type EquipmentStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'expired'
  | 'retired';

export type CadSourceType = 'webhook' | 'email' | 'api_poll' | 'manual';

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  department_id: string;
  name: string;
  code: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_meters: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string | null;
  department_id: string;
  primary_station_id: string | null;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  badge_number: string | null;
  role: UserRole;
  is_active: boolean;
  push_token: string | null;
  notification_preferences: NotificationPreferences;
  share_location_with_command: boolean;
  share_location_with_responders: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  sms_fallback: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface CadSource {
  id: string;
  department_id: string;
  name: string;
  source_type: CadSourceType;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CadRawLog {
  id: string;
  cad_source_id: string | null;
  department_id: string;
  raw_payload: Record<string, unknown>;
  parsed_successfully: boolean;
  incident_id: string | null;
  error_message: string | null;
  received_at: string;
}

export interface Incident {
  id: string;
  department_id: string;
  cad_source_id: string | null;
  cad_incident_id: string | null;
  incident_type: string;
  incident_type_code: string | null;
  priority: IncidentPriority;
  status: IncidentStatus;
  address: string;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  cross_street: string | null;
  location_notes: string | null;
  description: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  dispatch_notes: string | null;
  dispatched_at: string;
  acknowledged_at: string | null;
  first_unit_enroute_at: string | null;
  first_unit_arrived_at: string | null;
  under_control_at: string | null;
  cleared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentResponse {
  id: string;
  incident_id: string;
  user_id: string;
  status: ResponseStatus;
  destination: 'scene' | 'station' | null;
  notified_at: string;
  responded_at: string | null;
  arrived_station_at: string | null;
  departed_station_at: string | null;
  arrived_scene_at: string | null;
  cleared_at: string | null;
  current_eta_minutes: number | null;
  eta_updated_at: string | null;
  apparatus_id: string | null;
  apparatus_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponderLocation {
  id: string;
  incident_response_id: string;
  user_id: string;
  incident_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  heading: number | null;
  speed_mps: number | null;
  eta_minutes: number | null;
  distance_to_destination_meters: number | null;
  recorded_at: string;
}

export interface ResponseStatusLog {
  id: string;
  incident_response_id: string;
  user_id: string;
  incident_id: string;
  previous_status: ResponseStatus | null;
  new_status: ResponseStatus;
  latitude: number | null;
  longitude: number | null;
  changed_at: string;
}

export interface Apparatus {
  id: string;
  department_id: string;
  station_id: string;
  name: string;
  unit_number: string;
  apparatus_type: ApparatusType;
  vin: string | null;
  license_plate: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  status: ApparatusStatus;
  current_incident_id: string | null;
  inferred_latitude: number | null;
  inferred_longitude: number | null;
  inferred_location_user_id: string | null;
  inferred_location_updated_at: string | null;
  seat_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApparatusAssignment {
  id: string;
  apparatus_id: string;
  incident_id: string;
  assigned_by_user_id: string;
  crew_user_ids: string[];
  status: ApparatusStatus;
  dispatched_at: string;
  en_route_at: string | null;
  arrived_at: string | null;
  cleared_at: string | null;
  returned_station_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentCategory {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  requires_inspection: boolean;
  inspection_interval_days: number | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  department_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  serial_number: string | null;
  asset_tag: string | null;
  status: EquipmentStatus;
  assigned_station_id: string | null;
  assigned_apparatus_id: string | null;
  assigned_user_id: string | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  expiration_date: string | null;
  last_inspection_date: string | null;
  next_inspection_due: string | null;
  purchase_cost: number | null;
  notes: string | null;
  specifications: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EquipmentLog {
  id: string;
  equipment_id: string;
  log_type: 'inspection' | 'maintenance' | 'repair' | 'note';
  description: string;
  performed_by_user_id: string | null;
  passed: boolean | null;
  cost: number | null;
  vendor: string | null;
  logged_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  department_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  incident_id: string | null;
  notification_type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  expo_ticket_id: string | null;
  delivered: boolean | null;
  delivery_error: string | null;
  sent_at: string;
}

// ============================================================================
// JOINED / COMPUTED TYPES
// ============================================================================

export interface IncidentWithResponders extends Incident {
  responses: IncidentResponseWithUser[];
  apparatus_assignments: ApparatusAssignmentWithDetails[];
}

export interface IncidentResponseWithUser extends IncidentResponse {
  user: Pick<User, 'id' | 'first_name' | 'last_name' | 'role' | 'badge_number'>;
  latest_location?: ResponderLocation;
}

export interface ApparatusAssignmentWithDetails extends ApparatusAssignment {
  apparatus: Pick<Apparatus, 'id' | 'name' | 'unit_number' | 'apparatus_type'>;
}

export interface UserWithStation extends User {
  primary_station?: Pick<Station, 'id' | 'name' | 'code'>;
}

export interface EquipmentWithCategory extends Equipment {
  category?: Pick<EquipmentCategory, 'id' | 'name'>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UpdateResponseStatusRequest {
  incident_id: string;
  status: ResponseStatus;
  latitude?: number;
  longitude?: number;
}

export interface UpdateLocationRequest {
  incident_response_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  heading?: number;
  speed_mps?: number;
}

export interface SelectApparatusRequest {
  incident_id: string;
  apparatus_id: string;
  crew_user_ids?: string[];
}

export interface CadWebhookPayload {
  source_id: string;
  raw_data: Record<string, unknown>;
  timestamp: string;
}

export interface NormalizedIncidentData {
  cad_incident_id: string;
  incident_type: string;
  incident_type_code?: string;
  priority: IncidentPriority;
  address: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  cross_street?: string;
  description?: string;
  caller_name?: string;
  caller_phone?: string;
  dispatch_notes?: string;
}

// ============================================================================
// REALTIME SUBSCRIPTION TYPES
// ============================================================================

export type RealtimeIncidentUpdate = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Incident | null;
  old: Incident | null;
};

export type RealtimeResponseUpdate = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: IncidentResponse | null;
  old: IncidentResponse | null;
};

export type RealtimeLocationUpdate = {
  eventType: 'INSERT';
  new: ResponderLocation;
};

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface MemberResponseStats {
  user_id: string;
  user_name: string;
  total_incidents: number;
  responded_count: number;
  response_rate: number;
  scene_responses: number;
  station_responses: number;
  average_response_time_minutes: number | null;
}

export interface IncidentTrendData {
  date: string;
  total_incidents: number;
  by_type: Record<string, number>;
  by_priority: Record<IncidentPriority, number>;
  average_response_time_minutes: number | null;
}

export interface ApparatusUsageStats {
  apparatus_id: string;
  apparatus_name: string;
  total_dispatches: number;
  total_time_on_scene_minutes: number;
  average_response_time_minutes: number | null;
}
