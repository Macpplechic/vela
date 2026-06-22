import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Configure how notifications appear when app is foregrounded ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Request permission ──
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Cancel all scheduled notifications ──
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Schedule all Vela notifications ──
export async function scheduleVelaNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await cancelAllNotifications();

  // 1. Morning ritual reminder — 7:30am daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning. ◐',
      body: 'Your 5-minute ritual is waiting. Start your day with intention.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 30,
    },
  });

  // 2. Supplement reminder — 8:00am daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your supplements. ✦',
      body: 'Open Vela to check off your morning routine.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  // 3. Food log nudge — 1:00pm daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How is your plate today?',
      body: 'Log your meals to track your hormone-supportive nutrition.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });

  // 4. Symptom check-in — 5:00pm daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How is your body today? ◎',
      body: 'A quick symptom check-in takes 10 seconds and builds your health picture.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 17,
      minute: 0,
    },
  });

  // 5. Sleep log reminder — 9:00pm daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Wind down with Vela. ◌',
      body: 'Log your sleep quality and start your bedtime breathwork.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });

  // 6. Weekly insight — Sunday 10am
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your weekly patterns are ready. ✦',
      body: 'See what Vela has learned about your body this week.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 10,
      minute: 0,
    },
  });

  return true;
}

// ── Smart morning check-in notification ──────────────────────────────────────
// Sent at 7:45am — lands between the 7:30 ritual reminder and 8:00 supp nudge.
// Deep-links to the ritual tab so one tap opens the check-in card.
export async function scheduleCheckInNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel any existing check-in notification before rescheduling
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'checkin') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning ◐  Quick check-in',
      body: 'How did you sleep? How is your energy? Tap to log in 3 taps.',
      sound: true,
      data: { type: 'checkin', screen: '/(tabs)/ritual', session: 'morning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 45,
    },
  });
}

// ── Update notification times (user-customizable) ──
export async function updateNotificationTime(
  type: 'morning' | 'supplements' | 'sleep',
  hour: number,
  minute: number
) {
  // Cancel and reschedule just that one
  await scheduleVelaNotifications();
}
