/**
 * useReviewPrompt.ts
 * Triggers an in-app App Store review request at the right moment.
 *
 * Strategy: request after the user has logged for 7+ days AND hasn't been
 * asked in the last 90 days (Apple caps prompts at 3/year anyway).
 *
 * Call `maybeRequestReview(streak)` after any positive action —
 * supplement check, symptom log, etc.
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_REVIEW = '@vela_last_review_request';
const MIN_STREAK      = 7;   // days of use before asking
const COOLDOWN_DAYS   = 90;  // don't ask again for 90 days

export async function maybeRequestReview(streak: number): Promise<void> {
  try {
    // Not enough engagement yet
    if (streak < MIN_STREAK) return;

    // Check if we've asked recently
    const lastRaw = await AsyncStorage.getItem(KEY_LAST_REVIEW);
    if (lastRaw) {
      const daysSince = (Date.now() - new Date(lastRaw).getTime()) / 86400000;
      if (daysSince < COOLDOWN_DAYS) return;
    }

    // Check the OS will actually show it (iOS 10.3+, App Store build)
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Record the request first so a crash doesn't cause a double-prompt
    await AsyncStorage.setItem(KEY_LAST_REVIEW, new Date().toISOString());

    await StoreReview.requestReview();
  } catch (e) {
    // Never crash the app over a review prompt
    console.warn('[Vela] Review prompt failed:', e);
  }
}
