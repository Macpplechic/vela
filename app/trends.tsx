/**
 * app/trends.tsx
 * 90-Day Trends Screen
 * Navigate: router.push('/trends')
 *
 * Charts (using react-native-svg already installed):
 *  1. Symptom frequency — bar chart, last 30/60/90 days
 *  2. Sleep quality curve — line chart, last 30 days
 *  3. Nutrition adherence — protein, calcium, fiber bars
 *  4. Supplement adherence trend — weekly %
 *  5. Hot flash frequency over time
 */

import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Rect, Line, Circle, Path, Text as SvgText, G } from 'react-native-svg';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';
import { PHASES } from '../constants/Data';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 64; // padding 20 each side + card padding
const CHART_H = 140;
const BAR_CHART_H = 160;

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color,
  maxVal,
  labelEvery = 7,
}: {
  data: { label: string; value: number }[];
  color: string;
  maxVal: number;
  labelEvery?: number;
}) {
  if (data.length === 0) return null;
  const barW = Math.max(2, (CHART_W / data.length) - 2);
  const gap  = CHART_W / data.length;

  return (
    <Svg width={CHART_W} height={BAR_CHART_H + 20}>
      {data.map((d, i) => {
        const barH = maxVal > 0 ? Math.round((d.value / maxVal) * BAR_CHART_H) : 0;
        const x = i * gap + (gap - barW) / 2;
        const y = BAR_CHART_H - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={Math.max(barH, 1)} fill={color} rx={2} opacity={barH > 0 ? 1 : 0.15} />
            {i % labelEvery === 0 && (
              <SvgText x={x + barW / 2} y={BAR_CHART_H + 14} fontSize={8} fill={Colors.mist} textAnchor="middle">
                {d.label}
              </SvgText>
            )}
          </G>
        );
      })}
      {/* Baseline */}
      <Line x1={0} y1={BAR_CHART_H} x2={CHART_W} y2={BAR_CHART_H} stroke={Colors.parchmentDark} strokeWidth={0.5} />
    </Svg>
  );
}

// ── Line chart ─────────────────────────────────────────────────────────────────

function LineChart({
  data,
  color,
  maxVal,
  minVal = 0,
  labelEvery = 7,
  showDots = true,
}: {
  data: { label: string; value: number | null }[];
  color: string;
  maxVal: number;
  minVal?: number;
  labelEvery?: number;
  showDots?: boolean;
}) {
  if (data.length === 0) return null;
  const range  = maxVal - minVal || 1;
  const xStep  = CHART_W / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: i * xStep,
    y: d.value !== null ? CHART_H - ((d.value - minVal) / range) * CHART_H : null,
    value: d.value,
    label: d.label,
  }));

  // Build SVG path connecting non-null points
  let pathD = '';
  let inPath = false;
  for (const p of points) {
    if (p.y === null) { inPath = false; continue; }
    if (!inPath) { pathD += `M ${p.x} ${p.y} `; inPath = true; }
    else          { pathD += `L ${p.x} ${p.y} `; }
  }

  return (
    <Svg width={CHART_W} height={CHART_H + 20}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = CHART_H * (1 - t);
        return <Line key={t} x1={0} y1={y} x2={CHART_W} y2={y} stroke={Colors.parchmentDark} strokeWidth={0.5} />;
      })}
      {/* Line */}
      {pathD && <Path d={pathD} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {/* Dots */}
      {showDots && points.filter(p => p.y !== null).map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y!} r={3} fill={color} />
      ))}
      {/* Labels */}
      {points.map((p, i) => i % labelEvery === 0 && (
        <SvgText key={i} x={p.x} y={CHART_H + 14} fontSize={8} fill={Colors.mist} textAnchor="middle">
          {p.label}
        </SvgText>
      ))}
      {/* Baseline */}
      <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={Colors.parchmentDark} strokeWidth={0.5} />
    </Svg>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontFamily: Fonts.serif, fontSize: 17, color: Colors.plum }}>{title}</Text>
      <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

// ── Range selector ─────────────────────────────────────────────────────────────

