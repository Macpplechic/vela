/**
 * useVelaScore.ts
 * Computes a daily "Vela Score" (0–100) across four pillars:
 *   • Sleep quality (from sleepHistory)
 *   • Nutrition (from today's food totals vs phase targets)
 *   • Supplement adherence (checked vs total in stack)
 *   • Symptom load (inverse — fewer symptoms = higher score)
 *
 * Also computes a 7-day trend so we can show ↑ ↓ → on the dashboard.
 */

import { useMemo } from 'react';
import { DailyEntry, SleepEntry } from './useVelaStore';
import { NutrientTotals } from './useVelaStore';
import { PHASES, PhaseKey } from '../constants/Data';

export interface VelaScore {
  /** Today's composite score 0–100 */
  today: number;
  /** Scores per pillar 0–100 */
  pillars: {
    sleep:      number;
    nutrition:  number;
    supplements: number;
    symptoms:   number;
  };
  /** Trend vs 7-day average: 'up' | 'down' | 'steady' */
  trend: 'up' | 'down' | 'steady';
  /** 7-day average score */
  weekAvg: number;
  /** Label for the score */
  label: string;
  /** Color for the score */
  color: string;
}

function scoreLabel(n: number): string {
  if (n >= 85) return 'thriving';
  if (n >= 70) return 'strong';
  if (n >= 55) return 'steady';
  if (n >= 40) return 'building';
  return 'rest up';
}

function scoreColor(n: number): string {
  if (n >= 85) return '#6A9E72'; // sage
  if (n >= 70) return '#4A9B9B'; // teal
  if (n >= 55) return '#B8934A'; // gold
  if (n >= 40) return '#C4645A'; // rose
  return '#A89BB0';               // mist
}

export function useVelaScore({
  phase,
  totals,
  foods,
  checkedSupps,
  mySupps,
  symptoms,
  sleepHistory,
  history,
}: {
  phase:        PhaseKey | null;
  totals:       NutrientTotals;
  foods:        any[];
  checkedSupps: string[];
  mySupps:      string[];
  symptoms:     string[];
  sleepHistory: SleepEntry[];
  history:      DailyEntry[];
}): VelaScore {
  return useMemo(() => {
    const pd = PHASES[phase ?? 'late'];

    // ── Pillar 1: Sleep (0–100) ──────────────────────────────────────────────
    // Use last night's logged quality (1–5 scale → 0–100)
    const lastSleep = sleepHistory[0] ?? null;
    const sleepScore = lastSleep?.quality != null
      ? Math.round((lastSleep.quality / 5) * 100)
      : 50; // neutral if not logged yet

    // ── Pillar 2: Nutrition (0–100) ──────────────────────────────────────────
    // Average % of 4 key targets hit today
    const pct = (v: number, m: number) => Math.min(100, m > 0 ? Math.round((v / m) * 100) : 0);
    const nutritionScore = foods.length === 0 ? 50 : Math.round((
      pct(totals.protein,   pd.targets.protein) +
      pct(totals.fiber,     pd.targets.fiber) +
      pct(totals.calcium,   pd.targets.calcium) +
      pct(totals.omega3,    pd.targets.omega3)
    ) / 4);

    // ── Pillar 3: Supplements (0–100) ────────────────────────────────────────
    const suppScore = mySupps.length === 0 ? 50
      : Math.round((checkedSupps.length / mySupps.length) * 100);

    // ── Pillar 4: Symptom load (0–100, inverted) ─────────────────────────────
    // 0 symptoms = 100, 10+ symptoms = 0
    const symptomScore = Math.max(0, Math.round(100 - (symptoms.length / 10) * 100));

    // ── Composite (weighted) ─────────────────────────────────────────────────
    const today = Math.round(
      sleepScore       * 0.30 +
      nutritionScore   * 0.30 +
      suppScore        * 0.20 +
      symptomScore     * 0.20
    );

    // ── 7-day average from history ───────────────────────────────────────────
    const recent7 = history.slice(0, 7);
    let weekAvg = 0;
    if (recent7.length > 0) {
      const sum = recent7.reduce((acc, e) => {
        const n = Math.round(
          Math.min(100, e.foods.length === 0 ? 50 : Math.round((
            pct(e.totals.protein,   pd.targets.protein) +
            pct(e.totals.fiber,     pd.targets.fiber) +
            pct(e.totals.calcium,   pd.targets.calcium) +
            pct(e.totals.omega3,    pd.targets.omega3)
          ) / 4)) * 0.30 +
          Math.max(0, Math.round(100 - ((e.symptoms?.length ?? 0) / 10) * 100)) * 0.20 +
          Math.round(((e.checkedSupps?.length ?? 0) / Math.max(1, mySupps.length)) * 100) * 0.20 +
          50 * 0.30 // sleep not in daily history, neutral
        );
        return acc + n;
      }, 0);
      weekAvg = Math.round(sum / recent7.length);
    }

    const diff = today - weekAvg;
    const trend: 'up' | 'down' | 'steady' =
      diff > 5 ? 'up' : diff < -5 ? 'down' : 'steady';

    return {
      today,
      pillars: { sleep: sleepScore, nutrition: nutritionScore, supplements: suppScore, symptoms: symptomScore },
      trend,
      weekAvg,
      label: scoreLabel(today),
      color: scoreColor(today),
    };
  }, [phase, totals, foods, checkedSupps, mySupps, symptoms, sleepHistory, history]);
}
