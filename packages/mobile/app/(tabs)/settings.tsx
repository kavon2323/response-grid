/**
 * Settings Tab - User preferences and app settings
 */

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/services/notification-service';

export default function SettingsTab() {
  const { profile, signOut, refreshProfile } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const toggleLocationSharing = async (
    field: 'share_location_with_command' | 'share_location_with_responders'
  ) => {
    if (!profile) return;

    const newValue = !profile[field];

    await supabase
      .from('users')
      .update({ [field]: newValue })
      .eq('id', profile.id);

    await refreshProfile();
  };

  const testNotification = () => {
    NotificationService.scheduleTestNotification();
    Alert.alert('Test Notification', 'A test notification will appear in 2 seconds.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Station</Text>
            <Text style={styles.infoValue}>--</Text>
          </View>
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => toggleLocationSharing('share_location_with_command')}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="shield-checkmark" size={24} color="#DC2626" />
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Share with Command</Text>
                <Text style={styles.toggleDescription}>
                  Chiefs and officers can see your location
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggle,
                profile?.share_location_with_command && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  profile?.share_location_with_command && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => toggleLocationSharing('share_location_with_responders')}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="people" size={24} color="#DC2626" />
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Share with Responders</Text>
                <Text style={styles.toggleDescription}>
                  Other members can see your location during response
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggle,
                profile?.share_location_with_responders && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  profile?.share_location_with_responders && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={testNotification}>
            <View style={styles.actionInfo}>
              <Ionicons name="notifications" size={24} color="#6B7280" />
              <Text style={styles.actionLabel}>Test Notification</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionInfo}>
              <Ionicons name="document-text" size={24} color="#6B7280" />
              <Text style={styles.actionLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionInfo}>
              <Ionicons name="help-circle" size={24} color="#6B7280" />
              <Text style={styles.actionLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: '#374151',
  },
  infoValue: {
    fontSize: 15,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#DC2626',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    fontSize: 15,
    color: '#374151',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