function RangeSelector({ value, onChange }: { value: 30 | 60 | 90; onChange: (v: 30 | 60 | 90) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: Colors.parchmentDark, borderRadius: 20, padding: 3, alignSelf: 'flex-start', marginBottom: 14 }}>
      {([30, 60, 90] as const).map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}
          style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 18,
            backgroundColor: value === n ? Colors.plum : 'transparent' }}>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12,
            color: value === n ? Colors.parchment : Colors.mist }}>{n}d</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function TrendsScreen() {
  const { history, sleepHistory, mySupps, phase } = useVelaStore();
  const [range, setRange] = useState<30 | 60 | 90>(30);
  const pd = PHASES[phase ?? 'late'];

  // ── Symptom frequency data ────────────────────────────────────────────────
  const symptomData = useMemo(() => {
    const cutoff = daysAgoStr(range);
    const recent = history.filter(h => h.date >= cutoff);
    const counts: Record<string, number> = {};
    recent.forEach(h => (h.symptoms ?? []).forEach((s: string) => { counts[s] = (counts[s] ?? 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([symptom, count]) => ({ symptom, count, pct: Math.round((count / range) * 100) }));
  }, [history, range]);

  // ── Daily symptom load (bar chart) ───────────────────────────────────────
  const dailySymptomLoad = useMemo(() => {
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const dateStr = daysAgoStr(i);
      const entry = history.find(h => h.date === dateStr);
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push({
        label: d.getDate() % 7 === 1 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        value: entry?.symptoms?.length ?? 0,
      });
    }
    return days;
  }, [history, range]);

  const maxSymptomLoad = useMemo(() =>
    Math.max(1, ...dailySymptomLoad.map(d => d.value)),
  [dailySymptomLoad]);

  // ── Sleep quality curve ───────────────────────────────────────────────────
  const sleepData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const dateStr = daysAgoStr(i);
      const entry = sleepHistory.find((s: any) => s.date === dateStr);
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push({
        label: d.getDate() % 7 === 1 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        value: entry?.quality ?? null,
      });
    }
    return days;
  }, [sleepHistory]);

  const avgSleepRecent = useMemo(() => {
    const logged = sleepData.filter(d => d.value !== null);
    if (logged.length === 0) return null;
    return Math.round((logged.reduce((a, d) => a + (d.value ?? 0), 0) / logged.length) * 10) / 10;
  }, [sleepData]);

  // ── Nutrition adherence ───────────────────────────────────────────────────
  const nutritionData = useMemo(() => {
    const cutoff = daysAgoStr(range);
    const recent = history.filter(h => h.date >= cutoff && h.foods?.length > 0);
    if (recent.length === 0) return null;
    const avg = (key: keyof typeof recent[0]['totals']) =>
      Math.round(recent.reduce((a, h) => a + (h.totals?.[key] ?? 0), 0) / recent.length);
    return {
      protein:   { avg: avg('protein'),   target: pd.targets.protein,   label: 'Protein' },
      calcium:   { avg: avg('calcium'),   target: 1200,                  label: 'Calcium' },
      fiber:     { avg: avg('fiber'),     target: pd.targets.fiber,      label: 'Fiber' },
      omega3:    { avg: avg('omega3'),    target: pd.targets.omega3,     label: 'Omega-3' },
      daysLogged: recent.length,
    };
  }, [history, range, pd]);

  // ── Weekly supplement adherence ───────────────────────────────────────────
  const suppWeekly = useMemo(() => {
    if (mySupps.length === 0) return [];
    const weeks = [];
    for (let w = Math.min(11, Math.floor(range / 7)) - 1; w >= 0; w--) {
      const weekDays: string[] = [];
      for (let d = 6; d >= 0; d--) {
        const offset = w * 7 + d;
        if (offset >= range) continue;
        weekDays.push(daysAgoStr(offset));
      }
      const entries = history.filter(h => weekDays.includes(h.date));
      const totalPossible = weekDays.length * mySupps.length;
      const totalChecked = entries.reduce((a, h) => a + (h.checkedSupps?.length ?? 0), 0);
      const pct = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      weeks.push({ label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: pct });
    }
    return weeks.reverse();
  }, [history, mySupps, range]);

  // ── Hot flash trend ───────────────────────────────────────────────────────
  const hotFlashData = useMemo(() => {
    const weeks = [];
    for (let w = Math.min(11, Math.floor(range / 7)) - 1; w >= 0; w--) {
      let count = 0;
      for (let d = 6; d >= 0; d--) {
        const offset = w * 7 + d;
        if (offset >= range) continue;
        const dateStr = daysAgoStr(offset);
        const entry = history.find(h => h.date === dateStr);
        if (entry?.symptoms?.includes('Hot flash')) count++;
      }
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      weeks.push({ label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: count });
    }
    return weeks.reverse();
  }, [history, range]);

  const maxHotFlash = useMemo(() => Math.max(1, ...hotFlashData.map(d => d.value)), [hotFlashData]);
  const hasData = history.length >= 3;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Trends</Text>
          <Text style={styles.titleSub}>Your patterns over time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {!hasData && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 36 }]}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
            <Text style={styles.emptyTitle}>Not enough data yet</Text>
            <Text style={styles.emptySub}>Log at least 3 days in your Ritual and FluxLog tabs to see trends appear here.</Text>
          </View>
        )}

        {hasData && (
          <>
            <RangeSelector value={range} onChange={setRange} />

            {/* ── Daily symptom load ── */}
            <View style={styles.card}>
              <SectionHeader
                title="Daily symptom load"
                sub={`Symptoms logged per day · last ${range} days`}
              />
              <BarChart data={dailySymptomLoad} color={Colors.rose} maxVal={maxSymptomLoad} labelEvery={Math.ceil(range / 6)} />
              {symptomData.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subLabel}>Top symptoms this period</Text>
                  {symptomData.map(({ symptom, count, pct }) => (
                    <View key={symptom} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum }}>{symptom}</Text>
                        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist }}>{count}d · {pct}%</Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: Colors.parchmentDark, borderRadius: 2 }}>
                        <View style={{ height: 4, width: `${pct}%` as any, backgroundColor: Colors.rose, borderRadius: 2 }} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Hot flash trend ── */}
            {hotFlashData.some(d => d.value > 0) && (
              <View style={styles.card}>
                <SectionHeader
                  title="Hot flash frequency"
                  sub="Days per week with hot flashes"
                />
                <BarChart data={hotFlashData} color={Colors.rose + 'CC'} maxVal={maxHotFlash} labelEvery={1} />
                {(() => {
                  const firstHalf = hotFlashData.slice(0, Math.floor(hotFlashData.length / 2));
                  const secondHalf = hotFlashData.slice(Math.floor(hotFlashData.length / 2));
                  const avgFirst  = firstHalf.reduce((a, d) => a + d.value, 0) / (firstHalf.length || 1);
                  const avgSecond = secondHalf.reduce((a, d) => a + d.value, 0) / (secondHalf.length || 1);
                  const delta = avgSecond - avgFirst;
                  if (Math.abs(delta) < 0.5) return null;
                  return (
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: delta < 0 ? Colors.sage : Colors.rose, marginTop: 10 }}>
                      {delta < 0
                        ? `↓ Hot flashes down ${Math.round(Math.abs(delta) * 10) / 10} days/week vs earlier in this period`
                        : `↑ Hot flashes up ${Math.round(delta * 10) / 10} days/week vs earlier in this period`}
                    </Text>
                  );
                })()}
              </View>
            )}

            {/* ── Sleep curve ── */}
            <View style={styles.card}>
              <SectionHeader
                title="Sleep quality"
                sub="1 = restless · 5 = blissful · last 30 days"
              />
              <LineChart data={sleepData} color={Colors.teal} maxVal={5} minVal={1} labelEvery={7} />
              {avgSleepRecent !== null && (
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
                  <View>
                    <Text style={styles.statNum}>{avgSleepRecent}/5</Text>
                    <Text style={styles.statLabel}>30-day average</Text>
                  </View>
                  <View>
                    <Text style={[styles.statNum, {
                      color: avgSleepRecent >= 4 ? Colors.sage : avgSleepRecent >= 3 ? Colors.teal : avgSleepRecent >= 2 ? Colors.gold : Colors.rose,
                    }]}>
                      {avgSleepRecent >= 4 ? 'great' : avgSleepRecent >= 3 ? 'decent' : avgSleepRecent >= 2 ? 'light' : 'poor'}
                    </Text>
                    <Text style={styles.statLabel}>overall rating</Text>
                  </View>
                </View>
              )}
              {sleepData.every(d => d.value === null) && (
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 8 }}>
                  Log sleep quality in your morning ritual to see your curve here.
                </Text>
              )}
            </View>

            {/* ── Nutrition adherence ── */}
            {nutritionData ? (
              <View style={styles.card}>
                <SectionHeader
                  title="Nutrition targets"
                  sub={`${range}-day averages vs your phase targets · ${nutritionData.daysLogged} days logged`}
                />
                {[nutritionData.protein, nutritionData.calcium, nutritionData.fiber, nutritionData.omega3].map(n => {
                  const pct = Math.min(100, Math.round((n.avg / n.target) * 100));
                  const color = pct >= 90 ? Colors.sage : pct >= 65 ? Colors.teal : pct >= 40 ? Colors.gold : Colors.rose;
                  return (
                    <View key={n.label} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum }}>{n.label}</Text>
                        <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color }}>
                          {n.avg} / {n.target} · {pct}%
                        </Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: Colors.parchmentDark, borderRadius: 3 }}>
                        <View style={{ height: 6, width: `${pct}%` as any, backgroundColor: color, borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, textAlign: 'center' }}>
                  Log food in Peri Plate to see your nutrition trends here.
                </Text>
              </View>
            )}

            {/* ── Supplement adherence ── */}
            {suppWeekly.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Supplement adherence"
                  sub="% of supplements taken each week"
                />
                <BarChart data={suppWeekly} color={Colors.sage} maxVal={100} labelEvery={1} />
                {(() => {
                  const avg = Math.round(suppWeekly.reduce((a, d) => a + d.value, 0) / suppWeekly.length);
                  return (
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 10 }}>
                      {avg}% average adherence · {avg >= 80 ? 'Excellent consistency ✦' : avg >= 60 ? 'Good — push toward 80%' : 'Try to take them at the same time each day'}
                    </Text>
                  );
                })()}
              </View>
            )}

            {/* ── Summary insight ── */}
            {symptomData.length > 0 && (
              <View style={[styles.card, { backgroundColor: Colors.plum }]}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  {range}-day insight
                </Text>
                <Text style={{ fontFamily: Fonts.serif, fontSize: 16, color: Colors.parchment, lineHeight: 24, marginBottom: 8 }}>
                  {symptomData[0]?.symptom ?? 'Your symptoms'} {symptomData[0] ? `appeared on ${symptomData[0].pct}% of days` : 'are being tracked'} — your most frequent symptom this period.
                </Text>
                {avgSleepRecent !== null && avgSleepRecent < 3 && (
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(245,239,230,0.7)', lineHeight: 18 }}>
                    Your sleep quality averaged {avgSleepRecent}/5. Poor sleep amplifies every perimenopause symptom — this is worth prioritising.
                  </Text>
                )}
                {nutritionData && nutritionData.protein.avg < nutritionData.protein.target * 0.7 && (
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(245,239,230,0.7)', lineHeight: 18, marginTop: 6 }}>
                    Protein averaged {nutritionData.protein.avg}g vs a target of {nutritionData.protein.target}g. Low protein worsens brain fog, fatigue, and muscle loss in perimenopause.
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.parchment },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum },
  back:       { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:      { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  card:       { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 18, marginBottom: 14 },
  subLabel:   { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  statNum:    { fontFamily: Fonts.serif, fontSize: 26, color: Colors.plum },
  statLabel:  { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 2 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.plum, marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, textAlign: 'center', lineHeight: 20 },
});
