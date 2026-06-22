/**
 * app/bone.tsx
 * Bone Health Tracker
 * Navigate: router.push('/bone')
 *
 * Features:
 *  - Bone health score (0–100) from calcium, D3, exercise, and lifestyle factors
 *  - Pulls calcium from Peri Plate history automatically
 *  - Tracks D3 supplement adherence from ritual
 *  - Manual exercise and lifestyle inputs
 *  - DEXA scan reminder
 *  - Evidence-based recommendations
 */

import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';

// ── Storage ────────────────────────────────────────────────────────────────────

const KEY_BONE = '@vela_bone_prefs';

interface BonePrefs {
  smokingStatus: boolean;      // true = smoker
  alcoholHeavy: boolean;       // true = >7 drinks/week
  weightBearing: boolean;      // doing weight-bearing exercise
  lastDEXA: string | null;     // YYYY-MM-DD
  dexaReminder: boolean;
}

const DEFAULT_PREFS: BonePrefs = {
  smokingStatus: false,
  alcoholHeavy: false,
  weightBearing: false,
  lastDEXA: null,
  dexaReminder: true,
};

// ── Score calculation ──────────────────────────────────────────────────────────

function calcBoneScore({
  avgCalcium,
  d3Adherence,
  weightBearing,
  smoking,
  alcoholHeavy,
}: {
  avgCalcium: number;
  d3Adherence: number;
  weightBearing: boolean;
  smoking: boolean;
  alcoholHeavy: boolean;
}): { score: number; pillars: Record<string, number> } {
  // Calcium pillar (0–30): target 1200mg
  const calciumScore = Math.round(Math.min(30, (avgCalcium / 1200) * 30));

  // D3 pillar (0–25): adherence %
  const d3Score = Math.round((d3Adherence / 100) * 25);

  // Exercise pillar (0–25)
  const exerciseScore = weightBearing ? 25 : 5;

  // Lifestyle pillar (0–20): subtract for risks
  let lifestyleScore = 20;
  if (smoking) lifestyleScore -= 10;
  if (alcoholHeavy) lifestyleScore -= 8;
  lifestyleScore = Math.max(0, lifestyleScore);

  const score = calciumScore + d3Score + exerciseScore + lifestyleScore;
  return {
    score: Math.min(100, score),
    pillars: { calcium: calciumScore, d3: d3Score, exercise: exerciseScore, lifestyle: lifestyleScore },
  };
}

function scoreLabel(n: number): string {
  if (n >= 80) return 'strong';
  if (n >= 60) return 'building';
  if (n >= 40) return 'at risk';
  return 'needs attention';
}

function scoreColor(n: number): string {
  if (n >= 80) return Colors.sage;
  if (n >= 60) return Colors.teal;
  if (n >= 40) return Colors.gold;
  return Colors.rose;
}

// ── Pillar bar ─────────────────────────────────────────────────────────────────

