/**
 * Root Layout - App-wide providers and initialization
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationService } from '@/services/notification-service';

// Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootLayoutNav() {
  const { isInitialized, isLoading, isAuthenticated, initialize, updatePushToken } = useAuthStore();

  useEffect(() => {
    // Initialize auth
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Set up notification handlers
    const cleanup = NotificationService.setupNotificationHandlers();
    return cleanup;
  }, []);

  useEffect(() => {
    // Register push notifications when authenticated
    if (isAuthenticated) {
      NotificationService.registerForPushNotifications().then((token) => {
        if (token) {
          updatePushToken(token);
        }
      });
    }
  }, [isAuthenticated, updatePushToken]);

  useEffect(() => {
    // Hide splash screen when initialized
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#DC2626' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#F3F4F6' },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="incident/[id]"
              options={{
                title: 'Incident',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="auth/sign-in"
            options={{
              title: 'Sign In',
              headerShown: false,
            }}
          />
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});
