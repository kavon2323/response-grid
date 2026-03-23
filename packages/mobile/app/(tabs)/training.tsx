/**
 * Training Tab - Certifications, training records, and upcoming training events
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data types
interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  expirationDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

interface TrainingRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  hours: number;
  instructor: string;
}

interface UpcomingTraining {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  isRequired: boolean;
}

// Mock data
const MOCK_CERTIFICATIONS: Certification[] = [
  {
    id: '1',
    name: 'Firefighter I',
    issuingBody: 'State Fire Academy',
    expirationDate: '2027-06-15',
    status: 'valid',
  },
  {
    id: '2',
    name: 'EMT-Basic',
    issuingBody: 'National Registry',
    expirationDate: '2026-04-30',
    status: 'expiring_soon',
  },
  {
    id: '3',
    name: 'CPR/AED Instructor',
    issuingBody: 'American Heart Association',
    expirationDate: '2026-01-15',
    status: 'expired',
  },
  {
    id: '4',
    name: 'Hazmat Operations',
    issuingBody: 'State Fire Academy',
    expirationDate: '2028-09-20',
    status: 'valid',
  },
];

const MOCK_TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: '1',
    title: 'Vehicle Extrication Refresher',
    type: 'Hands-on',
    date: '2026-03-15',
    hours: 4,
    instructor: 'Capt. Johnson',
  },
  {
    id: '2',
    title: 'SCBA Annual Fit Test',
    type: 'Practical',
    date: '2026-03-10',
    hours: 2,
    instructor: 'Lt. Smith',
  },
  {
    id: '3',
    title: 'Incident Command System 300',
    type: 'Classroom',
    date: '2026-02-28',
    hours: 8,
    instructor: 'Chief Williams',
  },
];

const MOCK_UPCOMING_TRAINING: UpcomingTraining[] = [
  {
    id: '1',
    title: 'Ladder Operations Drill',
    date: '2026-03-25',
    time: '18:00',
    location: 'Station 1',
    type: 'Drill',
    isRequired: true,
  },
  {
    id: '2',
    title: 'EMS Protocols Update',
    date: '2026-04-02',
    time: '19:00',
    location: 'Training Center',
    type: 'Classroom',
    isRequired: true,
  },
  {
    id: '3',
    title: 'Fire Prevention Education',
    date: '2026-04-10',
    time: '09:00',
    location: 'Community Center',
    type: 'Public Education',
    isRequired: false,
  },
];

export default function TrainingTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const getStatusConfig = (status: Certification['status']) => {
    switch (status) {
      case 'valid':
        return { color: '#059669', bgColor: '#ECFDF5', label: 'Valid' };
      case 'expiring_soon':
        return { color: '#D97706', bgColor: '#FFFBEB', label: 'Expiring Soon' };
      case 'expired':
        return { color: '#DC2626', bgColor: '#FEF2F2', label: 'Expired' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const expiration = new Date(dateString);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate stats
  const hoursThisMonth = MOCK_TRAINING_RECORDS
    .filter(r => {
      const recordDate = new Date(r.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() &&
             recordDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + r.hours, 0);

  const hoursThisYear = MOCK_TRAINING_RECORDS
    .filter(r => {
      const recordDate = new Date(r.date);
      const now = new Date();
      return recordDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + r.hours, 0);

  const renderCertification = (cert: Certification) => {
    const statusConfig = getStatusConfig(cert.status);
    const daysUntil = getDaysUntilExpiration(cert.expirationDate);
    const isExpanded = expandedCert === cert.id;

    return (
      <TouchableOpacity
        key={cert.id}
        style={styles.certCard}
        onPress={() => setExpandedCert(isExpanded ? null : cert.id)}
        activeOpacity={0.7}
      >
        <View style={styles.certHeader}>
          <View style={styles.certInfo}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.certIssuer}>{cert.issuingBody}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.certDetails}>
            <View style={styles.certDetailRow}>
              <Text style={styles.certDetailLabel}>Expiration Date</Text>
              <Text style={styles.certDetailValue}>{formatDate(cert.expirationDate)}</Text>
            </View>
            <View style={styles.certDetailRow}>
              <Text style={styles.certDetailLabel}>Days Remaining</Text>
              <Text style={[
                styles.certDetailValue,
                { color: daysUntil < 0 ? '#DC2626' : daysUntil < 90 ? '#D97706' : '#059669' }
              ]}>
                {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.certFooter}>
          <Text style={styles.expirationText}>
            Expires: {formatDate(cert.expirationDate)}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrainingRecord = (record: TrainingRecord) => (
    <View key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordIcon}>
          <Ionicons
            name={record.type === 'Hands-on' ? 'construct' : record.type === 'Practical' ? 'fitness' : 'book'}
            size={20}
            color="#DC2626"
          />
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.recordMeta}>
            {formatDate(record.date)} | {record.hours}h | {record.instructor}
          </Text>
        </View>
      </View>
      <View style={styles.recordBadge}>
        <Text style={styles.recordType}>{record.type}</Text>
      </View>
    </View>
  );

  const renderUpcomingTraining = (training: UpcomingTraining) => (
    <TouchableOpacity key={training.id} style={styles.upcomingCard} activeOpacity={0.7}>
      <View style={styles.upcomingDate}>
        <Text style={styles.upcomingMonth}>
          {new Date(training.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={styles.upcomingDay}>
          {new Date(training.date).getDate()}
        </Text>
      </View>
      <View style={styles.upcomingInfo}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>{training.title}</Text>
          {training.isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}
        </View>
        <Text style={styles.upcomingMeta}>
          <Ionicons name="time-outline" size={12} color="#6B7280" /> {training.time}
        </Text>
        <Text style={styles.upcomingMeta}>
          <Ionicons name="location-outline" size={12} color="#6B7280" /> {training.location}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#DC2626"
        />
      }
    >
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hoursThisMonth}</Text>
          <Text style={styles.statLabel}>Hours This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hoursThisYear}</Text>
          <Text style={styles.statLabel}>Hours This Year</Text>
        </View>
      </View>

      {/* My Certifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Certifications</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {MOCK_CERTIFICATIONS.map(renderCertification)}
      </View>

      {/* Recent Training */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Training</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {MOCK_TRAINING_RECORDS.map(renderTrainingRecord)}
      </View>

      {/* Upcoming Training */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Training</Text>
        </View>
        {MOCK_UPCOMING_TRAINING.map(renderUpcomingTraining)}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  certInfo: {
    flex: 1,
    marginRight: 12,
  },
  certName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  certIssuer: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  certDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  certDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  certDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  certDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  expirationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recordMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recordBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  upcomingDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  upcomingMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});
