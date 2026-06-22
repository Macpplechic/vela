/**
 * AppleHealthCard.tsx
 * Displays Apple Health metrics (steps, sleep, HR, HRV) on the Ritual home tab.
 * Shows a "Connect Apple Health" prompt if not yet authorized.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Fonts } from '../constants/Colors';
import { useAppleHealth } from '../hooks/useAppleHealth';

// ── Sleep quality label ────────────────────────────────────────────────────────
function sleepLabel(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 5) return `${hours}h · poor`;
  if (hours < 6.5) return `${hours}h · light`;
  if (hours < 8) return `${hours}h · good`;
  return `${hours}h · great`;
}

function sleepColor(hours: number | null): string {
  if (hours === null) return Colors.mist;
  if (hours < 5) return Colors.rose;
  if (hours < 6.5) return Colors.gold;
  return Colors.teal;
}

// ── HRV interpretation ─────────────────────────────────────────────────────────
function hrvLabel(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 20) return `${ms}ms · low`;
  if (ms < 50) return `${ms}ms · moderate`;
  return `${ms}ms · good`;
}

function hrvColor(ms: number | null): string {
  if (ms === null) return Colors.mist;
  if (ms < 20) return Colors.rose;
  if (ms < 50) return Colors.gold;
  return Colors.sage;
}

// ── Steps bar ─────────────────────────────────────────────────────────────────
function StepsMiniBar({ steps }: { steps: number | null }) {
  const goal = 8000;
  const pct = steps !== null ? Math.min(1, steps / goal) : 0;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${Math.round(pct * 100)}%` as any }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 4, backgroundColor: Colors.parchmentDark, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  fill:  { height: 4, backgroundColor: Colors.teal, borderRadius: 2 },
});

// ── Metric tile ───────────────────────────────────────────────────────────────
function Tile({
  label,
  value,
  sub,
  color = Colors.plum,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: string;
}) {
  return (
    <View style={tile.wrap}>
      <Text style={tile.icon}>{icon}</Text>
      <Text style={tile.label}>{label}</Text>
      <Text style={[tile.value, { color }]}>{value}</Text>
      {sub ? <Text style={tile.sub}>{sub}</Text> : null}
    </View>
  );
}

const tile = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: 10 },
  icon:  { fontSize: 18, marginBottom: 4 },
  label: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontFamily: Fonts.sansMedium, fontSize: 15, textAlign: 'center' },
  sub:   { fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' },
});

// ── Main card ─────────────────────────────────────────────────────────────────
export default function AppleHealthCard() {
  const { healthData, permissionStatus, requestPermissions, refresh, isLoading } =
    useAppleHealth();

  const [connecting, setConnecting] = useState(false);

  if (Platform.OS !== 'ios') return null;

  // ── Not yet connected ──────────────────────────────────────────────────────
  if (permissionStatus === 'undetermined' || permissionStatus === 'denied') {
    return (
      <View style={styles.card}>
        <View style={styles.connectRow}>
          <Text style={styles.connectIcon}>❤️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.connectTitle}>Connect Apple Health</Text>
            <Text style={styles.connectSub}>
              Auto-fill sleep, steps, heart rate & HRV — no manual entry needed.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.connectBtn, connecting && { opacity: 0.6 }]}
          activeOpacity={0.8}
          disabled={connecting}
          onPress={async () => {
            setConnecting(true);
            const ok = await requestPermissions();
            setConnecting(false);
            if (!ok && permissionStatus === 'denied') {
              Alert.alert(
                'Permission required',
                'Open Settings → Privacy & Security → Health → Vela and enable all read permissions.',
                [{ text: 'OK' }]
              );
            }
          }}
        >
          {connecting ? (
            <ActivityIndicator color={Colors.parchment} size="small" />
          ) : (
            <Text style={styles.connectBtnText}>Connect Apple Health →</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (permissionStatus === 'unavailable') return null;

  // ── Connected — show metrics ───────────────────────────────────────────────
  const { stepsToday, sleepHoursLast, restingHeartRate, hrv, lastFetched } = healthData;

  const stepsDisplay =
    stepsToday !== null ? stepsToday.toLocaleString() : '—';
  const hrDisplay = restingHeartRate !== null ? `${restingHeartRate} bpm` : '—';

  const lastFetchedLabel = lastFetched
    ? `Updated ${new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>❤️</Text>
          <Text style={styles.cardTitle}>Apple Health</Text>
        </View>
        <TouchableOpacity onPress={refresh} disabled={isLoading} style={{ padding: 4 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.mist} />
          ) : (
            <Text style={styles.refreshText}>↻ sync</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Metric tiles */}
      <View style={styles.tileRow}>
        <Tile
          label="Steps"
          icon="🚶‍♀️"
          value={stepsDisplay}
          sub={stepsToday !== null && stepsToday >= 8000 ? 'goal hit ✦' : stepsToday !== null ? `${(8000 - stepsToday).toLocaleString()} to goal` : undefined}
          color={stepsToday !== null && stepsToday >= 8000 ? Colors.sage : Colors.plum}
        />
        <View style={styles.divider} />
        <Tile
          label="Sleep"
          icon="🌙"
          value={sleepHoursLast !== null ? `${sleepHoursLast}h` : '—'}
          sub={sleepHoursLast !== null ? (sleepHoursLast < 6.5 ? 'below target' : 'good sleep') : undefined}
          color={sleepColor(sleepHoursLast)}
        />
        <View style={styles.divider} />
        <Tile
          label="Heart rate"
          icon="💓"
          value={hrDisplay}
          color={restingHeartRate !== null && restingHeartRate > 80 ? Colors.rose : Colors.plum}
        />
        <View style={styles.divider} />
        <Tile
          label="HRV"
          icon="〰️"
          value={hrv !== null ? `${hrv}ms` : '—'}
          sub={hrv !== null ? (hrv < 20 ? 'stressed' : hrv < 50 ? 'moderate' : 'recovered') : undefined}
          color={hrvColor(hrv)}
        />
      </View>

      {/* Steps progress bar */}
      {stepsToday !== null && (
        <View style={{ paddingHorizontal: 4, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={styles.barLabel}>Daily step goal</Text>
            <Text style={styles.barLabel}>8,000 steps</Text>
          </View>
          <StepsMiniBar steps={stepsToday} />
        </View>
      )}

      {/* Context insight */}
      {sleepHoursLast !== null && sleepHoursLast < 6 && (
        <View style={styles.insight}>
          <Text style={styles.insightText}>
            🌙 Only {sleepHoursLast}h last night — poor sleep amplifies hot flashes and mood shifts. Prioritize rest today.
          </Text>
        </View>
      )}
      {hrv !== null && hrv < 20 && (
        <View style={styles.insight}>
          <Text style={styles.insightText}>
            〰️ Low HRV today — your nervous system is under stress. CoolDown breathwork can help restore balance.
          </Text>
        </View>
      )}

      {lastFetchedLabel ? (
        <Text style={styles.lastFetched}>{lastFetchedLabel}</Text>
      ) : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
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
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.plum,
  },
  refreshText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mist,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  divider: {
    width: 0.5,
    backgroundColor: Colors.parchmentDark,
    marginVertical: 4,
  },
  barLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.mist,
  },
  insight: {
    backgroundColor: Colors.tealPale,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  insightText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.plum,
    lineHeight: 18,
  },
  lastFetched: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.mist,
    marginTop: 8,
    textAlign: 'right',
  },
  // Connect state
  connectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  connectIcon: { fontSize: 24, marginTop: 2 },
  connectTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.plum,
    marginBottom: 4,
  },
  connectSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mist,
    lineHeight: 18,
  },
  connectBtn: {
    backgroundColor: Colors.plum,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  connectBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.parchment,
  },
});
