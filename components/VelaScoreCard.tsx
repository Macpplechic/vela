/**
 * VelaScoreCard.tsx
 * Shows the Vela Score (0–100) with pillar breakdown and a 3-tap morning check-in.
 * Place this near the top of the Ritual tab ScrollView.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';
import { VelaScore } from '../hooks/useVelaScore';

// ── Trend arrow ───────────────────────────────────────────────────────────────
function TrendArrow({ trend, weekAvg }: { trend: 'up'|'down'|'steady'; weekAvg: number }) {
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const color  = trend === 'up' ? Colors.sage : trend === 'down' ? Colors.rose : Colors.gold;
  return (
    <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color }}>
      {arrow} {trend === 'steady' ? 'steady' : `${trend} from ${weekAvg} avg`}
    </Text>
  );
}

// ── Pillar bar ────────────────────────────────────────────────────────────────
function PillarBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const color = value >= 75 ? Colors.sage : value >= 50 ? Colors.teal : value >= 30 ? Colors.gold : Colors.rose;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={pBar.label}>{icon}  {label}</Text>
        <Text style={[pBar.value, { color }]}>{value}</Text>
      </View>
      <View style={pBar.track}>
        <View style={[pBar.fill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const pBar = StyleSheet.create({
  label: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist },
  value: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  track: { height: 4, backgroundColor: Colors.parchmentDark, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: 4, borderRadius: 2 },
});

// ── Check-in row ──────────────────────────────────────────────────────────────
type CheckInProps = {
  label: string;
  options: { emoji: string; label: string; value: number }[];
  selected: number | null;
  onSelect: (v: number) => void;
};

function CheckInRow({ label, options, selected, onSelect }: CheckInProps) {
  return (
    <View style={ci.row}>
      <Text style={ci.label}>{label}</Text>
      <View style={ci.options}>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            activeOpacity={0.7}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(o.value); }}
            style={[ci.chip, selected === o.value && ci.chipSelected]}
          >
            <Text style={ci.chipEmoji}>{o.emoji}</Text>
            <Text style={[ci.chipText, selected === o.value && ci.chipTextSelected]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const ci = StyleSheet.create({
  row:             { marginBottom: 10 },
  label:           { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.mist, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  options:         { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 0.5, borderColor: Colors.parchmentDark, backgroundColor: Colors.parchment },
  chipSelected:    { backgroundColor: Colors.plum, borderColor: Colors.plum },
  chipEmoji:       { fontSize: 14 },
  chipText:        { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist },
  chipTextSelected:{ color: Colors.parchment },
});

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  score: VelaScore;
  /** Called when user completes the morning check-in */
  onCheckInComplete?: (data: { mood: number; energy: number; sleep: number }) => void;
  /** Whether to show morning check-in (show in morning session) */
  showCheckIn?: boolean;
};

const MOOD_OPTIONS    = [
  { emoji: '😔', label: 'low',     value: 1 },
  { emoji: '😐', label: 'okay',    value: 2 },
  { emoji: '🙂', label: 'good',    value: 3 },
  { emoji: '😄', label: 'great',   value: 4 },
];
const ENERGY_OPTIONS  = [
  { emoji: '🪫', label: 'drained', value: 1 },
  { emoji: '😴', label: 'tired',   value: 2 },
  { emoji: '⚡', label: 'steady',  value: 3 },
  { emoji: '🔥', label: 'energised', value: 4 },
];
const SLEEP_OPTIONS   = [
  { emoji: '🌑', label: 'restless', value: 1 },
  { emoji: '🌓', label: 'light',    value: 2 },
  { emoji: '🌕', label: 'solid',    value: 3 },
  { emoji: '✨', label: 'deep',     value: 4 },
];

export default function VelaScoreCard({ score, onCheckInComplete, showCheckIn = false }: Props) {
  const [expanded, setExpanded]     = useState(false);
  const [mood, setMood]             = useState<number | null>(null);
  const [energy, setEnergy]         = useState<number | null>(null);
  const [sleepTap, setSleepTap]     = useState<number | null>(null);
  const [checkInDone, setCheckInDone] = useState(false);

  const allSelected = mood !== null && energy !== null && sleepTap !== null;

  const handleSave = () => {
    if (!allSelected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCheckInComplete?.({ mood: mood!, energy: energy!, sleep: sleepTap! });
    setCheckInDone(true);
  };

  return (
    <View style={styles.card}>
      {/* ── Score header ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(e => !e)}
        style={styles.header}
      >
        <View>
          <Text style={styles.scoreLabel}>Vela score</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={[styles.scoreNum, { color: score.color }]}>{score.today}</Text>
            <Text style={[styles.scoreBadge, { color: score.color }]}>{score.label}</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            <TrendArrow trend={score.trend} weekAvg={score.weekAvg} />
          </View>
        </View>
        {/* Circular score ring */}
        <View style={[styles.ring, { borderColor: score.color }]}>
          <Text style={[styles.ringNum, { color: score.color }]}>{score.today}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Pillar breakdown (expandable) ── */}
      {expanded && (
        <View style={styles.pillars}>
          <View style={styles.divider} />
          <PillarBar label="Sleep quality"     icon="🌙" value={score.pillars.sleep} />
          <PillarBar label="Nutrition"         icon="🥗" value={score.pillars.nutrition} />
          <PillarBar label="Supplements"       icon="💊" value={score.pillars.supplements} />
          <PillarBar label="Symptom load"      icon="◎"  value={score.pillars.symptoms} />
          <Text style={styles.pillarNote}>Tap the card to hide details</Text>
        </View>
      )}

      {/* ── Morning check-in ── */}
      {showCheckIn && !checkInDone && (
        <View>
          <View style={styles.divider} />
          <Text style={styles.checkInTitle}>Morning check-in  ·  3 taps</Text>
          <CheckInRow label="Mood"    options={MOOD_OPTIONS}   selected={mood}     onSelect={setMood} />
          <CheckInRow label="Energy"  options={ENERGY_OPTIONS} selected={energy}   onSelect={setEnergy} />
          <CheckInRow label="Sleep"   options={SLEEP_OPTIONS}  selected={sleepTap} onSelect={setSleepTap} />
          <TouchableOpacity
            style={[styles.saveBtn, !allSelected && styles.saveBtnDisabled]}
            activeOpacity={0.8}
            disabled={!allSelected}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{allSelected ? 'Save check-in ✦' : 'Select all three to save'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCheckIn && checkInDone && (
        <View>
          <View style={styles.divider} />
          <Text style={styles.checkInDone}>✦ Check-in saved — your score will update tonight</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream,
    borderWidth: 0.5,
    borderColor: Colors.parchmentDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.mist,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreNum: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    lineHeight: 42,
  },
  scoreBadge: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    marginBottom: 2,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    fontFamily: Fonts.sansMedium,
    fontSize: 22,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.parchmentDark,
    marginVertical: 14,
  },
  pillars: { marginTop: 4 },
  pillarNote: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.mist,
    textAlign: 'center',
    marginTop: 4,
  },
  checkInTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.plum,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: Colors.plum,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.parchmentDark,
  },
  saveBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.parchment,
  },
  checkInDone: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.sage,
    textAlign: 'center',
  },
});
