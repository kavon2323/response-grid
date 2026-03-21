/**
 * Incident Detail Screen - Response flow and incident info
 */

import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useIncidentStore } from '@/stores/incident-store';
import { useAuthStore } from '@/stores/auth-store';
import { LocationService } from '@/services/location-service';
import {
  INCIDENT_PRIORITY_CONFIG,
  RESPONSE_STATUS_CONFIG,
  USER_ROLE_CONFIG,
} from '@fireresponse/shared';
import type { ResponseStatus, IncidentResponseWithUser } from '@fireresponse/shared';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, isCommandLevel } = useAuthStore();
  const {
    activeIncident,
    myResponse,
    allResponses,
    isLoading,
    isUpdating,
    loadActiveIncident,
    updateMyStatus,
    clearActiveIncident,
  } = useIncidentStore();

  const [isTrackingLocation, setIsTrackingLocation] = useState(false);

  useEffect(() => {
    if (id) {
      loadActiveIncident(id);
    }

    return () => {
      clearActiveIncident();
    };
  }, [id, loadActiveIncident, clearActiveIncident]);

  // Handle response status change
  const handleStatusChange = useCallback(
    async (status: ResponseStatus) => {
      // Request location permission if responding
      if (status === 'responding_scene' || status === 'responding_station') {
        const hasPermission = await LocationService.requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Location Required',
            'FireResponse needs location access to track your position during response.'
          );
          return;
        }
      }

      const location = await LocationService.getCurrentLocation();

      await updateMyStatus(
        status,
        location?.coords.latitude,
        location?.coords.longitude
      );

      // Start/stop location tracking based on status
      const activeStatuses: ResponseStatus[] = [
        'responding_scene',
        'responding_station',
        'en_route_scene',
      ];

      if (activeStatuses.includes(status) && profile && myResponse) {
        await LocationService.startTracking(
          myResponse.id,
          activeIncident!.id,
          profile.id
        );
        setIsTrackingLocation(true);
      } else if (status === 'arrived_scene' || status === 'cleared') {
        await LocationService.stopTracking();
        setIsTrackingLocation(false);
      }
    },
    [updateMyStatus, activeIncident, profile, myResponse]
  );

  // Open directions in maps app
  const openDirections = useCallback(() => {
    if (!activeIncident?.latitude || !activeIncident?.longitude) {
      // Fall back to address search
      const address = encodeURIComponent(
        `${activeIncident?.address}, ${activeIncident?.city || ''}`
      );
      const url = Platform.select({
        ios: `maps:?daddr=${address}`,
        android: `google.navigation:q=${address}`,
      });
      if (url) Linking.openURL(url);
      return;
    }

    const { latitude, longitude } = activeIncident;
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  }, [activeIncident]);

  if (isLoading || !activeIncident) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  const priorityConfig = INCIDENT_PRIORITY_CONFIG[activeIncident.priority];
  const currentStatus = myResponse?.status || 'pending';
  const statusConfig = RESPONSE_STATUS_CONFIG[currentStatus];
  const canTransitionTo = statusConfig.canTransitionTo;

  // Group responses by status
  const respondingToScene = allResponses.filter(
    (r) => r.status === 'responding_scene' || r.status === 'arrived_scene'
  );
  const respondingToStation = allResponses.filter(
    (r) =>
      r.status === 'responding_station' ||
      r.status === 'arrived_station' ||
      r.status === 'en_route_scene'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View
        style={[styles.priorityHeader, { backgroundColor: priorityConfig.color }]}
      >
        <Text style={styles.incidentType}>{activeIncident.incident_type}</Text>
        <Text style={styles.priorityLabel}>{priorityConfig.label} Priority</Text>
      </View>

      {/* Address and Directions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.addressCard}
          onPress={openDirections}
          activeOpacity={0.7}
        >
          <View style={styles.addressContent}>
            <Ionicons name="location" size={24} color="#DC2626" />
            <View style={styles.addressText}>
              <Text style={styles.address}>{activeIncident.address}</Text>
              {activeIncident.city && (
                <Text style={styles.cityState}>
                  {activeIncident.city}
                  {activeIncident.state && `, ${activeIncident.state}`}
                </Text>
              )}
              {activeIncident.cross_street && (
                <Text style={styles.crossStreet}>
                  Cross: {activeIncident.cross_street}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.directionsButton}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.directionsText}>Directions</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Map Preview */}
      {activeIncident.latitude && activeIncident.longitude && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: activeIncident.latitude,
              longitude: activeIncident.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: activeIncident.latitude,
                longitude: activeIncident.longitude,
              }}
              pinColor="#DC2626"
            />
          </MapView>
        </View>
      )}

      {/* Response Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Response</Text>

        <View style={styles.currentStatusBanner}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: statusConfig.color },
            ]}
          />
          <Text style={styles.currentStatusText}>{statusConfig.label}</Text>
        </View>

        <View style={styles.responseActions}>
          {/* Initial response options */}
          {currentStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.responseButton, styles.respondingSceneButton]}
                onPress={() => handleStatusChange('responding_scene')}
                disabled={isUpdating}
              >
                <Ionicons name="flame" size={28} color="#FFFFFF" />
                <Text style={styles.responseButtonText}>
                  Responding to Scene
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.responseButton, styles.respondingStationButton]}
                onPress={() => handleStatusChange('responding_station')}
                disabled={isUpdating}
              >
                <Ionicons name="business" size={28} color="#FFFFFF" />
                <Text style={styles.responseButtonText}>
                  Responding to Station
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.responseButton, styles.notRespondingButton]}
                onPress={() => handleStatusChange('not_responding')}
                disabled={isUpdating}
              >
                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                <Text style={styles.responseButtonText}>Not Responding</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Status progression buttons */}
          {currentStatus !== 'pending' && currentStatus !== 'cleared' && (
            <View style={styles.statusProgression}>
              {canTransitionTo.map((nextStatus) => {
                const nextConfig = RESPONSE_STATUS_CONFIG[nextStatus];
                if (nextStatus === 'not_responding' && currentStatus !== 'pending')
                  return null;

                return (
                  <TouchableOpacity
                    key={nextStatus}
                    style={[
                      styles.progressionButton,
                      { backgroundColor: nextConfig.color },
                    ]}
                    onPress={() => handleStatusChange(nextStatus)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.progressionButtonText}>
                      {nextConfig.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {isUpdating && (
            <ActivityIndicator
              style={styles.updatingIndicator}
              color="#DC2626"
            />
          )}
        </View>
      </View>

      {/* Responders List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Responders ({allResponses.filter((r) => r.status !== 'not_responding' && r.status !== 'pending').length})
        </Text>

        {respondingToScene.length > 0 && (
          <View style={styles.responderGroup}>
            <Text style={styles.responderGroupTitle}>Going to Scene</Text>
            {respondingToScene.map((response) => (
              <ResponderRow
                key={response.id}
                response={response}
                isCommandLevel={isCommandLevel}
              />
            ))}
          </View>
        )}

        {respondingToStation.length > 0 && (
          <View style={styles.responderGroup}>
            <Text style={styles.responderGroupTitle}>Via Station</Text>
            {respondingToStation.map((response) => (
              <ResponderRow
                key={response.id}
                response={response}
                isCommandLevel={isCommandLevel}
              />
            ))}
          </View>
        )}

        {respondingToScene.length === 0 && respondingToStation.length === 0 && (
          <Text style={styles.noResponders}>No responders yet</Text>
        )}
      </View>

      {/* Incident Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        {activeIncident.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{activeIncident.description}</Text>
          </View>
        )}

        {activeIncident.dispatch_notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dispatch Notes</Text>
            <Text style={styles.detailValue}>{activeIncident.dispatch_notes}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dispatched</Text>
          <Text style={styles.detailValue}>
            {new Date(activeIncident.dispatched_at).toLocaleString()}
          </Text>
        </View>

        {activeIncident.caller_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Caller</Text>
            <Text style={styles.detailValue}>
              {activeIncident.caller_name}
              {activeIncident.caller_phone && ` - ${activeIncident.caller_phone}`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Responder row component
function ResponderRow({
  response,
  isCommandLevel,
}: {
  response: IncidentResponseWithUser;
  isCommandLevel: boolean;
}) {
  const statusConfig = RESPONSE_STATUS_CONFIG[response.status];
  const roleConfig = USER_ROLE_CONFIG[response.user.role];

  return (
    <View style={styles.responderRow}>
      <View style={styles.responderInfo}>
        <Text style={styles.responderName}>
          {response.user.first_name} {response.user.last_name}
        </Text>
        <Text style={styles.responderRole}>{roleConfig.label}</Text>
      </View>
      <View style={styles.responderStatus}>
        <View
          style={[styles.responderStatusDot, { backgroundColor: statusConfig.color }]}
        />
        <Text style={styles.responderStatusText}>{statusConfig.shortLabel}</Text>
        {response.current_eta_minutes && (
          <Text style={styles.responderEta}>
            {response.current_eta_minutes} min
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityHeader: {
    padding: 20,
    alignItems: 'center',
  },
  incidentType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priorityLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressContent: {
    flexDirection: 'row',
    gap: 12,
  },
  addressText: {
    flex: 1,
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cityState: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  crossStreet: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 150,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  currentStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  responseActions: {
    gap: 12,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  respondingSceneButton: {
    backgroundColor: '#DC2626',
  },
  respondingStationButton: {
    backgroundColor: '#F59E0B',
  },
  notRespondingButton: {
    backgroundColor: '#6B7280',
  },
  responseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusProgression: {
    gap: 12,
  },
  progressionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updatingIndicator: {
    marginTop: 12,
  },
  responderGroup: {
    marginBottom: 16,
  },
  responderGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  responderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responderInfo: {
    flex: 1,
  },
  responderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  responderRole: {
    fontSize: 13,
    color: '#6B7280',
  },
  responderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  responderStatusText: {
    fontSize: 13,
    color: '#6B7280',
  },
  responderEta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  noResponders: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  detailRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
  },
});
