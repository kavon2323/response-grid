/**
 * Location Service - GPS tracking for responders
 * Handles foreground and background location updates
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '@/lib/supabase';
import { LOCATION_CONFIG } from '@fireresponse/shared';

const LOCATION_TASK_NAME = 'FIRERESPONSE_LOCATION_TRACKING';

// Types
interface LocationUpdate {
  incidentResponseId: string;
  incidentId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

// Task data stored between updates
let activeTrackingData: {
  incidentResponseId: string;
  incidentId: string;
  userId: string;
} | null = null;

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (!activeTrackingData) {
    console.warn('No active tracking data');
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const latestLocation = locations[0];

  if (latestLocation) {
    await sendLocationUpdate({
      incidentResponseId: activeTrackingData.incidentResponseId,
      incidentId: activeTrackingData.incidentId,
      userId: activeTrackingData.userId,
      latitude: latestLocation.coords.latitude,
      longitude: latestLocation.coords.longitude,
      accuracy: latestLocation.coords.accuracy,
      heading: latestLocation.coords.heading,
      speed: latestLocation.coords.speed,
    });
  }
});

// Send location to server
async function sendLocationUpdate(update: LocationUpdate): Promise<void> {
  try {
    await supabase.from('responder_locations').insert({
      incident_response_id: update.incidentResponseId,
      incident_id: update.incidentId,
      user_id: update.userId,
      latitude: update.latitude,
      longitude: update.longitude,
      accuracy_meters: update.accuracy,
      heading: update.heading,
      speed_mps: update.speed,
    });

    // Also update the response record with latest ETA
    // (In production, ETA would be calculated server-side using routing API)
    await supabase
      .from('incident_responses')
      .update({
        current_eta_minutes: null, // Would be calculated
        eta_updated_at: new Date().toISOString(),
      })
      .eq('id', update.incidentResponseId);
  } catch (error) {
    console.error('Failed to send location update:', error);
  }
}

export const LocationService = {
  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    return backgroundStatus === 'granted';
  },

  /**
   * Check if we have location permissions
   */
  async hasPermissions(): Promise<{ foreground: boolean; background: boolean }> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  },

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  },

  /**
   * Start tracking location for an active response
   */
  async startTracking(
    incidentResponseId: string,
    incidentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Store tracking context
      activeTrackingData = {
        incidentResponseId,
        incidentId,
        userId,
      };

      // Start foreground location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_CONFIG.UPDATE_INTERVAL_MS,
        distanceInterval: LOCATION_CONFIG.DISTANCE_FILTER_METERS,
        foregroundService: {
          notificationTitle: 'FireResponse Active',
          notificationBody: 'Tracking your location for incident response',
          notificationColor: '#DC2626',
        },
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  },

  /**
   * Stop tracking location
   */
  async stopTracking(): Promise<void> {
    try {
      const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (isTracking) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      activeTrackingData = null;
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  },

  /**
   * Check if currently tracking
   */
  async isTracking(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch {
      return false;
    }
  },

  /**
   * Check if user is within geofence of a station
   */
  async isNearStation(
    stationLat: number,
    stationLon: number,
    radiusMeters: number
  ): Promise<boolean> {
    const location = await this.getCurrentLocation();

    if (!location) return false;

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      stationLat,
      stationLon
    );

    return distance <= radiusMeters;
  },
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
