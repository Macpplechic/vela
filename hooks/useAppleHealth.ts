/**
 * useAppleHealth.ts
 * Fetches sleep, HRV, steps, and heart rate from Apple HealthKit.
 *
 * Usage:
 *   const { healthData, permissionStatus, requestPermissions, refresh } = useAppleHealth();
 *
 * Required setup (already handled by this PR):
 *   1. `react-native-health` installed
 *   2. HealthKit entitlement added to ios/Vela/Vela.entitlements
 *   3. NSHealthShareUsageDescription in app.json infoPlist
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HealthMetric {
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
}

export interface AppleHealthData {
  /** Average steps for today */
  stepsToday: number | null;
  /** Last night's sleep duration in hours */
  sleepHoursLast: number | null;
  /** Most recent resting heart rate (bpm) */
  restingHeartRate: number | null;
  /** Most recent HRV (ms, SDNN) */
  hrv: number | null;
  /** Last 7 days of step counts */
  stepsWeek: Array<{ date: string; value: number }>;
  /** Last 7 days of sleep hours */
  sleepWeek: Array<{ date: string; value: number }>;
  /** Timestamp of last successful fetch */
  lastFetched: string | null;
}

export type PermissionStatus = 'undetermined' | 'authorized' | 'denied' | 'unavailable';

const STORAGE_KEY = '@vela_apple_health';
const EMPTY_DATA: AppleHealthData = {
  stepsToday: null,
  sleepHoursLast: null,
  restingHeartRate: null,
  hrv: null,
  stepsWeek: [],
  sleepWeek: [],
  lastFetched: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAppleHealth() {
  const [healthData, setHealthData] = useState<AppleHealthData>(EMPTY_DATA);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load cached data on mount ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          setHealthData(JSON.parse(raw));
          setPermissionStatus('authorized');
        } catch {}
      }
    });
  }, []);

  // ── Request permissions & fetch ──────────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      setPermissionStatus('unavailable');
      return false;
    }

    try {
      // Dynamic import so the app doesn't crash on Android or simulators
      // where HealthKit isn't available.
      const AppleHealthKit = (await import('react-native-health')).default;
      const { Permissions } = await import('react-native-health');

      const options = {
        permissions: {
          read: [
            Permissions.Steps,
            Permissions.SleepAnalysis,
            Permissions.HeartRate,
            Permissions.HeartRateVariability,
            Permissions.RestingHeartRate,
          ],
          write: [] as string[],
        },
      };

      return new Promise(resolve => {
        AppleHealthKit.initHealthKit(options, async (err: string) => {
          if (err) {
            console.warn('[Vela HealthKit] Permission denied or error:', err);
            setPermissionStatus('denied');
            resolve(false);
            return;
          }
          setPermissionStatus('authorized');
          await fetchAllMetrics(AppleHealthKit, Permissions);
          resolve(true);
        });
      });
    } catch (e) {
      console.warn('[Vela HealthKit] Not available:', e);
      setPermissionStatus('unavailable');
      return false;
    }
  }, []);

  // ── Fetch all metrics ────────────────────────────────────────────────────
  const fetchAllMetrics = useCallback(
    async (AppleHealthKit: any, Permissions: any): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = daysAgo(7);

        const [steps, sleepRaw, heartRate, hrvRaw, stepsWeekRaw] = await Promise.all([
          // Steps today
          fetchSteps(AppleHealthKit, todayStart, now),
          // Sleep last 8 days (covers last night)
          fetchSleep(AppleHealthKit, daysAgo(8), now),
          // Resting heart rate (last 7 days, take most recent)
          fetchRestingHR(AppleHealthKit, sevenDaysAgo, now),
          // HRV (last 7 days, take most recent)
          fetchHRV(AppleHealthKit, sevenDaysAgo, now),
          // Steps per day for the last 7 days
          fetchStepsByDay(AppleHealthKit, sevenDaysAgo, now),
        ]);

        // Aggregate sleep by night (midnight–8am window)
        const sleepByNight = aggregateSleepByNight(sleepRaw);
        const sleepWeek = Object.entries(sleepByNight)
          .map(([date, hours]) => ({ date, value: hours }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);

        // Last night's sleep
        const lastNight = sleepWeek[sleepWeek.length - 1]?.value ?? null;

        const data: AppleHealthData = {
          stepsToday: steps,
          sleepHoursLast: lastNight,
          restingHeartRate: heartRate,
          hrv: hrvRaw,
          stepsWeek: stepsWeekRaw,
          sleepWeek,
          lastFetched: new Date().toISOString(),
        };

        setHealthData(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e: any) {
        setError(e?.message ?? 'Failed to fetch health data');
        console.warn('[Vela HealthKit] Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Refresh (re-fetch using cached permission) ───────────────────────────
  const refresh = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    if (permissionStatus !== 'authorized') {
      await requestPermissions();
      return;
    }
    try {
      const AppleHealthKit = (await import('react-native-health')).default;
      const { Permissions } = await import('react-native-health');
      await fetchAllMetrics(AppleHealthKit, Permissions);
    } catch (e) {
      console.warn('[Vela HealthKit] Refresh failed:', e);
    }
  }, [permissionStatus, fetchAllMetrics, requestPermissions]);

  return { healthData, permissionStatus, requestPermissions, refresh, isLoading, error };
}

// ── HealthKit fetch helpers ────────────────────────────────────────────────────
// All return Promises so we can use Promise.all above.

function fetchSteps(hk: any, start: Date, end: Date): Promise<number | null> {
  return new Promise(resolve => {
    hk.getStepCount(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, result: any) => {
        if (err) { resolve(null); return; }
        resolve(Math.round(result?.value ?? 0));
      }
    );
  });
}

