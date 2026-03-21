/**
 * Notification Service - Push notification handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { NOTIFICATION_CONFIG } from '@fireresponse/shared';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const NotificationService = {
  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Check if physical device
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CONFIG.CHANNELS.INCIDENT_ALERT,
        {
          name: 'Incident Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#DC2626',
          sound: 'alert.wav',
          enableVibrate: true,
          enableLights: true,
          bypassDnd: true,
        }
      );

      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CONFIG.CHANNELS.STATUS_UPDATE,
        {
          name: 'Status Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
        }
      );
    }

    // Get Expo push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Device.default.expoConfig?.extra?.eas?.projectId,
      });
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  },

  /**
   * Set up notification response handlers
   */
  setupNotificationHandlers(): () => void {
    // Handle notification received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Could update badge, show in-app alert, etc.
      }
    );

    // Handle notification tap
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.incident_id) {
          // Navigate to incident screen
          router.push(`/incident/${data.incident_id}`);
        }
      }
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  /**
   * Get last notification response (for handling app launch from notification)
   */
  async getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Structure Fire',
        body: '123 Main Street - Engine/Ladder Response',
        data: { incident_id: 'test-incident-id' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: { seconds: 2 },
    });
  },
};
