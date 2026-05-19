import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhaseKey, Food, SUPP_LIBRARY } from '../constants/Data';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyEntry {
  date: string;           // 'YYYY-MM-DD'
  foods: Food[];
  symptoms: string[];
  checkedSupps: string[];
  journal: string;
  totals: NutrientTotals;
}

export interface NutrientTotals {
  protein: number; fiber: number; calcium: number;
  magnesium: number; omega3: number; phyto: number;
  cal: number; ai: number;
}

export interface FluxLog {
  id?: number;
  date: string;
  flow?: string | null;
  symptoms?: string[];
  triggers?: {
    food: string; stress: number; sleep: number;
    exercise: string; alcohol: boolean; caffeine: boolean; weather: string;
  };
}

export interface SleepLog {
  quality: number | null;
  nightSweats: boolean;
  wakeCount: number;
  notes: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const K = {
  PHASE:              '@vela_phase',
  ONBOARDED:          '@vela_onboarded',
  MY_SUPPS:           '@vela_my_supps',
  CHECKED_SUPPS:      '@vela_checked_supps',
  SYMPTOMS:           '@vela_symptoms',
  JOURNAL:            '@vela_journal',
  FOODS:              '@vela_foods',
  LIKED_POSTS:        '@vela_liked_posts',
  FLUX_LOGS:          '@vela_flux_logs',
  SLEEP_LOG:          '@vela_sleep_log',
  FLUX_TRIAL_STARTED: '@vela_flux_trial',
  COOL_TRIAL_STARTED: '@vela_cool_trial',
  FLUX_UNLOCKED:      '@vela_flux_unlocked',
  COOL_UNLOCKED:      '@vela_cool_unlocked',
  BUNDLE_UNLOCKED:    '@vela_bundle_unlocked',
  BUNDLE_TRIAL:       '@vela_bundle_trial',
  HISTORY:            '@vela_history',
  LAST_ACTIVE_DATE:   '@vela_last_active_date',
  SLEEP_HISTORY:      '@vela_sleep_history',
  STREAK:             '@vela_streak',
  LAST_STREAK_DATE:   '@vela_last_streak_date',
  BLOCKED_USERS:      '@vela_blocked_users',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
const TRIAL_DAYS = 7;
const HISTORY_DAYS = 90;
const DEFAULT_SUPPS: string[] = [];

const calcTotals = (foods: Food[]): NutrientTotals =>
  foods.reduce(
    (a, f) => ({
      protein:   a.protein   + f.protein,
      fiber:     a.fiber     + f.fiber,
      calcium:   a.calcium   + f.calcium,
      magnesium: a.magnesium + f.magnesium,
      omega3:    a.omega3    + f.omega3,
      phyto:     a.phyto     + f.phyto,
      cal:       a.cal       + f.cal,
      ai:        a.ai        + f.ai,
    }),
    { protein:0, fiber:0, calcium:0, magnesium:0, omega3:0, phyto:0, cal:0, ai:0 }
  );

export interface SleepEntry {
  date: string;
  quality: number | null;
  nightSweats: boolean;
  wakeCount: number;
  notes: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export function useVelaStore() {
  const [isLoading, setIsLoading]               = useState(true);
  const [phase, setPhaseState]                  = useState<PhaseKey | null>(null);
  const [onboarded, setOnboardedState]          = useState(false);
  const [mySupps, setMySuppsState]              = useState<string[]>(DEFAULT_SUPPS);
  const [checkedSupps, setCheckedSuppsState]    = useState<string[]>([]);
  const [symptoms, setSymptomsState]            = useState<string[]>([]);
  const [journal, setJournalState]              = useState('');
  const [foods, setFoodsState]                  = useState<Food[]>([]);
  const [likedPosts, setLikedPostsState]        = useState<number[]>([]);
  const [fluxLogs, setFluxLogsState]            = useState<FluxLog[]>([]);
  const [sleepLog, setSleepLogState]            = useState<SleepLog>({ quality:null, nightSweats:false, wakeCount:0, notes:'' });
  const [fluxTrialStarted, setFluxTrialState]   = useState<string | null>(null);
  const [coolTrialStarted, setCoolTrialState]   = useState<string | null>(null);
  const [fluxUnlocked, setFluxUnlockedState]    = useState(false);
  const [coolUnlocked, setCoolUnlockedState]    = useState(false);
  const [bundleUnlocked, setBundleUnlockedState] = useState(false);
  const [bundleTrialStarted, setBundleTrialState] = useState<string | null>(null);
  const [history, setHistoryState]              = useState<DailyEntry[]>([]);
  const [sleepHistory, setSleepHistoryState]    = useState<SleepEntry[]>([]);
  const [streak, setStreakState]                = useState(0);
  const [lastStreakDate, setLastStreakDateState] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsersState]    = useState<string[]>([]);

  // ── Load & daily reset ────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const keys = Object.values(K);
        const pairs = await AsyncStorage.multiGet(keys);
        const stored: Record<string, string | null> = {};
        pairs.forEach(([k, v]) => { stored[k] = v; });

        if (stored[K.PHASE])        setPhaseState(JSON.parse(stored[K.PHASE]!));
        if (stored[K.ONBOARDED])    setOnboardedState(JSON.parse(stored[K.ONBOARDED]!));
        if (stored[K.MY_SUPPS])     setMySuppsState(JSON.parse(stored[K.MY_SUPPS]!));
        if (stored[K.LIKED_POSTS])  setLikedPostsState(JSON.parse(stored[K.LIKED_POSTS]!));
        if (stored[K.FLUX_LOGS])    setFluxLogsState(JSON.parse(stored[K.FLUX_LOGS]!));
        if (stored[K.SLEEP_LOG])    setSleepLogState(JSON.parse(stored[K.SLEEP_LOG]!));
        if (stored[K.FLUX_TRIAL_STARTED]) setFluxTrialState(stored[K.FLUX_TRIAL_STARTED]);
        if (stored[K.COOL_TRIAL_STARTED]) setCoolTrialState(stored[K.COOL_TRIAL_STARTED]);
        if (stored[K.FLUX_UNLOCKED])  setFluxUnlockedState(JSON.parse(stored[K.FLUX_UNLOCKED]!));
        if (stored[K.COOL_UNLOCKED])  setCoolUnlockedState(JSON.parse(stored[K.COOL_UNLOCKED]!));
        if (stored[K.BLOCKED_USERS])  setBlockedUsersState(JSON.parse(stored[K.BLOCKED_USERS]!));

        // Load history
        const hist: DailyEntry[] = stored[K.HISTORY] ? JSON.parse(stored[K.HISTORY]!) : [];
        setHistoryState(hist);

        const todayStr = today();
        const lastActive = stored[K.LAST_ACTIVE_DATE] ?? '';

        if (lastActive === todayStr) {
          // Same day — restore today's data as-is
          if (stored[K.FOODS])        setFoodsState(JSON.parse(stored[K.FOODS]!));
          if (stored[K.CHECKED_SUPPS])setCheckedSuppsState(JSON.parse(stored[K.CHECKED_SUPPS]!));
          if (stored[K.SYMPTOMS])     setSymptomsState(JSON.parse(stored[K.SYMPTOMS]!));
          if (stored[K.JOURNAL])      setJournalState(stored[K.JOURNAL]!);
        } else if (lastActive && lastActive !== todayStr) {
          // New day — archive yesterday into history, then reset today
          const yesterdayFoods: Food[]    = stored[K.FOODS]         ? JSON.parse(stored[K.FOODS]!)         : [];
          const yesterdaySymps: string[]  = stored[K.SYMPTOMS]      ? JSON.parse(stored[K.SYMPTOMS]!)      : [];
          const yesterdaySupps: string[]  = stored[K.CHECKED_SUPPS] ? JSON.parse(stored[K.CHECKED_SUPPS]!) : [];
          const yesterdayJournal: string  = stored[K.JOURNAL] ?? '';

          if (yesterdayFoods.length > 0 || yesterdaySymps.length > 0 || yesterdayJournal) {
            const entry: DailyEntry = {
              date: lastActive,
              foods: yesterdayFoods,
              symptoms: yesterdaySymps,
              checkedSupps: yesterdaySupps,
              journal: yesterdayJournal,
              totals: calcTotals(yesterdayFoods),
            };
            // Keep only last HISTORY_DAYS entries
            const updatedHist = [entry, ...hist]
              .filter((e, i, arr) => arr.findIndex(x => x.date === e.date) === i) // dedupe
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, HISTORY_DAYS);
            setHistoryState(updatedHist);
            await AsyncStorage.setItem(K.HISTORY, JSON.stringify(updatedHist));
          }

          // Reset today's daily fields
          setFoodsState([]);
          setCheckedSuppsState([]);
          setSymptomsState([]);
          setJournalState('');
          await AsyncStorage.multiRemove([K.FOODS, K.CHECKED_SUPPS, K.SYMPTOMS, K.JOURNAL]);
        }

        // Always update last active date
        await AsyncStorage.setItem(K.LAST_ACTIVE_DATE, todayStr);

      } catch (e) {
        console.error('Failed to load state:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Setters ───────────────────────────────────────────────────────────────

  const setPhase = useCallback(async (p: PhaseKey) => {
    setPhaseState(p);
    await AsyncStorage.setItem(K.PHASE, JSON.stringify(p));
  }, []);

  const setOnboarded = useCallback(async (v: boolean) => {
    setOnboardedState(v);
    await AsyncStorage.setItem(K.ONBOARDED, JSON.stringify(v));
  }, []);

  const setMySupps = useCallback(async (supps: string[]) => {
    setMySuppsState(supps);
    await AsyncStorage.setItem(K.MY_SUPPS, JSON.stringify(supps));
  }, []);

  const setCheckedSupps = useCallback(async (supps: string[]) => {
    setCheckedSuppsState(supps);
    await AsyncStorage.setItem(K.CHECKED_SUPPS, JSON.stringify(supps));
  }, []);

  const setSymptoms = useCallback(async (s: string[]) => {
    setSymptomsState(s);
    await AsyncStorage.setItem(K.SYMPTOMS, JSON.stringify(s));
  }, []);

  const setJournal = useCallback(async (j: string) => {
    setJournalState(j);
    await AsyncStorage.setItem(K.JOURNAL, j);
  }, []);

  const setFoods = useCallback(async (f: Food[]) => {
    setFoodsState(f);
    await AsyncStorage.setItem(K.FOODS, JSON.stringify(f));
  }, []);

  const setLikedPosts = useCallback(async (ids: number[]) => {
    setLikedPostsState(ids);
    await AsyncStorage.setItem(K.LIKED_POSTS, JSON.stringify(ids));
  }, []);

  const unlockFlux = async () => { setFluxUnlockedState(true); await AsyncStorage.setItem(K.FLUX_UNLOCKED, JSON.stringify(true)); };
  const unlockCool = async () => { setCoolUnlockedState(true); await AsyncStorage.setItem(K.COOL_UNLOCKED, JSON.stringify(true)); };
  const unlockBundle = async () => { setBundleUnlockedState(true); setFluxUnlockedState(true); setCoolUnlockedState(true); await AsyncStorage.multiSet([[K.BUNDLE_UNLOCKED, JSON.stringify(true)],[K.FLUX_UNLOCKED, JSON.stringify(true)],[K.COOL_UNLOCKED, JSON.stringify(true)]]); };

  const setFluxLogs = useCallback(async (logs: FluxLog[]) => {
    setFluxLogsState(logs);
    await AsyncStorage.setItem(K.FLUX_LOGS, JSON.stringify(logs));
  }, []);

  const setSleepLog = useCallback(async (log: SleepLog) => {
    setSleepLogState(log);
    await AsyncStorage.setItem(K.SLEEP_LOG, JSON.stringify(log));
  }, []);

  const incrementStreak = useCallback(async (currentStreak: number, lastDate: string | null) => {
    const todayS = new Date().toISOString().split('T')[0];
    if (lastDate === todayS) return currentStreak;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yesterdayS = yesterday.toISOString().split('T')[0];
    const newStreak = lastDate === yesterdayS ? currentStreak + 1 : 1;
    setStreakState(newStreak);
    setLastStreakDateState(todayS);
    await AsyncStorage.setItem(K.STREAK, JSON.stringify(newStreak));
    await AsyncStorage.setItem(K.LAST_STREAK_DATE, todayS);
    return newStreak;
  }, []);

  const saveSleepEntry = useCallback(async (entry: SleepEntry, currentHistory: SleepEntry[]) => {
    const updated = [entry, ...currentHistory]
      .filter((e, i, arr) => arr.findIndex(x => x.date === e.date) === i)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 90);
    setSleepHistoryState(updated);
    await AsyncStorage.setItem(K.SLEEP_HISTORY, JSON.stringify(updated));
  }, []);

  const startFluxTrial = useCallback(async () => {
    const date = new Date().toISOString();
    setFluxTrialState(date);
    await AsyncStorage.setItem(K.FLUX_TRIAL_STARTED, date);
  }, []);

  const startCoolTrial = useCallback(async () => {
    const date = new Date().toISOString();
    setCoolTrialState(date);
    await AsyncStorage.setItem(K.COOL_TRIAL_STARTED, date);
  }, []);

  const startBundleTrial = useCallback(async () => {
    const now = new Date().toISOString();
    setBundleTrialState(now);
    setFluxTrialState(now);
    setCoolTrialState(now);
    await AsyncStorage.multiSet([[K.BUNDLE_TRIAL, now],[K.FLUX_TRIAL_STARTED, now],[K.COOL_TRIAL_STARTED, now]]);
  }, []);

  const setBlockedUsers = useCallback(async (users: string[]) => {
    setBlockedUsersState(users);
    await AsyncStorage.setItem(K.BLOCKED_USERS, JSON.stringify(users));
  }, []);

  const resetOnboarding = useCallback(async () => {
    setPhaseState(null);
    setOnboardedState(false);
    await AsyncStorage.multiRemove([K.PHASE, K.ONBOARDED]);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const trialDaysLeft = (started: string | null) => {
    if (!started) return null;
    const diff = Math.floor((Date.now() - new Date(started).getTime()) / 86400000);
    return Math.max(0, TRIAL_DAYS - diff);
  };

  const fluxDaysLeft = trialDaysLeft(fluxTrialStarted);
  const coolDaysLeft = trialDaysLeft(coolTrialStarted);
  const bundleDaysLeft = trialDaysLeft(bundleTrialStarted);
  const fluxActive   = bundleUnlocked || fluxUnlocked || (fluxTrialStarted !== null && (fluxDaysLeft ?? 0) > 0) || (bundleTrialStarted !== null && (bundleDaysLeft ?? 0) > 0);
  const coolActive   = bundleUnlocked || coolUnlocked || (coolTrialStarted !== null && (coolDaysLeft ?? 0) > 0) || (bundleTrialStarted !== null && (bundleDaysLeft ?? 0) > 0);
  const bundleActive = bundleUnlocked || (bundleTrialStarted !== null && (bundleDaysLeft ?? 0) > 0);
  const totals       = calcTotals(foods);
  const mySuppsData = (mySupps.map((id: string) => SUPP_LIBRARY.find((s: any) => s.id === id)).filter(Boolean)) as any[];

  // ── Monthly helpers ───────────────────────────────────────────────────────

  // Returns history entries for a given month: 'YYYY-MM'
  const getMonthHistory = useCallback((yearMonth: string) =>
    history.filter(e => e.date.startsWith(yearMonth)),
  [history]);

  // Most frequent symptoms in the last 30 days
  const topSymptoms = useCallback((n = 5) => {
    const counts: Record<string, number> = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    history
      .filter(e => new Date(e.date) >= cutoff)
      .forEach(e => e.symptoms.forEach(s => { counts[s] = (counts[s] ?? 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([symptom, count]) => ({ symptom, count }));
  }, [history]);

  // Average nutrient totals over last 30 days
  const avgNutrients = useCallback((): NutrientTotals => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = history.filter(e => new Date(e.date) >= cutoff && e.foods.length > 0);
    if (recent.length === 0) return { protein:0, fiber:0, calcium:0, magnesium:0, omega3:0, phyto:0, cal:0, ai:0 };
    const sum = recent.reduce((a, e) => ({
      protein:   a.protein   + e.totals.protein,
      fiber:     a.fiber     + e.totals.fiber,
      calcium:   a.calcium   + e.totals.calcium,
      magnesium: a.magnesium + e.totals.magnesium,
      omega3:    a.omega3    + e.totals.omega3,
      phyto:     a.phyto     + e.totals.phyto,
      cal:       a.cal       + e.totals.cal,
      ai:        a.ai        + e.totals.ai,
    }), { protein:0, fiber:0, calcium:0, magnesium:0, omega3:0, phyto:0, cal:0, ai:0 });
    const n = recent.length;
    return {
      protein:   sum.protein   / n,
      fiber:     sum.fiber     / n,
      calcium:   sum.calcium   / n,
      magnesium: sum.magnesium / n,
      omega3:    sum.omega3    / n,
      phyto:     sum.phyto     / n,
      cal:       sum.cal       / n,
      ai:        sum.ai        / n,
    };
  }, [history]);

  // Supplement adherence % over last 30 days
  const suppAdherence = useCallback(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = history.filter(e => new Date(e.date) >= cutoff);
    if (recent.length === 0 || mySupps.length === 0) return 0;
    const totalPossible = recent.length * mySupps.length;
    const totalChecked = recent.reduce((a, e) => a + e.checkedSupps.length, 0);
    return Math.round((totalChecked / totalPossible) * 100);
  }, [history, mySupps]);

  return {
    isLoading, phase, onboarded, mySupps, mySuppsData, checkedSupps, symptoms,
    journal, foods, totals, likedPosts, fluxLogs, sleepLog,
    fluxTrialStarted, coolTrialStarted, fluxUnlocked, coolUnlocked,
    fluxDaysLeft, coolDaysLeft, fluxActive, coolActive, unlockFlux, unlockCool,
    history, sleepHistory, streak, lastStreakDate, getMonthHistory, topSymptoms, avgNutrients, suppAdherence,
    setPhase, setOnboarded, setMySupps, setCheckedSupps, setSymptoms,
    setJournal, setFoods, setLikedPosts, setFluxLogs, setSleepLog, saveSleepEntry, incrementStreak,
    startFluxTrial, startCoolTrial, startBundleTrial, resetOnboarding,
    unlockBundle, bundleActive, bundleDaysLeft,
    blockedUsers, setBlockedUsers,
  };
}