function fetchSleep(hk: any, start: Date, end: Date): Promise<any[]> {
  return new Promise(resolve => {
    hk.getSleepSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, results: any[]) => {
        if (err || !results) { resolve([]); return; }
        // Only count "asleep" samples (not in-bed or awake)
        resolve(results.filter((s: any) => s.value === 'ASLEEP' || s.value === 'ASLEEPCORE' || s.value === 'ASLEEPDEEP' || s.value === 'ASLEEPREM'));
      }
    );
  });
}

function aggregateSleepByNight(samples: any[]): Record<string, number> {
  // Group sleep by the night it belongs to.
  // A sample from midnight–noon is attributed to the previous calendar day (the "night of").
  const byNight: Record<string, number> = {};
  for (const s of samples) {
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    const durationHours = (end.getTime() - start.getTime()) / 3600000;
    // Night key: if the sample starts before noon, attribute to yesterday
    const hour = start.getHours();
    const nightDate = new Date(start);
    if (hour < 12) nightDate.setDate(nightDate.getDate() - 1);
    const key = isoDate(nightDate);
    byNight[key] = (byNight[key] ?? 0) + durationHours;
  }
  // Round to 1 decimal
  for (const k in byNight) {
    byNight[k] = Math.round(byNight[k] * 10) / 10;
  }
  return byNight;
}

function fetchRestingHR(hk: any, start: Date, end: Date): Promise<number | null> {
  return new Promise(resolve => {
    hk.getRestingHeartRateSamples(
      { startDate: start.toISOString(), endDate: end.toISOString(), limit: 7 },
      (err: any, results: any[]) => {
        if (err || !results?.length) { resolve(null); return; }
        // Most recent
        const sorted = [...results].sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        resolve(Math.round(sorted[0]?.value ?? 0) || null);
      }
    );
  });
}

function fetchHRV(hk: any, start: Date, end: Date): Promise<number | null> {
  return new Promise(resolve => {
    hk.getHeartRateVariabilitySamples(
      { startDate: start.toISOString(), endDate: end.toISOString(), limit: 7 },
      (err: any, results: any[]) => {
        if (err || !results?.length) { resolve(null); return; }
        const sorted = [...results].sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        // HRV from HealthKit comes in seconds (SDNN), convert to ms
        const raw = sorted[0]?.value ?? 0;
        const ms = raw < 1 ? Math.round(raw * 1000) : Math.round(raw);
        resolve(ms > 0 ? ms : null);
      }
    );
  });
}

function fetchStepsByDay(hk: any, start: Date, end: Date): Promise<Array<{ date: string; value: number }>> {
  return new Promise(resolve => {
    hk.getDailyStepCountSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (err: any, results: any[]) => {
        if (err || !results?.length) { resolve([]); return; }
        const byDay: Record<string, number> = {};
        for (const r of results) {
          const d = isoDate(new Date(r.startDate));
          byDay[d] = (byDay[d] ?? 0) + Math.round(r.value);
        }
        resolve(
          Object.entries(byDay)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date))
        );
      }
    );
  });
}