function PillarBar({ label, value, max, icon }: { label: string; value: number; max: number; icon: string }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? Colors.sage : pct >= 50 ? Colors.teal : pct >= 30 ? Colors.gold : Colors.rose;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum }}>{icon}  {label}</Text>
        <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color }}>{value}/{max}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: Colors.parchmentDark, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${pct}%` as any, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function BoneScreen() {
  const { history, mySupps, sleepHistory } = useVelaStore();
  const [prefs, setPrefs] = useState<BonePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(KEY_BONE).then(raw => {
      if (raw) setPrefs(JSON.parse(raw));
    });
  }, []);

  const savePrefs = async (updated: BonePrefs) => {
    setPrefs(updated);
    await AsyncStorage.setItem(KEY_BONE, JSON.stringify(updated));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Average calcium over last 30 logged days
  const avgCalcium = useMemo(() => {
    const recent = history.filter(h => h.foods?.length > 0).slice(0, 30);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((a, h) => a + (h.totals?.calcium ?? 0), 0) / recent.length);
  }, [history]);

  // D3 adherence — check if user has D3/VitaminD in their supplement stack
  const d3InStack = useMemo(() =>
    mySupps.some(id => id.toLowerCase().includes('d3') || id.toLowerCase().includes('vitamin_d') || id === 'vit_d'),
  [mySupps]);

  // Estimate D3 adherence from history supplement checks
  const d3Adherence = useMemo(() => {
    const recent = history.slice(0, 30);
    if (recent.length === 0 || !d3InStack) return d3InStack ? 50 : 0;
    const checked = recent.filter(h =>
      (h.checkedSupps ?? []).some((id: string) => id.toLowerCase().includes('d3') || id.toLowerCase().includes('vitamin'))
    ).length;
    return recent.length > 0 ? Math.round((checked / recent.length) * 100) : 0;
  }, [history, d3InStack]);

  const { score, pillars } = useMemo(() => calcBoneScore({
    avgCalcium,
    d3Adherence,
    weightBearing: prefs.weightBearing,
    smoking: prefs.smokingStatus,
    alcoholHeavy: prefs.alcoholHeavy,
  }), [avgCalcium, d3Adherence, prefs]);

  const color  = scoreColor(score);
  const label  = scoreLabel(score);

  // Days since last DEXA
  const daysSinceDEXA = prefs.lastDEXA
    ? Math.floor((Date.now() - new Date(prefs.lastDEXA).getTime()) / 86400000)
    : null;
  const dexaOverdue = daysSinceDEXA !== null && daysSinceDEXA > 730; // >2 years
  const dexaDue = daysSinceDEXA === null || dexaOverdue;

  // Personalized recommendations
  const recs = useMemo(() => {
    const list: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];
    if (avgCalcium < 800)
      list.push({ icon: '🥛', text: `Your Peri Plate calcium averages ${avgCalcium}mg/day — target is 1,200mg. Add dairy, fortified plant milk, sardines, or leafy greens.`, priority: 'high' });
    else if (avgCalcium < 1000)
      list.push({ icon: '🥛', text: `Calcium at ${avgCalcium}mg/day — you're close. A small boost (yogurt, fortified milk) gets you to the 1,200mg target.`, priority: 'medium' });
    if (!d3InStack)
      list.push({ icon: '☀️', text: 'Vitamin D3 is not in your supplement stack. Add D3 2000 IU + K2 100mcg — this combination is the most evidence-backed for bone density in perimenopause.', priority: 'high' });
    else if (d3Adherence < 60)
      list.push({ icon: '☀️', text: `Your D3 adherence is ${d3Adherence}%. Consistency matters for bone — pair it with your morning coffee so you don't forget.`, priority: 'medium' });
    if (!prefs.weightBearing)
      list.push({ icon: '🏋️', text: 'Weight-bearing exercise directly stimulates bone formation. 30 min of walking, strength training, or yoga 4–5x/week is the evidence-based target.', priority: 'high' });
    if (prefs.smokingStatus)
      list.push({ icon: '🚭', text: 'Smoking accelerates bone loss significantly. This is the single highest-impact change you can make for bone health.', priority: 'high' });
    if (prefs.alcoholHeavy)
      list.push({ icon: '🍷', text: 'More than 7 drinks per week is associated with 38% higher fracture risk. Reducing to 3–4/week has measurable bone benefit.', priority: 'high' });
    if (dexaDue)
      list.push({ icon: '🏥', text: `${daysSinceDEXA === null ? 'No DEXA scan recorded.' : `It's been ${Math.round((daysSinceDEXA ?? 0) / 365)} years since your last DEXA.`} A bone density scan every 1–2 years is recommended in perimenopause.`, priority: dexaOverdue ? 'high' : 'medium' });
    if (list.length === 0)
      list.push({ icon: '✦', text: 'Your bone health profile looks strong. Keep up the calcium, D3, and weight-bearing exercise to maintain it.', priority: 'low' });
    return list;
  }, [avgCalcium, d3InStack, d3Adherence, prefs, dexaDue, dexaOverdue, daysSinceDEXA]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bone Health</Text>
          <Text style={styles.titleSub}>Protect your density through perimenopause</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Score ring */}
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            Bone health score
          </Text>
          <View style={[styles.ring, { borderColor: color }]}>
            <Text style={[styles.ringNum, { color }]}>{score}</Text>
            <Text style={[styles.ringLabel, { color }]}>{label}</Text>
          </View>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 14, textAlign: 'center', lineHeight: 18 }}>
            Based on your Peri Plate calcium, D3 adherence,{'\n'}exercise, and lifestyle factors
          </Text>
        </View>

        {/* Pillar breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Score breakdown</Text>
          <PillarBar label="Calcium intake"    icon="🥛" value={pillars.calcium}   max={30} />
          <PillarBar label="Vitamin D3"        icon="☀️" value={pillars.d3}        max={25} />
          <PillarBar label="Weight-bearing exercise" icon="🏋️" value={pillars.exercise} max={25} />
          <PillarBar label="Lifestyle factors" icon="🌿" value={pillars.lifestyle} max={20} />
        </View>

        {/* Calcium from Peri Plate */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Calcium from Peri Plate</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.serif, fontSize: 32, color: avgCalcium >= 1000 ? Colors.sage : avgCalcium >= 700 ? Colors.gold : Colors.rose }}>
                {avgCalcium > 0 ? `${avgCalcium}mg` : '—'}
              </Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist }}>30-day average</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.plum }}>Target: 1,200mg</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 2 }}>
                {avgCalcium > 0 ? `${Math.round((avgCalcium / 1200) * 100)}% of target` : 'Log food to see'}
              </Text>
            </View>
          </View>
          {avgCalcium === 0 && (
            <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 10 }}>
              Log food in Peri Plate and your calcium will appear here automatically.
            </Text>
          )}
        </View>

        {/* Lifestyle inputs */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Lifestyle factors</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Weight-bearing exercise</Text>
              <Text style={styles.toggleSub}>Walking, strength training, yoga 4+x/week</Text>
            </View>
            <Switch
              value={prefs.weightBearing}
              onValueChange={v => savePrefs({ ...prefs, weightBearing: v })}
              trackColor={{ false: Colors.parchmentDark, true: Colors.sage }}
              thumbColor={Colors.cream}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Current smoker</Text>
              <Text style={styles.toggleSub}>Smoking accelerates bone loss significantly</Text>
            </View>
            <Switch
              value={prefs.smokingStatus}
              onValueChange={v => savePrefs({ ...prefs, smokingStatus: v })}
              trackColor={{ false: Colors.parchmentDark, true: Colors.rose }}
              thumbColor={Colors.cream}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Heavy alcohol use</Text>
              <Text style={styles.toggleSub}>More than 7 drinks per week</Text>
            </View>
            <Switch
              value={prefs.alcoholHeavy}
              onValueChange={v => savePrefs({ ...prefs, alcoholHeavy: v })}
              trackColor={{ false: Colors.parchmentDark, true: Colors.rose }}
              thumbColor={Colors.cream}
            />
          </View>
        </View>

        {/* DEXA tracker */}
        <View style={[styles.card, dexaDue && { borderColor: Colors.gold, borderWidth: 1 }]}>
          <Text style={styles.sectionLabel}>DEXA scan (bone density test)</Text>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.plum, lineHeight: 20, marginBottom: 12 }}>
            {daysSinceDEXA === null
              ? 'No DEXA scan recorded. A bone density scan is recommended every 1–2 years in perimenopause.'
              : dexaOverdue
              ? `Your last DEXA was ${Math.round(daysSinceDEXA / 365)} years ago — consider scheduling one soon.`
              : `Last DEXA: ${prefs.lastDEXA ? new Date(prefs.lastDEXA + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}. Looks current.`
            }
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.dexaBtn} onPress={() => {
              const today = new Date().toISOString().split('T')[0];
              Alert.alert('Record DEXA scan', 'Mark today as your most recent DEXA scan date?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, record it', onPress: () => savePrefs({ ...prefs, lastDEXA: today }) },
              ]);
            }}>
              <Text style={styles.dexaBtnText}>Record scan date</Text>
            </TouchableOpacity>
            {prefs.lastDEXA && (
              <TouchableOpacity style={[styles.dexaBtn, { backgroundColor: 'transparent' }]}
                onPress={() => savePrefs({ ...prefs, lastDEXA: null })}>
                <Text style={[styles.dexaBtnText, { color: Colors.mist }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recommendations */}
        <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Your recommendations</Text>
        {recs.map((rec, i) => (
          <View key={i} style={[styles.recCard, {
            borderLeftColor: rec.priority === 'high' ? Colors.rose : rec.priority === 'medium' ? Colors.gold : Colors.sage,
          }]}>
            <Text style={{ fontSize: 20, marginBottom: 6 }}>{rec.icon}</Text>
            <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.plum, lineHeight: 20 }}>{rec.text}</Text>
          </View>
        ))}

        {/* Science note */}
        <View style={[styles.card, { backgroundColor: Colors.sagePale, borderColor: Colors.sage + '40', marginTop: 8 }]}>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.sage, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            The science
          </Text>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, lineHeight: 19 }}>
            Estrogen normally inhibits bone resorption. As it declines in perimenopause, bone loss accelerates — women can lose 3–5% of bone mass per year in early menopause without intervention.{'\n\n'}
            Calcium + D3 + K2 + weight-bearing exercise is the evidence-based combination. Sources: The Menopause Society, NIH Office of Dietary Supplements, AACE Menopause Guidelines 2022.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.parchment },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum },
  back:        { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:       { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:    { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  card:        { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 18, marginBottom: 12 },
  sectionLabel:{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  ring:        { width: 120, height: 120, borderRadius: 60, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  ringNum:     { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 48 },
  ringLabel:   { fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark, gap: 12 },
  toggleLabel: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.plum, marginBottom: 2 },
  toggleSub:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist },
  dexaBtn:     { backgroundColor: Colors.plum, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  dexaBtnText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.parchment },
  recCard:     { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderLeftWidth: 3, borderRadius: 0, borderTopRightRadius: 14, borderBottomRightRadius: 14, padding: 14, marginBottom: 10 },
});
