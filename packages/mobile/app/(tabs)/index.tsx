/**
 * Alerts Tab - Active and recent incidents
 */

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIncidentStore } from '@/stores/incident-store';
import { INCIDENT_PRIORITY_CONFIG, RESPONSE_STATUS_CONFIG } from '@fireresponse/shared';
import type { Incident } from '@fireresponse/shared';

export default function AlertsTab() {
  const { recentIncidents, isLoading, loadRecentIncidents } = useIncidentStore();

  useEffect(() => {
    loadRecentIncidents();
  }, [loadRecentIncidents]);

  const onRefresh = useCallback(() => {
    loadRecentIncidents();
  }, [loadRecentIncidents]);

  const renderIncident = ({ item }: { item: Incident }) => {
    const priorityConfig = INCIDENT_PRIORITY_CONFIG[item.priority];
    const isActive = item.status !== 'cleared' && item.status !== 'cancelled';

    return (
      <TouchableOpacity
        style={[styles.incidentCard, isActive && styles.activeIncident]}
        onPress={() => router.push(`/incident/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.incidentHeader}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityConfig.bgColor },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
              {priorityConfig.label}
            </Text>
          </View>
          <Text style={styles.timeText}>
            {formatTimeAgo(item.dispatched_at)}
          </Text>
        </View>

        <Text style={styles.incidentType}>{item.incident_type}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {item.address}
          {item.city && `, ${item.city}`}
        </Text>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.incidentFooter}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#059669' : '#6B7280' },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recentIncidents}
        renderItem={renderIncident}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#DC2626"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Active Incidents</Text>
            <Text style={styles.emptyText}>
              You'll be notified when a new call comes in
            </Text>
          </View>
        }
      />
    </View>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeIncident: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  incidentType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
