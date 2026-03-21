/**
 * Status Tab - Current user status and active response
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth-store';
import { useIncidentStore } from '@/stores/incident-store';
import { LocationService } from '@/services/location-service';
import { USER_ROLE_CONFIG, RESPONSE_STATUS_CONFIG } from '@fireresponse/shared';

export default function StatusTab() {
  const { profile } = useAuthStore();
  const { activeIncident, myResponse } = useIncidentStore();
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    LocationService.isTracking().then(setIsTracking);
  }, [myResponse?.status]);

  if (!profile) {
    return null;
  }

  const roleConfig = USER_ROLE_CONFIG[profile.role];
  const hasActiveResponse = activeIncident && myResponse;
  const statusConfig = myResponse
    ? RESPONSE_STATUS_CONFIG[myResponse.status]
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.first_name[0]}
            {profile.last_name[0]}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.profileRole}>{roleConfig.label}</Text>
          {profile.badge_number && (
            <Text style={styles.badgeNumber}>Badge #{profile.badge_number}</Text>
          )}
        </View>
      </View>

      {/* Active Response */}
      {hasActiveResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Response</Text>

          <TouchableOpacity
            style={styles.activeResponseCard}
            onPress={() => router.push(`/incident/${activeIncident.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.activeResponseHeader}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig?.bgColor },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusConfig?.color },
                  ]}
                />
                <Text
                  style={[styles.statusBadgeText, { color: statusConfig?.color }]}
                >
                  {statusConfig?.label}
                </Text>
              </View>

              {isTracking && (
                <View style={styles.trackingBadge}>
                  <Ionicons name="location" size={14} color="#059669" />
                  <Text style={styles.trackingText}>Tracking</Text>
                </View>
              )}
            </View>

            <Text style={styles.incidentType}>
              {activeIncident.incident_type}
            </Text>
            <Text style={styles.incidentAddress}>{activeIncident.address}</Text>

            <View style={styles.viewIncidentRow}>
              <Text style={styles.viewIncidentText}>View Incident Details</Text>
              <Ionicons name="chevron-forward" size={20} color="#DC2626" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* No Active Response */}
      {!hasActiveResponse && (
        <View style={styles.section}>
          <View style={styles.noActiveCard}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text style={styles.noActiveTitle}>Available</Text>
            <Text style={styles.noActiveText}>
              You have no active responses. You'll be notified when a new call
              comes in.
            </Text>
          </View>
        </View>
      )}

      {/* Location Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Sharing</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share with Command</Text>
              <Text style={styles.settingDescription}>
                Chiefs and officers can see your location during response
              </Text>
            </View>
            <View
              style={[
                styles.toggleIndicator,
                profile.share_location_with_command && styles.toggleActive,
              ]}
            >
              <Text style={styles.toggleText}>
                {profile.share_location_with_command ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share with Responders</Text>
              <Text style={styles.settingDescription}>
                Other responding members can see your location
              </Text>
            </View>
            <View
              style={[
                styles.toggleIndicator,
                profile.share_location_with_responders && styles.toggleActive,
              ]}
            >
              <Text style={styles.toggleText}>
                {profile.share_location_with_responders ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Calls Responded</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileRole: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeNumber: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  activeResponseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  incidentType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  incidentAddress: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  viewIncidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewIncidentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  noActiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noActiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginTop: 12,
  },
  noActiveText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  toggleIndicator: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleActive: {
    backgroundColor: '#D1FAE5',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});
