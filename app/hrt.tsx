/**
 * app/hrt.tsx
 * HRT & Medication Tracker
 * Navigate: router.push('/hrt')
 *
 * Stores: @vela_hrt_entries (array of HRTEntry)
 * Features:
 *  - Log HRT type, dose, route, start date
 *  - Track additional medications
 *  - Symptom correlation: compares symptom counts before/after start date
 *  - Timeline view
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HRTEntry {
  id: string;
  type: 'estrogen' | 'progesterone' | 'testosterone' | 'combination' | 'other';
  name: string;         // e.g. "Estradiol patch", "Prometrium"
  dose: string;         // e.g. "0.05mg", "200mg"
  route: 'patch' | 'gel' | 'pill' | 'cream' | 'injection' | 'spray' | 'other';
  frequency: string;    // e.g. "Daily", "Twice weekly"
  startDate: string;    // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD or undefined if ongoing
  notes: string;
  active: boolean;
}

const STORAGE_KEY = '@vela_hrt_entries';

const HRT_TYPES = [
  { key: 'estrogen',     label: 'Estrogen',          color: Colors.rose },
  { key: 'progesterone', label: 'Progesterone',       color: Colors.teal },
  { key: 'testosterone', label: 'Testosterone',       color: Colors.gold },
  { key: 'combination',  label: 'Combined (E+P)',     color: Colors.plum },
  { key: 'other',        label: 'Other medication',   color: Colors.mist },
] as const;

const ROUTES = ['patch', 'gel', 'pill', 'cream', 'injection', 'spray', 'other'] as const;

const TYPE_ICONS: Record<string, string> = {
  estrogen: '🌸', progesterone: '🌿', testosterone: '⚡',
  combination: '💊', other: '💉',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Symptom correlation ────────────────────────────────────────────────────────

function useSymptomCorrelation(entry: HRTEntry | null, history: any[]) {
  return useMemo(() => {
    if (!entry || history.length === 0) return null;
    const start = entry.startDate;
    const before = history.filter(h => h.date < start).slice(0, 30);
    const after  = history.filter(h => h.date >= start).slice(0, 30);
    if (before.length < 3 || after.length < 3) return null;
    const avgBefore = before.reduce((a, h) => a + (h.symptoms?.length ?? 0), 0) / before.length;
    const avgAfter  = after.reduce((a, h) => a + (h.symptoms?.length ?? 0), 0) / after.length;
    const delta = avgAfter - avgBefore;
    const pct = avgBefore > 0 ? Math.round(Math.abs(delta / avgBefore) * 100) : 0;
    return { avgBefore: Math.round(avgBefore * 10) / 10, avgAfter: Math.round(avgAfter * 10) / 10, delta, pct };
  }, [entry, history]);
}

// ── Empty form ─────────────────────────────────────────────────────────────────

const emptyForm = (): Omit<HRTEntry, 'id'> => ({
  type: 'estrogen',
  name: '',
  dose: '',
  route: 'patch',
  frequency: 'Daily',
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  active: true,
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function HRTScreen() {
  const { history } = useVelaStore();
  const [entries, setEntries] = useState<HRTEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HRTEntry | null>(null);

  const correlation = useSymptomCorrelation(selectedEntry, history);

  // Load
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setEntries(JSON.parse(raw));
    });
  }, []);

  const save = async (updated: HRTEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Enter the medication name.'); return; }
    if (!form.dose.trim()) { Alert.alert('Dose required', 'Enter the dose (e.g. 0.05mg).'); return; }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editId) {
      await save(entries.map(e => e.id === editId ? { ...form, id: editId } : e));
    } else {
      await save([...entries, { ...form, id: Date.now().toString() }]);
    }
    setShowAdd(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const handleStop = async (id: string) => {
    Alert.alert('Stop medication?', 'Mark this as no longer active?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop', style: 'destructive', onPress: async () => {
          await save(entries.map(e => e.id === id
            ? { ...e, active: false, endDate: new Date().toISOString().split('T')[0] }
            : e
          ));
          if (selectedEntry?.id === id) setSelectedEntry(null);
        },
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await save(entries.filter(e => e.id !== id));
          if (selectedEntry?.id === id) setSelectedEntry(null);
        },
      },
    ]);
  };

  const activeEntries   = entries.filter(e => e.active);
  const inactiveEntries = entries.filter(e => !e.active);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>HRT & Medications</Text>
          <Text style={styles.titleSub}>Track what you take and how it helps</Text>
        </View>
        <TouchableOpacity onPress={() => { setForm(emptyForm()); setEditId(null); setShowAdd(true); }}
          style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Active medications */}
        {activeEntries.length === 0 && inactiveEntries.length === 0 && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 36 }]}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>💊</Text>
            <Text style={styles.emptyTitle}>No medications logged yet</Text>
            <Text style={styles.emptySub}>
              Track your HRT, supplements, and medications. Vela will show you how your symptoms change after you start each one.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => { setForm(emptyForm()); setShowAdd(true); }}>
              <Text style={styles.startBtnText}>Add first medication →</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Active</Text>
            {activeEntries.map(entry => {
              const typeInfo = HRT_TYPES.find(t => t.key === entry.type)!;
              const days = daysSince(entry.startDate);
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <View key={entry.id}>
                  <TouchableOpacity
                    style={[styles.entryCard, isSelected && { borderColor: Colors.plum, borderWidth: 1.5 }]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedEntry(isSelected ? null : entry)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                        <Text style={{ fontSize: 20 }}>{TYPE_ICONS[entry.type]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName}>{entry.name}</Text>
                        <Text style={styles.entrySub}>{entry.dose} · {entry.route} · {entry.frequency}</Text>
                        <Text style={styles.entryDate}>Started {formatDate(entry.startDate)} · {days} days ago</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                      </View>
                    </View>

                    {/* Symptom correlation */}
                    {isSelected && correlation && (
                      <View style={styles.correlation}>
                        <Text style={styles.corrLabel}>Symptom impact since starting</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <View style={styles.corrStat}>
                            <Text style={styles.corrNum}>{correlation.avgBefore}</Text>
                            <Text style={styles.corrStatLabel}>avg/day before</Text>
                          </View>
                          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 18, color: correlation.delta < 0 ? Colors.sage : Colors.rose }}>
                              {correlation.delta < 0 ? '↓' : correlation.delta > 0 ? '↑' : '→'}
                            </Text>
                          </View>
                          <View style={styles.corrStat}>
                            <Text style={[styles.corrNum, { color: correlation.delta < 0 ? Colors.sage : Colors.rose }]}>
                              {correlation.avgAfter}
                            </Text>
                            <Text style={styles.corrStatLabel}>avg/day after</Text>
                          </View>
                          <View style={[styles.corrStat, { flex: 2 }]}>
                            <Text style={[styles.corrNum, { color: correlation.delta < 0 ? Colors.sage : Colors.rose }]}>
                              {correlation.pct}% {correlation.delta < 0 ? 'fewer' : 'more'}
                            </Text>
                            <Text style={styles.corrStatLabel}>symptom change</Text>
                          </View>
                        </View>
                        {correlation.delta < -0.5 && (
                          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.sage, marginTop: 8 }}>
                            ✦ Symptoms appear to be improving since you started this medication.
                          </Text>
                        )}
                        {correlation.delta > 0.5 && (
                          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.rose, marginTop: 8 }}>
                            ◎ Symptoms appear higher since starting. Mention this to your doctor.
                          </Text>
                        )}
                      </View>
                    )}

                    {entry.notes ? (
                      <Text style={styles.entryNotes}>{entry.notes}</Text>
                    ) : null}

                    {isSelected && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => {
                          setForm({ type: entry.type, name: entry.name, dose: entry.dose, route: entry.route,
                            frequency: entry.frequency, startDate: entry.startDate, notes: entry.notes, active: entry.active });
                          setEditId(entry.id); setShowAdd(true);
                        }}>
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.rosePale }]} onPress={() => handleStop(entry.id)}>
                          <Text style={[styles.actionBtnText, { color: Colors.rose }]}>Stop taking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(entry.id)}>
                          <Text style={[styles.actionBtnText, { color: Colors.mist }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Inactive / stopped */}
        {inactiveEntries.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Past medications</Text>
            {inactiveEntries.map(entry => (
              <View key={entry.id} style={[styles.entryCard, { opacity: 0.6 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 18 }}>{TYPE_ICONS[entry.type]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entrySub}>{entry.dose} · stopped {entry.endDate ? formatDate(entry.endDate) : 'unknown'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(entry.id)} style={{ padding: 4 }}>
                    <Text style={{ color: Colors.mist, fontSize: 16 }}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: Colors.indigoPale, borderColor: Colors.indigo + '40', marginTop: 20 }]}>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.indigo, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            About HRT & Vela
          </Text>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, lineHeight: 19 }}>
            Vela tracks your symptom patterns before and after you start any medication. As you log more days, the symptom correlation above becomes more accurate.{'\n\n'}
            Tap any active medication to see how your symptoms have changed since you started it.{'\n\n'}
            ⚠️ Always discuss medication changes with your healthcare provider.
          </Text>
        </View>
      </ScrollView>

      {/* Add / Edit modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editId ? 'Edit medication' : 'Add medication'}</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={{ fontSize: 26, color: Colors.mist }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

            {/* Type */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {HRT_TYPES.map(t => (
                <TouchableOpacity key={t.key} onPress={() => setForm(f => ({ ...f, type: t.key as any }))}
                  style={[styles.typeChip, form.type === t.key && { backgroundColor: t.color, borderColor: t.color }]}>
                  <Text style={[styles.typeChipText, form.type === t.key && { color: '#fff' }]}>
                    {TYPE_ICONS[t.key]} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Medication name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))}
              placeholder="e.g. Estradiol, Prometrium, Testogel" placeholderTextColor={Colors.mist} />

            {/* Dose */}
            <Text style={styles.fieldLabel}>Dose</Text>
            <TextInput style={styles.input} value={form.dose} onChangeText={t => setForm(f => ({ ...f, dose: t }))}
              placeholder="e.g. 0.05mg, 200mg, 1 pump" placeholderTextColor={Colors.mist} />

            {/* Route */}
            <Text style={styles.fieldLabel}>How you take it</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ROUTES.map(r => (
                <TouchableOpacity key={r} onPress={() => setForm(f => ({ ...f, route: r }))}
                  style={[styles.typeChip, form.route === r && { backgroundColor: Colors.plum, borderColor: Colors.plum }]}>
                  <Text style={[styles.typeChipText, form.route === r && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency */}
            <Text style={styles.fieldLabel}>Frequency</Text>
            <TextInput style={styles.input} value={form.frequency} onChangeText={t => setForm(f => ({ ...f, frequency: t }))}
              placeholder="e.g. Daily, Twice weekly, Every 3 days" placeholderTextColor={Colors.mist} />

            {/* Start date */}
            <Text style={styles.fieldLabel}>Start date</Text>
            <TextInput style={styles.input} value={form.startDate} onChangeText={t => setForm(f => ({ ...f, startDate: t }))}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.mist} />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={form.notes}
              onChangeText={t => setForm(f => ({ ...f, notes: t }))}
              placeholder="Doctor's instructions, side effects, etc." placeholderTextColor={Colors.mist} multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>{editId ? 'Save changes' : 'Add medication'} ✦</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.parchment },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum },
  back:         { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:        { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:     { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  addBtn:       { borderWidth: 1, borderColor: Colors.gold, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 12 },
  addBtnText:   { fontFamily: Fonts.sans, fontSize: 12, color: Colors.gold },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  card:         { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 18, marginBottom: 12 },
  entryCard:    { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 16, marginBottom: 10 },
  typeIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  entryName:    { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.plum, marginBottom: 2 },
  entrySub:     { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginBottom: 2 },
  entryDate:    { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist },
  entryNotes:   { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 8, fontStyle: 'italic' },
  typeBadge:    { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  typeBadgeText:{ fontFamily: Fonts.sans, fontSize: 10 },
  correlation:  { backgroundColor: Colors.parchment, borderRadius: 12, padding: 12, marginTop: 12 },
  corrLabel:    { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 1, textTransform: 'uppercase' },
  corrStat:     { flex: 1, alignItems: 'center' },
  corrNum:      { fontFamily: Fonts.serif, fontSize: 22, color: Colors.plum },
  corrStatLabel:{ fontFamily: Fonts.sans, fontSize: 9, color: Colors.mist, textAlign: 'center', marginTop: 2 },
  actionBtn:    { flex: 1, backgroundColor: Colors.parchment, borderRadius: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.parchmentDark },
  actionBtnText:{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum },
  emptyTitle:   { fontFamily: Fonts.serif, fontSize: 18, color: Colors.plum, marginBottom: 8, textAlign: 'center' },
  emptySub:     { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  startBtn:     { backgroundColor: Colors.plum, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24 },
  startBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.parchment },
  // Modal
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark },
  modalTitle:   { fontFamily: Fonts.serif, fontSize: 20, color: Colors.plum },
  fieldLabel:   { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.mist, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:        { backgroundColor: Colors.parchment, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 12, padding: 12, fontFamily: Fonts.sans, fontSize: 14, color: Colors.plum, marginBottom: 16 },
  typeChip:     { borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  typeChipText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum },
  saveBtn:      { backgroundColor: Colors.plum, borderRadius: 20, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText:  { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment },
});
