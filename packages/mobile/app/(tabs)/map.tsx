/**
 * Map Tab - Live view of responders and incidents
 * Available to command-level users
 */

import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useIncidentStore } from '@/stores/incident-store';
import { supabase } from '@/lib/supabase';
import { RESPONSE_STATUS_CONFIG, USER_ROLE_CONFIG } from '@fireresponse/shared';
import type { ResponderLocation, IncidentResponseWithUser, Incident } from '@fireresponse/shared';

interface ResponderMarker {
  userId: string;
  name: string;
  role: string;
  status: string;
  latitude: number;
  longitude: number;
  eta?: number;
}

export default function MapTab() {
  const { isCommandLevel, profile } = useAuthStore();
  const { activeIncident, allResponses } = useIncidentStore();
  const mapRef = useRef<MapView>(null);

  const [responderLocations, setResponderLocations] = useState<ResponderMarker[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active incidents
  useEffect(() => {
    async function fetchActiveIncidents() {
      const { data } = await supabase
        .from('incidents')
        .select('*')
        .not('status', 'in', '("cleared","cancelled")')
        .order('dispatched_at', { ascending: false });

      if (data) {
        setActiveIncidents(data as Incident[]);
      }
      setIsLoading(false);
    }

    fetchActiveIncidents();
  }, []);

  // Subscribe to location updates for active incident
  useEffect(() => {
    if (!activeIncident || !isCommandLevel) return;

    const channel = supabase
      .channel(`locations:${activeIncident.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responder_locations',
          filter: `incident_id=eq.${activeIncident.id}`,
        },
        async (payload) => {
          const newLocation = payload.new as ResponderLocation;

          // Get user info
          const response = allResponses.find(
            (r) => r.user_id === newLocation.user_id
          );

          if (response) {
            setResponderLocations((prev) => {
              const filtered = prev.filter((r) => r.userId !== newLocation.user_id);
              return [
                ...filtered,
                {
                  userId: newLocation.user_id,
                  name: `${response.user.first_name} ${response.user.last_name}`,
                  role: response.user.role,
                  status: response.status,
                  latitude: newLocation.latitude,
                  longitude: newLocation.longitude,
                  eta: newLocation.eta_minutes ?? undefined,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeIncident, allResponses, isCommandLevel]);

  // Non-command users see limited map
  if (!isCommandLevel) {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          <Text style={styles.restrictedTitle}>Command Access Required</Text>
          <Text style={styles.restrictedText}>
            Live responder tracking is available to command-level users
            (Lieutenant and above).
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  // Default to first active incident or user's location
  const initialRegion = activeIncidents[0]?.latitude && activeIncidents[0]?.longitude
    ? {
        latitude: activeIncidents[0].latitude,
        longitude: activeIncidents[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Incident markers */}
        {activeIncidents.map((incident) => {
          if (!incident.latitude || !incident.longitude) return null;

          return (
            <Marker
              key={incident.id}
              coordinate={{
                latitude: incident.latitude,
                longitude: incident.longitude,
              }}
              pinColor="#DC2626"
            >
              <Callout
                onPress={() => router.push(`/incident/${incident.id}`)}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{incident.incident_type}</Text>
                  <Text style={styles.calloutAddress}>{incident.address}</Text>
                  <Text style={styles.calloutTap}>Tap for details</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* Responder markers */}
        {responderLocations.map((responder) => {
          const statusConfig = RESPONSE_STATUS_CONFIG[responder.status as keyof typeof RESPONSE_STATUS_CONFIG];

          return (
            <Marker
              key={responder.userId}
              coordinate={{
                latitude: responder.latitude,
                longitude: responder.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.responderMarker,
                  { backgroundColor: statusConfig?.color || '#6B7280' },
                ]}
              >
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{responder.name}</Text>
                  <Text style={styles.calloutStatus}>
                    {statusConfig?.label || responder.status}
                  </Text>
                  {responder.eta && (
                    <Text style={styles.calloutEta}>ETA: {responder.eta} min</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Incident</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>To Station</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>On Scene</Text>
        </View>
      </View>

      {/* Active incident indicator */}
      {activeIncidents.length > 0 && (
        <TouchableOpacity
          style={styles.activeIncidentBanner}
          onPress={() => router.push(`/incident/${activeIncidents[0].id}`)}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>
              {activeIncidents.length} Active{' '}
              {activeIncidents.length === 1 ? 'Incident' : 'Incidents'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  restrictedText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  responderMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  callout: {
    padding: 8,
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calloutAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  calloutStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  calloutEta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  calloutTap: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
  activeIncidentBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
