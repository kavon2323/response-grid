/**
 * Calendar Tab - Department events with RSVP functionality
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Event types
type EventType = 'meeting' | 'training' | 'drill' | 'social' | 'fundraiser' | 'other';
type RsvpStatus = 'yes' | 'no' | 'maybe' | null;

interface DepartmentEvent {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isAllDay: boolean;
  isRequired: boolean;
  organizer: string;
  rsvpRequired: boolean;
  attendeeCount: number;
  myRsvp: RsvpStatus;
}

// Mock data
const MOCK_EVENTS: DepartmentEvent[] = [
  {
    id: '1',
    title: 'Monthly Business Meeting',
    description: 'Regular monthly department meeting. Agenda includes budget review, upcoming events, and committee reports.',
    eventType: 'meeting',
    date: '2026-03-24',
    startTime: '19:00',
    endTime: '21:00',
    location: 'Station 1 - Training Room',
    isAllDay: false,
    isRequired: true,
    organizer: 'Chief Williams',
    rsvpRequired: true,
    attendeeCount: 32,
    myRsvp: 'yes',
  },
  {
    id: '2',
    title: 'Ladder Operations Drill',
    description: 'Quarterly ladder truck operations drill. All members assigned to ladder company must attend.',
    eventType: 'drill',
    date: '2026-03-25',
    startTime: '18:00',
    endTime: '21:00',
    location: 'Station 1',
    isAllDay: false,
    isRequired: true,
    organizer: 'Lt. Smith',
    rsvpRequired: true,
    attendeeCount: 15,
    myRsvp: null,
  },
  {
    id: '3',
    title: 'Annual Awards Dinner',
    description: 'Join us to celebrate our members achievements. Dinner and awards ceremony. Family members welcome!',
    eventType: 'social',
    date: '2026-04-05',
    startTime: '18:00',
    endTime: '22:00',
    location: 'Firehouse Banquet Hall',
    isAllDay: false,
    isRequired: false,
    organizer: 'Social Committee',
    rsvpRequired: true,
    attendeeCount: 78,
    myRsvp: 'maybe',
  },
  {
    id: '4',
    title: 'Car Wash Fundraiser',
    description: 'Annual car wash fundraiser to benefit the equipment fund. Volunteers needed for all shifts.',
    eventType: 'fundraiser',
    date: '2026-04-12',
    startTime: '09:00',
    endTime: '15:00',
    location: 'Station 2 - Parking Lot',
    isAllDay: false,
    isRequired: false,
    organizer: 'Fundraising Committee',
    rsvpRequired: true,
    attendeeCount: 12,
    myRsvp: 'no',
  },
  {
    id: '5',
    title: 'EMS Protocol Training',
    description: 'Required annual EMS protocol update training. New protocols from state EMS will be covered.',
    eventType: 'training',
    date: '2026-04-15',
    startTime: '19:00',
    endTime: '21:00',
    location: 'Training Center',
    isAllDay: false,
    isRequired: true,
    organizer: 'EMS Coordinator',
    rsvpRequired: true,
    attendeeCount: 45,
    myRsvp: null,
  },
];

const EVENT_TYPE_CONFIG: Record<EventType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string; label: string }> = {
  meeting: { icon: 'people', color: '#2563EB', bgColor: '#EFF6FF', label: 'Meeting' },
  training: { icon: 'school', color: '#7C3AED', bgColor: '#F5F3FF', label: 'Training' },
  drill: { icon: 'fitness', color: '#DC2626', bgColor: '#FEF2F2', label: 'Drill' },
  social: { icon: 'beer', color: '#059669', bgColor: '#ECFDF5', label: 'Social' },
  fundraiser: { icon: 'cash', color: '#D97706', bgColor: '#FFFBEB', label: 'Fundraiser' },
  other: { icon: 'calendar', color: '#6B7280', bgColor: '#F3F4F6', label: 'Other' },
};

export default function CalendarTab() {
  const [events, setEvents] = useState<DepartmentEvent[]>(MOCK_EVENTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleRsvp = (eventId: string, status: RsvpStatus) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? { ...event, myRsvp: status }
          : event
      )
    );

    const statusText = status === 'yes' ? 'Yes' : status === 'no' ? 'No' : 'Maybe';
    Alert.alert('RSVP Updated', `Your response has been recorded as "${statusText}".`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return formatDate(dateString);
  };

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.eventType === filterType);

  const renderFilterButton = (type: EventType | 'all', label: string) => {
    const isActive = filterType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilterType(type)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRsvpButton = (
    eventId: string,
    status: RsvpStatus,
    currentRsvp: RsvpStatus,
    label: string,
    color: string
  ) => {
    const isSelected = currentRsvp === status;
    return (
      <TouchableOpacity
        style={[
          styles.rsvpButton,
          isSelected && { backgroundColor: color, borderColor: color },
        ]}
        onPress={() => handleRsvp(eventId, status)}
      >
        <Text style={[styles.rsvpButtonText, isSelected && styles.rsvpButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEvent = (event: DepartmentEvent) => {
    const typeConfig = EVENT_TYPE_CONFIG[event.eventType];
    const isExpanded = expandedEvent === event.id;

    return (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventCard, event.isRequired && styles.eventCardRequired]}
        onPress={() => setExpandedEvent(isExpanded ? null : event.id)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={[styles.eventTypeIcon, { backgroundColor: typeConfig.bgColor }]}>
            <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
          </View>
          <View style={styles.eventInfo}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              {event.isRequired && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.eventDate}>{getDaysUntil(event.date)}</Text>
          </View>
        </View>

        <View style={styles.eventMeta}>
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.eventMetaText}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.eventMetaText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.eventDetails}>
            <Text style={styles.eventDescription}>{event.description}</Text>

            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Organizer</Text>
              <Text style={styles.eventDetailValue}>{event.organizer}</Text>
            </View>

            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Attending</Text>
              <Text style={styles.eventDetailValue}>{event.attendeeCount} members</Text>
            </View>

            {event.rsvpRequired && (
              <View style={styles.rsvpSection}>
                <Text style={styles.rsvpLabel}>Your Response:</Text>
                <View style={styles.rsvpButtons}>
                  {renderRsvpButton(event.id, 'yes', event.myRsvp, 'Yes', '#059669')}
                  {renderRsvpButton(event.id, 'maybe', event.myRsvp, 'Maybe', '#D97706')}
                  {renderRsvpButton(event.id, 'no', event.myRsvp, 'No', '#DC2626')}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Text style={[styles.typeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
          {event.myRsvp && (
            <View style={[
              styles.rsvpStatusBadge,
              {
                backgroundColor:
                  event.myRsvp === 'yes' ? '#ECFDF5' :
                  event.myRsvp === 'maybe' ? '#FFFBEB' : '#FEF2F2'
              }
            ]}>
              <Text style={[
                styles.rsvpStatusText,
                {
                  color:
                    event.myRsvp === 'yes' ? '#059669' :
                    event.myRsvp === 'maybe' ? '#D97706' : '#DC2626'
                }
              ]}>
                {event.myRsvp === 'yes' ? 'Going' : event.myRsvp === 'maybe' ? 'Maybe' : 'Not Going'}
              </Text>
            </View>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {renderFilterButton('all', 'All')}
        {renderFilterButton('meeting', 'Meetings')}
        {renderFilterButton('training', 'Training')}
        {renderFilterButton('drill', 'Drills')}
        {renderFilterButton('social', 'Social')}
        {renderFilterButton('fundraiser', 'Fundraiser')}
      </ScrollView>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#DC2626"
          />
        }
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Events</Text>
            <Text style={styles.emptyText}>
              No upcoming events match your filter
            </Text>
          </View>
        ) : (
          filteredEvents.map(renderEvent)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 56,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCardRequired: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  eventMeta: {
    marginTop: 12,
    gap: 6,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  eventDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  eventDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  rsvpSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rsvpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  rsvpButtonTextActive: {
    color: '#FFFFFF',
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  rsvpStatusText: {
    fontSize: 12,
    fontWeight: '600',
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
