/**
 * FireResponse - Shared Constants
 */

import type { ResponseStatus, IncidentPriority, UserRole, ApparatusType } from '../types';

// ============================================================================
// RESPONSE STATUS CONFIGURATION
// ============================================================================

export const RESPONSE_STATUS_CONFIG: Record<
  ResponseStatus,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    isActive: boolean;
    canTransitionTo: ResponseStatus[];
  }
> = {
  pending: {
    label: 'Pending Response',
    shortLabel: 'Pending',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    isActive: false,
    canTransitionTo: ['responding_scene', 'responding_station', 'not_responding', 'standby'],
  },
  responding_scene: {
    label: 'Responding to Scene',
    shortLabel: 'To Scene',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    isActive: true,
    canTransitionTo: ['arrived_scene', 'not_responding'],
  },
  responding_station: {
    label: 'Responding to Station',
    shortLabel: 'To Station',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    isActive: true,
    canTransitionTo: ['arrived_station', 'not_responding'],
  },
  not_responding: {
    label: 'Not Responding',
    shortLabel: 'Unavailable',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    isActive: false,
    canTransitionTo: ['responding_scene', 'responding_station'],
  },
  standby: {
    label: 'Standing By',
    shortLabel: 'Standby',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    isActive: false,
    canTransitionTo: ['responding_scene', 'responding_station', 'not_responding'],
  },
  arrived_station: {
    label: 'Arrived at Station',
    shortLabel: 'At Station',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    isActive: true,
    canTransitionTo: ['en_route_scene', 'cleared'],
  },
  en_route_scene: {
    label: 'En Route to Scene',
    shortLabel: 'En Route',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    isActive: true,
    canTransitionTo: ['arrived_scene', 'cleared'],
  },
  arrived_scene: {
    label: 'On Scene',
    shortLabel: 'On Scene',
    color: '#059669',
    bgColor: '#D1FAE5',
    isActive: true,
    canTransitionTo: ['cleared'],
  },
  cleared: {
    label: 'Cleared',
    shortLabel: 'Cleared',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    isActive: false,
    canTransitionTo: [],
  },
};

// ============================================================================
// INCIDENT PRIORITY CONFIGURATION
// ============================================================================

export const INCIDENT_PRIORITY_CONFIG: Record<
  IncidentPriority,
  {
    label: string;
    color: string;
    bgColor: string;
    sortOrder: number;
  }
> = {
  low: {
    label: 'Low',
    color: '#059669',
    bgColor: '#D1FAE5',
    sortOrder: 1,
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    sortOrder: 2,
  },
  high: {
    label: 'High',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    sortOrder: 3,
  },
  critical: {
    label: 'Critical',
    color: '#7C2D12',
    bgColor: '#FCA5A5',
    sortOrder: 4,
  },
};

// ============================================================================
// USER ROLE CONFIGURATION
// ============================================================================

export const USER_ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    level: number;
    isCommand: boolean;
    canViewAllLocations: boolean;
    canManageUsers: boolean;
    canManageEquipment: boolean;
    canViewReports: boolean;
  }
> = {
  volunteer: {
    label: 'Volunteer Firefighter',
    level: 1,
    isCommand: false,
    canViewAllLocations: false,
    canManageUsers: false,
    canManageEquipment: false,
    canViewReports: false,
  },
  lieutenant: {
    label: 'Lieutenant',
    level: 2,
    isCommand: true,
    canViewAllLocations: true,
    canManageUsers: false,
    canManageEquipment: true,
    canViewReports: true,
  },
  captain: {
    label: 'Captain',
    level: 3,
    isCommand: true,
    canViewAllLocations: true,
    canManageUsers: false,
    canManageEquipment: true,
    canViewReports: true,
  },
  chief: {
    label: 'Chief',
    level: 4,
    isCommand: true,
    canViewAllLocations: true,
    canManageUsers: true,
    canManageEquipment: true,
    canViewReports: true,
  },
  admin: {
    label: 'Administrator',
    level: 5,
    isCommand: false,
    canViewAllLocations: true,
    canManageUsers: true,
    canManageEquipment: true,
    canViewReports: true,
  },
};

// ============================================================================
// APPARATUS TYPE CONFIGURATION
// ============================================================================

export const APPARATUS_TYPE_CONFIG: Record<
  ApparatusType,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  engine: { label: 'Engine', icon: 'fire-truck', color: '#DC2626' },
  ladder: { label: 'Ladder', icon: 'ladder', color: '#DC2626' },
  rescue: { label: 'Rescue', icon: 'ambulance', color: '#F59E0B' },
  tanker: { label: 'Tanker', icon: 'water', color: '#3B82F6' },
  ambulance: { label: 'Ambulance', icon: 'ambulance', color: '#FFFFFF' },
  brush: { label: 'Brush', icon: 'tree', color: '#059669' },
  utility: { label: 'Utility', icon: 'truck', color: '#6B7280' },
  command: { label: 'Command', icon: 'car', color: '#7C2D12' },
  other: { label: 'Other', icon: 'truck', color: '#6B7280' },
};

// ============================================================================
// GPS & LOCATION SETTINGS
// ============================================================================

export const LOCATION_CONFIG = {
  // How often to update location while responding (ms)
  UPDATE_INTERVAL_MS: 10000, // 10 seconds

  // Minimum distance change to trigger update (meters)
  DISTANCE_FILTER_METERS: 20,

  // Accuracy threshold (meters)
  DESIRED_ACCURACY_METERS: 10,

  // How long to keep location history (hours)
  LOCATION_RETENTION_HOURS: 24,

  // Station geofence default radius (meters)
  DEFAULT_GEOFENCE_RADIUS_METERS: 100,
};

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export const NOTIFICATION_CONFIG = {
  // Channel IDs for Android
  CHANNELS: {
    INCIDENT_ALERT: 'incident-alerts',
    STATUS_UPDATE: 'status-updates',
    GENERAL: 'general',
  },

  // Push notification sound
  SOUND: 'alert.wav',

  // Badge configuration
  BADGE_ENABLED: true,
};

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const TIMING = {
  // How long a responder has to acknowledge before reminder (minutes)
  ACKNOWLEDGE_REMINDER_MINUTES: 2,

  // Auto-clear response if no activity (hours)
  AUTO_CLEAR_HOURS: 8,

  // Realtime subscription reconnect delay (ms)
  REALTIME_RECONNECT_DELAY_MS: 3000,

  // API request timeout (ms)
  API_TIMEOUT_MS: 15000,
};
