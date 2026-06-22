import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native';
import { VelaProvider } from '../context/VelaContext';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
} from '@expo-google-fonts/jost';

import { scheduleVelaNotifications } from '../hooks/useNotifications';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_VERSION = '1.1.0';
const WHATS_NEW_KEY = '@vela_whats_new_seen';

SplashScreen.preventAutoHideAsync();

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_400Regular_Italic,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
  });

  useEffect(() => {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (!isExpoGo) {
      Purchases.configure({ apiKey: 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC' });
    }
  }, []);

  // ── Show What's New once per version ──────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(WHATS_NEW_KEY).then(seen => {
      if (seen !== CURRENT_VERSION) {
        AsyncStorage.setItem(WHATS_NEW_KEY, CURRENT_VERSION);
        setTimeout(() => {
          try { router.push('/whatsnew'); } catch {}
        }, 1500);
      }
    });
  }, []);

  // ── Notification deep linking ──────────────────────────────────────────────
  useEffect(() => {
    // Handle notification tap when app is backgrounded
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (!data) return;
      try {
        if (data.screen) {
          // Small delay to let the layout mount
          setTimeout(() => router.push(data.screen), 300);
        }
      } catch {}
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <VelaProvider>
        <StatusBar style="light" backgroundColor="#3D1F3A" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="debug" />
          <Stack.Screen name="firstwin" />
          <Stack.Screen name="coach" options={{ presentation: 'modal' }} />
          <Stack.Screen name="hrt" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bone" options={{ presentation: 'modal' }} />
          <Stack.Screen name="trends" options={{ presentation: 'modal' }} />
          <Stack.Screen name="doctor" options={{ presentation: 'modal' }} />
          <Stack.Screen name="cbt" options={{ presentation: 'modal' }} />
          <Stack.Screen name="partner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="whatsnew" options={{ presentation: 'modal', gestureEnabled: false }} />
        </Stack>
      </VelaProvider>
    </SafeAreaProvider>
  );
}
