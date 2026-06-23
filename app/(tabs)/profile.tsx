import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Modal, Share } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts } from '../../constants/Colors';
import { scheduleVelaNotifications, cancelAllNotifications } from '../../hooks/useNotifications';
import { generateDoctorReport } from '../../hooks/generateReport';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PHASES, SUPP_LIBRARY, DOCTOR_QUESTIONS } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

const CAT_LABELS: Record<string, string> = {
  essential:'✦ Essentials', energy:'Energy & vitality',
  calm:'Calm & sleep', glow:'Skin, hair & glow', metabolism:'Metabolism & balance',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={statStyles.card}>
      <Text allowFontScaling={false} style={statStyles.label}>{label}</Text>
      <Text allowFontScaling={false} style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      {sub ? <Text allowFontScaling={false} style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex:1, backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:14, padding:12, alignItems:'center', minWidth: 80 },
  label: { fontFamily:Fonts.sans, fontSize:9, color:Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4, textAlign:'center' },
  value: { fontFamily:Fonts.sansMedium, fontSize:22, color:Colors.plum, textAlign:'center' },
  sub: { fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, marginTop:2, textAlign:'center' },
});

export default function ProfileScreen() {
  const {
    phase, symptoms, mySupps, mySuppsData, setMySupps,
    checkedSupps, setCheckedSupps,
    fluxActive, coolActive, fluxDaysLeft, coolDaysLeft,
    startFluxTrial, startCoolTrial, resetOnboarding,
    history, sleepHistory, fluxLogs, streak, lastStreakDate, topSymptoms, avgNutrients, suppAdherence,
  } = useVelaStore();
  const _mySuppsDataTyped = mySuppsData as any[];

  const pd = PHASES[phase ?? 'late'];
  const [showDoctor, setShowDoctor] = useState(false);
  const [showSuppLib, setShowSuppLib] = useState(false);
  const [suppCat, setSuppCat] = useState('essential');
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const insightCardRef = useRef<any>(null);

  const handleShareInsightCard = async () => {
    if (!insightCardRef.current) return;
    setSharingCard(true);
    try {
      const uri = await insightCardRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Vela snapshot' });
    } catch (e) {
      Alert.alert('Could not share', 'Please try again.');
    }
    setSharingCard(false);
  };
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleExportPDF = async () => {
    if (history.length === 0) { require('react-native').Alert.alert('No data yet', 'Start logging symptoms, food, and supplements to generate your report.'); return; }
    setPdfLoading(true);
    try {
      await generateDoctorReport({
        phase: phase ?? 'late',
        phaseLabel: pd.label,
        symptoms,
        topSymptoms: topSyms,
        history,
        sleepHistory,
        mySupps: mySuppsData.map((s: any) => s.name),
        suppAdherence: adherence,
        avgNutrients: avgNut,
      });
    } catch (e) {
      console.error('PDF failed:', e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleNotifToggle = async () => {
    setNotifsLoading(true);
    if (notifsEnabled) {
      await cancelAllNotifications();
      setNotifsEnabled(false);
    } else {
      const granted = await scheduleVelaNotifications();
      setNotifsEnabled(granted);
    }
    setNotifsLoading(false);
  };

  const handleBackup = async () => {
    try {
      const backup = {
        version: 1,
        exportDate: new Date().toISOString(),
        phase, history, sleepHistory, mySupps, symptoms,
        fluxLogs, streak, lastStreakDate,
      };
      const json = JSON.stringify(backup, null, 2);
      // Share as text — avoids filesystem write entirely, works on all Expo SDK versions
      await Share.share({
        message: json,
        title: 'vela_backup.json',
      });
    } catch (e) {
      Alert.alert('Backup failed', 'Could not create backup file.');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backup = JSON.parse(json);
      if (backup.version !== 1) {
        Alert.alert('Invalid backup', 'This file does not appear to be a valid Vela backup.');
        return;
      }
      Alert.alert(
        'Restore backup?',
        `This will replace all your current data with the backup from ${new Date(backup.exportDate).toLocaleDateString()}. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'destructive', onPress: async () => {
            if (backup.phase) { const { AsyncStorage } = require('@react-native-async-storage/async-storage'); await AsyncStorage.setItem('@vela_phase', JSON.stringify(backup.phase)); }
            if (backup.mySupps) await setMySupps(backup.mySupps);
            Alert.alert('Restored ✦', 'Your Vela data has been restored. Restart the app to see all changes.');
          }},
        ]
      );
    } catch (e) {
      Alert.alert('Restore failed', 'Could not read the backup file. Make sure it is a valid Vela backup.');
    }
  };

  useEffect(() => {
    const askReview = async () => {
      if (streak >= 3) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const asked = await AsyncStorage.getItem('@vela_review_asked');
          if (!asked) {
            const StoreReview = require('expo-store-review');
            const available = await StoreReview.isAvailableAsync();
            if (available) {
              await StoreReview.requestReview();
              await AsyncStorage.setItem('@vela_review_asked', '1');
            }
          }
        } catch (e) { /* store review unavailable */ }
      }
    };
    askReview();
  }, [streak]);

  const toggleMySupp = async (id: string) => {
    const next = mySupps.includes(id) ? mySupps.filter(x => x !== id) : [...mySupps, id];
    const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
    impactAsync(ImpactFeedbackStyle.Medium);
    await setMySupps(next);
    if (!next.includes(id)) await setCheckedSupps(checkedSupps.filter(x => x !== id));
  };

  // ── Monthly stats ─────────────────────────────────────────────────────────
  const adherence = suppAdherence();
  const topSyms = topSymptoms(5);
  const avgNut = avgNutrients();

  const monthEntries = useMemo(() => {
    return history.filter(e => e.date.startsWith(selectedMonth));
  }, [history, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = [...new Set(history.map(e => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
    const nowStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
    if (!months.includes(nowStr)) months.unshift(nowStr);
    return months;
  }, [history]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  };

  const monthStats = useMemo(() => {
    if (monthEntries.length === 0) return null;
    const daysWithFood = monthEntries.filter(e => e.foods.length > 0).length;
    const daysWithSymptoms = monthEntries.filter(e => e.symptoms.length > 0).length;
    const daysWithJournal = monthEntries.filter(e => e.journal.trim().length > 0).length;
    const allSymptoms: Record<string, number> = {};
    monthEntries.forEach(e => e.symptoms.forEach(s => { allSymptoms[s] = (allSymptoms[s] ?? 0) + 1; }));
    const topMonthSyms = Object.entries(allSymptoms).sort((a,b) => b[1]-a[1]).slice(0,3);
    const avgProtein = daysWithFood > 0
      ? Math.round(monthEntries.filter(e=>e.foods.length>0).reduce((a,e)=>a+e.totals.protein,0) / daysWithFood)
      : 0;
    const avgCal = daysWithFood > 0
      ? Math.round(monthEntries.filter(e=>e.foods.length>0).reduce((a,e)=>a+e.totals.cal,0) / daysWithFood)
      : 0;
    return { daysWithFood, daysWithSymptoms, daysWithJournal, topMonthSyms, avgProtein, avgCal };
  }, [monthEntries]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.logoText}>vela</Text>
        <Text allowFontScaling={false} style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Phase ── */}
        <View style={[styles.phaseCard, { backgroundColor:pd.bg, borderColor:pd.color }]}>
          <Text allowFontScaling={false} style={[styles.phaseLabel, { color:pd.color }]}>Your phase</Text>
          <Text allowFontScaling={false} style={styles.phaseTitle}>{pd.label}</Text>
          <Text allowFontScaling={false} style={styles.phaseDesc}>{pd.desc}</Text>
          <TouchableOpacity delayPressIn={0} onPress={() => { resetOnboarding(); router.replace('/onboarding'); }} style={styles.retakeBtn}>
            <Text allowFontScaling={false} style={styles.retakeBtnText}>✎ Retake phase quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/coach' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.plum, marginTop: 10 }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.goldLight }]}>
              ✦ Ask Vela Coach
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              On-device AI · your data stays private
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/hrt' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.tealPale, marginTop: 10, borderWidth: 0.5, borderColor: Colors.teal + '40' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.teal }]}>
              💊 HRT & Medications
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              Track what you take · see how symptoms change
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/bone' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.sagePale, marginTop: 10, borderWidth: 0.5, borderColor: Colors.sage + '40' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.sage }]}>
              🦴 Bone Health Score
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              Calcium · D3 · exercise · DEXA tracker
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/trends' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.indigoPale, marginTop: 10, borderWidth: 0.5, borderColor: Colors.indigo + '40' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.indigo }]}>
              📊 90-Day Trends
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              Symptom charts · sleep curve · nutrition adherence
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/doctor' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.goldPale ?? '#FDF3DC', marginTop: 10, borderWidth: 0.5, borderColor: Colors.gold + '40' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.gold }]}>
              🩺 Doctor Appointment Prep
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              Talking points · questions · shareable PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/cbt' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.tealPale, marginTop: 10, borderWidth: 0.5, borderColor: Colors.teal + '40' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.teal }]}>
              🧠 CBT for Hot Flashes
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              6-week evidence-based program · reduces distress 50%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            delayPressIn={0}
            onPress={() => router.push('/partner' as any)}
            style={[styles.retakeBtn, { backgroundColor: Colors.rosePale, marginTop: 10, borderWidth: 0.5, borderColor: Colors.rose + '30' }]}
          >
            <Text allowFontScaling={false} style={[styles.retakeBtnText, { color: Colors.rose }]}>
              🤍 Partner Mode
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, marginTop: 2, textAlign: 'center' }}>
              Weekly digest for someone you trust
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>Doctor report</Text>
          <Text allowFontScaling={false} style={styles.cardSub}>Symptoms · nutrition · supplements · sleep · patterns — 90 days of data your doctor actually needs. Takes 3 seconds to generation, supplements</Text>
          <TouchableOpacity delayPressIn={0}
            onPress={handleExportPDF}
            disabled={pdfLoading}
            style={[styles.retakeBtn, { backgroundColor: pdfLoading ? Colors.parchmentDark : Colors.plum }]}>
            <Text allowFontScaling={false} style={styles.retakeBtnText}>
              {pdfLoading ? 'Generating...' : '✦ Export PDF for my doctor'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>Daily reminders</Text>
          <Text allowFontScaling={false} style={styles.cardSub}>Supplement check-ins, sleep logs, and weekly insights</Text>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <View>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sans, fontSize:13, color:Colors.plum }}>
                {notifsEnabled ? '🔔 Notifications on' : '🔕 Notifications off'}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, marginTop:2 }}>
                {notifsEnabled ? '7:30am · 8am · 1pm · 5pm · 9pm' : 'Tap to enable reminders'}
              </Text>
            </View>
            <TouchableOpacity delayPressIn={0}
              onPress={handleNotifToggle}
              disabled={notifsLoading}
              style={[styles.notifToggle, { backgroundColor: notifsEnabled ? Colors.sage : Colors.parchmentDark }]}>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sansMedium, fontSize:12, color: notifsEnabled ? Colors.cream : Colors.mist }}>
                {notifsLoading ? '...' : notifsEnabled ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.footer}>Always consult your healthcare provider</Text>
        <View style={{ height: 20 }} />
        {/* ── 30-Day Snapshot ── */}
        <Text allowFontScaling={false} style={styles.sectionTitle}>Last 30 days</Text>
        <View style={styles.statsRow}>
          <StatCard label="Supp adherence" value={`${adherence}%`} sub={adherence >= 70 ? 'on track' : adherence > 0 ? 'keep going' : 'start today'} color={adherence >= 70 ? Colors.sage : Colors.gold} />
          <StatCard label="Days logged" value={`${history.filter(e => { const d = new Date(); d.setDate(d.getDate()-30); return new Date(e.date) >= d; }).length}`} sub={history.filter(e => { const d = new Date(); d.setDate(d.getDate()-30); return new Date(e.date) >= d; }).length >= 20 ? "excellent" : "of 30"} />
          <StatCard label="Avg protein" value={`${Math.round(avgNut.protein)}g`} sub="daily" />
        </View>

        {/* Streak card */}
        {streak > 0 && (
          <View style={styles.streakCard}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.streakCardLabel}>Current streak</Text>
              <Text allowFontScaling={false} style={styles.streakCardNum}>🔥 {streak} day{streak !== 1 ? 's' : ''}</Text>
              <Text allowFontScaling={false} style={styles.streakCardSub}>
                {streak >= 30 ? 'Incredible — 30+ days of consistency.' :
                 streak >= 14 ? 'Two weeks strong. Keep going.' :
                 streak >= 7  ? 'One full week. You are building something real.' :
                 streak >= 3  ? 'Three days in. Momentum is building.' :
                 'Great start. Come back tomorrow to keep it going.'}
              </Text>
            </View>
            <View style={styles.streakRing}>
              <Text allowFontScaling={false} style={styles.streakRingNum}>{streak}</Text>
              <Text allowFontScaling={false} style={styles.streakRingLabel}>{streak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your milestones</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}} contentContainerStyle={{gap:10,paddingRight:16}}>
          {[
            { icon: '🌱', label: 'First log',    sub:'Day 1',     earned: history.length >= 1 },
            { icon: '💧', label: 'Hydrated',      sub:'8 glasses', earned: false },
            { icon: '🔥', label: '7-day streak',  sub:'1 week',    earned: streak >= 7 },
            { icon: '⚡', label: '2 weeks',        sub:'14 days',   earned: streak >= 14 },
            { icon: '🧘', label: 'Supplement pro', sub:'30 days',   earned: history.length >= 30 },
            { icon: '🌙', label: '30-day logger',  sub:'Consistent',earned: history.length >= 30 },
            { icon: '📊', label: 'Pattern finder', sub:'60 days',   earned: history.length >= 60 },
            { icon: '✦',  label: '90-day report',  sub:'3 months',  earned: history.length >= 90 },
            { icon: '👑', label: 'Vela Legend',    sub:'1 year',    earned: history.length >= 365 },
          ].map((b, i) => (
            <View key={i} style={[styles.badge, !b.earned && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{b.earned ? b.icon : '○'}</Text>
              <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelLocked]}>{b.label}</Text>
              <Text style={[styles.badgeSub, !b.earned && styles.badgeLabelLocked]}>{b.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {topSyms.length > 0 && (
          <View style={[styles.card, { marginTop: 4 }]}>
            <Text allowFontScaling={false} style={styles.cardTitle}>Top symptoms this month</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8 }}>
              {topSyms.map(({ symptom, count }) => (
                <View key={symptom} style={styles.symStatChip}>
                  <Text allowFontScaling={false} style={styles.symStatText}>{symptom}</Text>
                  <Text allowFontScaling={false} style={styles.symStatCount}>{count}×</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Supplements ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text allowFontScaling={false} style={styles.cardTitle}>My supplements</Text>
            <TouchableOpacity delayPressIn={0} onPress={() => { setShowSuppLib(true); }} style={styles.manageBadge} activeOpacity={0.6}>
              <Text allowFontScaling={false} style={styles.manageBadgeText}>+ manage</Text>
            </TouchableOpacity>
          </View>
          <Text allowFontScaling={false} style={styles.cardSub}>{_mySuppsDataTyped.length === 0 ? 'Tap manage to build your stack' : `${_mySuppsDataTyped.length} supplements · {adherence}% adherence last 30 days</Text>`}</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
            {_mySuppsDataTyped.map((s:any) => (
              <View key={s.id} style={styles.suppChip}>
                <Text allowFontScaling={false} style={styles.suppChipText}>{s.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Doctor prep ── */}
        <View style={styles.card}>
          <TouchableOpacity delayPressIn={0} onPress={() => setShowDoctor(!showDoctor)} style={styles.cardTitleRow} activeOpacity={0.7}>
            <View style={{ flex:1 }}>
              <Text allowFontScaling={false} style={styles.cardTitle}>Doctor visit prep</Text>
              <Text allowFontScaling={false} style={styles.cardSub}>Know your rights. Ask the right questions.</Text>
            </View>
            <Text allowFontScaling={false} style={styles.chevron}>{showDoctor ? '−' : '+'}</Text>
          </TouchableOpacity>
          {showDoctor && (
            <View style={{ marginTop:14 }}>
              {symptoms.length > 0 && (
                <View style={styles.symptomsBox}>
                  <Text allowFontScaling={false} style={styles.symptomsBoxLabel}>Your logged symptoms today</Text>
                  <Text allowFontScaling={false} style={styles.symptomsBoxText}>{symptoms.join(' · ')}</Text>
                </View>
              )}
              {/* Streak card */}
        {streak > 0 && (
          <View style={styles.streakCard}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.streakCardLabel}>Current streak</Text>
              <Text allowFontScaling={false} style={styles.streakCardNum}>🔥 {streak} day{streak !== 1 ? 's' : ''}</Text>
              <Text allowFontScaling={false} style={styles.streakCardSub}>
                {streak >= 30 ? 'Incredible — 30+ days of consistency.' :
                 streak >= 14 ? 'Two weeks strong. Keep going.' :
                 streak >= 7  ? 'One full week. You are building something real.' :
                 streak >= 3  ? 'Three days in. Momentum is building.' :
                 'Great start. Come back tomorrow to keep it going.'}
              </Text>
            </View>
            <View style={styles.streakRing}>
              <Text allowFontScaling={false} style={styles.streakRingNum}>{streak}</Text>
              <Text allowFontScaling={false} style={styles.streakRingLabel}>{streak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your milestones</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}} contentContainerStyle={{gap:10,paddingRight:16}}>
          {[
            { icon: '🌱', label: 'First log',    sub:'Day 1',     earned: history.length >= 1 },
            { icon: '💧', label: 'Hydrated',      sub:'8 glasses', earned: false },
            { icon: '🔥', label: '7-day streak',  sub:'1 week',    earned: streak >= 7 },
            { icon: '⚡', label: '2 weeks',        sub:'14 days',   earned: streak >= 14 },
            { icon: '🧘', label: 'Supplement pro', sub:'30 days',   earned: history.length >= 30 },
            { icon: '🌙', label: '30-day logger',  sub:'Consistent',earned: history.length >= 30 },
            { icon: '📊', label: 'Pattern finder', sub:'60 days',   earned: history.length >= 60 },
            { icon: '✦',  label: '90-day report',  sub:'3 months',  earned: history.length >= 90 },
            { icon: '👑', label: 'Vela Legend',    sub:'1 year',    earned: history.length >= 365 },
          ].map((b, i) => (
            <View key={i} style={[styles.badge, !b.earned && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{b.earned ? b.icon : '○'}</Text>
              <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelLocked]}>{b.label}</Text>
              <Text style={[styles.badgeSub, !b.earned && styles.badgeLabelLocked]}>{b.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {topSyms.length > 0 && (
                <View style={[styles.symptomsBox, { borderColor:Colors.gold, backgroundColor:Colors.goldPale }]}>
                  <Text allowFontScaling={false} style={[styles.symptomsBoxLabel, { color:Colors.gold }]}>Most frequent last 30 days</Text>
                  <Text allowFontScaling={false} style={styles.symptomsBoxText}>{topSyms.map(s => `${s.symptom} (${s.count}×)`).join(' · ')}</Text>
                </View>
              )}
              {DOCTOR_QUESTIONS.map((q, i) => (
                <View key={i} style={styles.doctorQRow}>
                  <Text allowFontScaling={false} style={styles.doctorArrow}>→</Text>
                  <Text allowFontScaling={false} style={styles.doctorQ}>{q}</Text>
                </View>
              ))}
              <Text allowFontScaling={false} style={styles.doctorNote}>Studies show women who arrive with symptom data get better treatment outcomes. These questions are your starting point.</Text>
            </View>
          )}
        </View>

        {/* ── Modules ── */}
        <Text allowFontScaling={false} style={styles.sectionTitle}>Your modules</Text>
        <View style={styles.moduleGrid}>
          {[
            { id:'flux', name:'FluxLog', glyph:'◎', color:Colors.teal, pale:Colors.tealPale, active:fluxActive, daysLeft:fluxDaysLeft, onStart:startFluxTrial },
            { id:'cool', name:'CoolDown', glyph:'◌', color:Colors.teal, pale:Colors.tealPale, active:coolActive, daysLeft:coolDaysLeft, onStart:startCoolTrial },
          ].map(m => (
            <View key={m.id} style={[styles.moduleCard, { backgroundColor:m.active?m.pale:Colors.cream, borderColor:m.active?m.color:Colors.parchmentDark }]}>
              <Text allowFontScaling={false} style={[styles.moduleGlyph, { color:m.active?m.color:Colors.parchmentDark }]}>{m.glyph}</Text>
              <Text allowFontScaling={false} style={styles.moduleName}>{m.name}</Text>
              {m.active
                ? <Text allowFontScaling={false} style={[styles.moduleStatus, { color:m.color }]}>{m.daysLeft !== null ? `${m.daysLeft}d trial` : '✦ Active'}</Text>
                : <TouchableOpacity delayPressIn={0} onPress={m.onStart} style={[styles.trialBtn, { borderColor:m.color }]}>
                    <Text allowFontScaling={false} style={[styles.trialBtnText, { color:m.color }]}>Start trial</Text>
                  </TouchableOpacity>
              }
            </View>
          ))}
        </View>

        {/* ── Citations ── */}
        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>Research & Sources</Text>
          <Text allowFontScaling={false} style={styles.cardSub}>Vela is built on peer-reviewed research. All recommendations are evidence-based.</Text>
          <View style={{marginTop:12, gap:8}}>
            {[
              { num:'1', text:'The Menopause Society (formerly NAMS) — Clinical Practice Guidelines 2023', url:'https://www.menopause.org' },
              { num:'2', text:'NIH Office of Dietary Supplements — Calcium, Magnesium, Vitamin D fact sheets', url:'https://ods.od.nih.gov' },
              { num:'3', text:'Freedman RR. Menopausal hot flashes: mechanisms, endocrinology, treatment. J Steroid Biochem Mol Biol. 2014', url:'https://pubmed.ncbi.nlm.nih.gov/23747847/' },
              { num:'4', text:'Leproult R, Van Cauter E. Role of sleep and sleep loss in hormonal release and metabolism. Endocr Dev. 2010', url:'https://pubmed.ncbi.nlm.nih.gov/19955752/' },
              { num:'5', text:'Daley A, et al. Exercise for vasomotor menopausal symptoms. Cochrane Database Syst Rev. 2015', url:'https://pubmed.ncbi.nlm.nih.gov/25692420/' },
            ].map((s, i) => (
              <TouchableOpacity delayPressIn={0} key={i}
                onPress={() => require('react-native').Linking.openURL(s.url)}
                style={{flexDirection:'row', gap:8, paddingVertical:6, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark}}>
                <Text allowFontScaling={false} style={{fontFamily:Fonts.sansMedium, fontSize:12, color:Colors.gold, minWidth:16}}>{s.num}.</Text>
                <Text allowFontScaling={false} style={{fontFamily:Fonts.sans, fontSize:11, color:Colors.plum, flex:1, lineHeight:16}}>{s.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text allowFontScaling={false} style={{fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, marginTop:12, lineHeight:15}}>
            ⚠️ Vela is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider before making medical decisions.
          </Text>
        </View>

        {/* ── Creator program ── */}
        <View style={styles.plumCard}>
          <Text allowFontScaling={false} style={styles.plumLabel}>✦ Vela Creator Program</Text>
          <Text allowFontScaling={false} style={styles.plumTitle}>Share Vela. Earn with us.</Text>
          <Text allowFontScaling={false} style={styles.plumText}>Share your referral link and earn 30% of every subscription — forever.</Text>
          <TouchableOpacity delayPressIn={0} onPress={() => setShowAffiliate(true)} style={styles.goldOutlineBtn}>
            <Text allowFontScaling={false} style={styles.goldOutlineBtnText}>✦ Join the Creator Program</Text>
          </TouchableOpacity>
        </View>

        {/* ── Monthly History ── */}
        <View style={styles.card}>
          <TouchableOpacity delayPressIn={0} onPress={() => setShowHistory(!showHistory)} style={styles.cardTitleRow} activeOpacity={0.7}>
            <View>
              <Text allowFontScaling={false} style={styles.cardTitle}>Monthly history</Text>
              <Text allowFontScaling={false} style={styles.cardSub}>{history.length} days tracked</Text>
            </View>
            <Text allowFontScaling={false} style={styles.chevron}>{showHistory ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showHistory && (
            <>
              {/* Month selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:12, marginBottom:16 }} contentContainerStyle={{ gap:8 }}>
                {availableMonths.map(ym => (
                  <TouchableOpacity delayPressIn={0} key={ym} onPress={() => setSelectedMonth(ym)}
                    style={[styles.monthPill, { borderColor: selectedMonth===ym ? Colors.plum : Colors.parchmentDark, backgroundColor: selectedMonth===ym ? Colors.plum : Colors.cream }]}>
                    <Text allowFontScaling={false} style={[styles.monthPillText, { color: selectedMonth===ym ? Colors.parchment : Colors.mist }]}>{monthLabel(ym)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {monthEntries.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text allowFontScaling={false} style={styles.emptyHistoryText}>No data logged for {monthLabel(selectedMonth)} yet.</Text>
                  <Text allowFontScaling={false} style={styles.emptyHistorySubText}>Log food, symptoms, and supplements daily — they'll appear here automatically.</Text>
                </View>
              ) : (
                <>
                  {/* Month summary stats */}
                  {monthStats && (
                    <View style={styles.monthSummary}>
                      <View style={styles.monthStatRow}>
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithFood}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Days with{'\n'}food logged</Text>
                        </View>
                        <View style={styles.monthDivider} />
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithSymptoms}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Days with{'\n'}symptoms</Text>
                        </View>
                        <View style={styles.monthDivider} />
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithJournal}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Journal{'\n'}entries</Text>
                        </View>
                      </View>
                      {monthStats.daysWithFood > 0 && (
                        <View style={styles.monthNutrientRow}>
                          <Text allowFontScaling={false} style={styles.monthNutrientText}>Avg {monthStats.avgProtein}g protein · {monthStats.avgCal} cal/day</Text>
                        </View>
                      )}
                      {monthStats.topMonthSyms.length > 0 && (
                        <View style={{ marginTop:12 }}>
                          <Text allowFontScaling={false} style={styles.monthSymLabel}>Most logged symptoms</Text>
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6 }}>
                            {monthStats.topMonthSyms.map(([sym, cnt]) => (
                              <View key={sym} style={styles.symStatChip}>
                                <Text allowFontScaling={false} style={styles.symStatText}>{sym}</Text>
                                <Text allowFontScaling={false} style={styles.symStatCount}>{cnt}×</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Day-by-day entries */}
                  <Text allowFontScaling={false} style={[styles.cardSub, { marginTop:16, marginBottom:8 }]}>Daily entries</Text>
                  {[...monthEntries].sort((a,b) => b.date.localeCompare(a.date)).map(entry => {
                    const d = new Date(entry.date + 'T12:00:00');
                    const label = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
                    return (
                      <View key={entry.date} style={styles.dayEntry}>
                        <Text allowFontScaling={false} style={styles.dayEntryDate}>{label}</Text>
                        <View style={styles.dayEntryBody}>
                          {entry.foods.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine}>
                              🍽 {entry.foods.length} food{entry.foods.length !== 1 ? 's' : ''} · {Math.round(entry.totals.cal)} cal · {Math.round(entry.totals.protein)}g protein
                            </Text>
                          )}
                          {entry.symptoms.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine} numberOfLines={2}>
                              ◎ {entry.symptoms.slice(0,4).join(' · ')}{entry.symptoms.length > 4 ? ` +${entry.symptoms.length - 4}` : ''}
                            </Text>
                          )}
                          {entry.checkedSupps.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine}>
                              ✦ {entry.checkedSupps.length} supplement{entry.checkedSupps.length !== 1 ? 's' : ''} taken
                            </Text>
                          )}
                          {entry.journal.trim().length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryJournal} numberOfLines={2}>
                              "{entry.journal.trim()}"
                            </Text>
                          )}
                          {entry.foods.length === 0 && entry.symptoms.length === 0 && entry.checkedSupps.length === 0 && !entry.journal.trim() && (
                            <Text allowFontScaling={false} style={styles.dayEntryEmpty}>No data logged</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* ── Shareable insight card ── */}
        {history.length >= 3 && (
          <View style={{ paddingHorizontal: 0, marginBottom: 20 }}>
            <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your Vela snapshot</Text>
            <ViewShot ref={insightCardRef} options={{ format: 'png', quality: 1.0 }}>
              <View style={insightStyles.card}>
                <View style={insightStyles.header}>
                  <Text style={insightStyles.logo}>vela</Text>
                  <Text style={insightStyles.tagline}>your shift. your terms.</Text>
                </View>
                <View style={insightStyles.phasePill}>
                  <Text style={insightStyles.phaseText}>{pd.glyph} {pd.label}</Text>
                </View>
                <View style={insightStyles.statsRow}>
                  {([
                    { label: 'Day streak', value: String(streak), color: '#C9A84C' },
                    { label: 'Days logged', value: String(history.length), color: '#4A9B8E' },
                    { label: 'Supp adherence', value: suppAdherence() + '%', color: '#7B9E6B' },
                  ] as Array<{label:string,value:string,color:string}>).map(s => (
                    <View key={s.label} style={insightStyles.statBox}>
                      <Text style={[insightStyles.statValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={insightStyles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                {topSymptoms(3).length > 0 && (
                  <View style={insightStyles.section}>
                    <Text style={insightStyles.sectionTitle}>TOP SYMPTOMS THIS MONTH</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {topSymptoms(3).map((s: any) => (
                        <View key={s.symptom} style={insightStyles.symptomPill}>
                          <Text style={insightStyles.symptomText}>{s.symptom} {s.count}x</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {avgNutrients().protein > 0 && (
                  <View style={insightStyles.section}>
                    <Text style={insightStyles.sectionTitle}>AVG DAILY PROTEIN (30 DAYS)</Text>
                    <Text style={insightStyles.bigStat}>{Math.round(avgNutrients().protein)}g</Text>
                  </View>
                )}
                <View style={insightStyles.footer}>
                  <Text style={insightStyles.footerText}>velawellness.com · tracked with vela</Text>
                </View>
              </View>
            </ViewShot>
            <TouchableOpacity delayPressIn={0} onPress={handleShareInsightCard} activeOpacity={0.85}
              style={{ backgroundColor: Colors.plum, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment }}>
                {sharingCard ? 'Preparing...' : 'Share my snapshot ↗'}
              </Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(245,239,230,0.6)', marginTop: 3 }}>Share to Instagram, messages, anywhere</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Supplement Library Modal ── */}
      <Modal visible={showSuppLib} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSuppLib(false)} hardwareAccelerated>
        <SafeAreaView style={{ flex:1, backgroundColor: Colors.cream }} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={styles.modalTitle}>Supplement library</Text>
            <Text allowFontScaling={false} style={{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginTop:2}}>Showing recommendations for {phase ? PHASES[phase]?.label : 'your phase'}</Text>
            <TouchableOpacity delayPressIn={0} onPress={() => setShowSuppLib(false)}>
              <Text allowFontScaling={false} style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal:20, gap:8, paddingVertical:4 }}>
            {Object.entries(CAT_LABELS).map(([cat, lbl]) => (
              <TouchableOpacity delayPressIn={0} key={cat} onPress={() => setSuppCat(cat)} style={[styles.catPill, { borderColor: suppCat===cat?Colors.plum:Colors.parchmentDark, backgroundColor: suppCat===cat?Colors.plum:Colors.cream }]}>
                <Text allowFontScaling={false} style={[styles.catPillText, { color: suppCat===cat?Colors.parchment:Colors.mist }]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView contentContainerStyle={{ padding:20, paddingBottom: 60 }}>
            {(SUPP_LIBRARY as any[]).filter((s:any) => s.category === suppCat && (!s.phase || s.phase.includes(phase ?? 'early'))).map((s:any) => {
              const inR = mySupps.includes(s.id);
              return (
                <View key={s.id} style={styles.suppLibRow}>
                  <View style={{flex:1, minWidth:0}}>
                    <Text allowFontScaling={false} style={styles.suppLibName} numberOfLines={2}>{s.icon} {s.name}</Text>
                    <Text allowFontScaling={false} style={styles.suppLibDose} numberOfLines={1}>{s.dose}</Text>
                    <Text allowFontScaling={false} style={styles.suppLibWhy} numberOfLines={3}>{s.why}</Text>
                  </View>
                  <TouchableOpacity delayPressIn={0} onPress={() => toggleMySupp(s.id)} style={[styles.suppToggleBtn, { borderColor:inR?Colors.rose:Colors.gold, backgroundColor:inR?Colors.rosePale:Colors.goldPale }]}>
                    <Text allowFontScaling={false} style={[styles.suppToggleTxt, { color:inR?Colors.rose:Colors.plum }]}>{inR?'× remove':'✦ add'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={styles.routineSummary}>
              <Text allowFontScaling={false} style={styles.routineLabel}>Your routine ({_mySuppsDataTyped.length})</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:8 }}>
                {_mySuppsDataTyped.map((s:any) => (
                  <View key={s.id} style={styles.suppChip}><Text allowFontScaling={false} style={styles.suppChipText}>{s.name}</Text></View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Affiliate Modal ── */}
      <Modal visible={showAffiliate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAffiliate(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor: Colors.cream }}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={styles.modalTitle}>Vela Creator Program</Text>
            <TouchableOpacity delayPressIn={0} onPress={() => setShowAffiliate(false)}><Text allowFontScaling={false} style={styles.modalClose}>×</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding:20 }}>
            {[
              { title:'30% revenue share', desc:'Earn 30% of every subscription your link generates — for the lifetime of that subscriber.' },
              { title:'6 months free', desc:'Creators with 10K+ followers get 6 months of Vela Premium, no strings attached.' },
              { title:'Creator badge', desc:'A verified Vela Creator badge in-app and in The Shift community.' },
              { title:'Custom link + dashboard', desc:'Your own referral link, live earnings dashboard, and monthly payouts.' },
            ].map((b,i) => (
              <View key={i} style={styles.benefitRow}>
                <Text allowFontScaling={false} style={styles.benefitTitle}>✦ {b.title}</Text>
                <Text allowFontScaling={false} style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
            <View style={styles.linkBox}>
              <Text allowFontScaling={false} style={styles.linkBoxLabel}>Your referral link</Text>
              <Text allowFontScaling={false} style={styles.linkBoxVal}>macpplechic.github.io/vela/support</Text>
            </View>
            <TouchableOpacity delayPressIn={0} style={styles.plumBtn} onPress={() => require('react-native').Linking.openURL('mailto:hellovelawellness@gmail.com?subject=Creator%20Program%20Application')}>
              <Text allowFontScaling={false} style={styles.plumBtnText}>Apply to join ✦</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:Colors.parchment },
  header:{ backgroundColor:Colors.plum, paddingHorizontal:20, paddingTop:8, paddingBottom:14 },
  logoText:{ fontFamily:Fonts.serif, fontSize:24, color:Colors.goldLight, letterSpacing:4 },
  subText:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, letterSpacing:3, textTransform:'uppercase', marginTop:1 },
  scroll:{ flex:1 },
  content:{ padding:20, paddingBottom:100 },
  pageTitle:{ fontFamily:Fonts.serif, fontSize:26, color:Colors.plum, marginBottom:20 },
  sectionTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.plum, marginBottom:12 },
  statsRow:{ flexDirection:'row', gap:8, marginBottom:12 },
  card:{ backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12 },
  cardTitleRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:6 },
  cardTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.plum, marginBottom:4 },
  cardSub:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, marginBottom:14 },
  chevron:{ fontSize:18, color:Colors.mist },
  badgeRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:16},
  badge:{alignItems:'center',width:80,backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.gold,borderRadius:14,padding:10},
  badgeLocked:{borderColor:Colors.parchmentDark,backgroundColor:Colors.parchment,opacity:0.5},
  badgeIcon:{fontSize:20,marginBottom:4},
  badgeLabel:{fontFamily:Fonts.sans,fontSize:9,color:Colors.plum,textAlign:'center',letterSpacing:0.5},
  badgeLabelLocked:{color:Colors.mist},
  badgeSub:{fontFamily:Fonts.sans,fontSize:8,color:Colors.mist,marginTop:1,textAlign:'center'},
  symStatChip:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:Colors.rosePale, borderWidth:0.5, borderColor:Colors.rose, borderRadius:12, paddingVertical:4, paddingHorizontal:10 },
  symStatText:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.rose },
  symStatCount:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.rose },
  monthPill:{ paddingVertical:6, paddingHorizontal:14, borderRadius:20, borderWidth:1 },
  monthPillText:{ fontFamily:Fonts.sans, fontSize:12 },
  emptyHistory:{ alignItems:'center', paddingVertical:24 },
  emptyHistoryText:{ fontFamily:Fonts.serif, fontSize:16, color:Colors.plum, textAlign:'center', marginBottom:8 },
  emptyHistorySubText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, textAlign:'center', lineHeight:18 },
  monthSummary:{ backgroundColor:Colors.parchment, borderRadius:14, padding:16, marginBottom:8 },
  monthStatRow:{ flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
  monthStat:{ alignItems:'center', flex:1 },
  monthStatNum:{ fontFamily:Fonts.sansMedium, fontSize:28, color:Colors.plum },
  monthStatLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, textAlign:'center', marginTop:2, lineHeight:14 },
  monthDivider:{ width:0.5, height:40, backgroundColor:Colors.parchmentDark },
  monthNutrientRow:{ marginTop:12, paddingTop:12, borderTopWidth:0.5, borderTopColor:Colors.parchmentDark },
  monthNutrientText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, textAlign:'center' },
  monthSymLabel:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.plum, letterSpacing:1, textTransform:'uppercase' },
  dayEntry:{ paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  dayEntryDate:{ fontFamily:Fonts.sansMedium, fontSize:12, color:Colors.plum, marginBottom:4 },
  dayEntryBody:{ gap:3 },
  dayEntryLine:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  dayEntryJournal:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, fontStyle:'italic', lineHeight:16, marginTop:2 },
  dayEntryEmpty:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.parchmentDark },
  moduleGrid:{ flexDirection:'row', gap:10, marginBottom:20 },
  moduleCard:{ flex:1, borderWidth:1, borderRadius:18, padding:16, alignItems:'center', minHeight:120 },
  moduleGlyph:{ fontSize:28, marginBottom:6 },
  moduleName:{ fontFamily:Fonts.serif, fontSize:15, color:Colors.plum, marginBottom:4, textAlign:'center' },
  moduleStatus:{ fontFamily:Fonts.sansMedium, fontSize:11 },
  trialBtn:{ borderWidth:1, borderRadius:12, paddingVertical:5, paddingHorizontal:12, marginTop:4 },
  trialBtnText:{ fontFamily:Fonts.sans, fontSize:11 },
  manageBadge:{ borderWidth:1, borderColor:Colors.gold, borderRadius:14, paddingVertical:4, paddingHorizontal:10 },
  manageBadgeText:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold },
  suppChip:{ backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:12, paddingVertical:4, paddingHorizontal:10 },
  suppChipText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.plum },
  plumCard:{ backgroundColor:Colors.plum, borderRadius:20, padding:20, marginBottom:14 },
  plumLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.gold, letterSpacing:3, textTransform:'uppercase', marginBottom:8 },
  plumTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.goldLight, marginBottom:8 },
  plumText:{ fontFamily:Fonts.sans, fontSize:13, color:'rgba(245,239,230,0.7)', lineHeight:20, marginBottom:16 },
  goldOutlineBtn:{ borderWidth:1, borderColor:Colors.gold, borderRadius:14, padding:12, alignItems:'center' },
  goldOutlineBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.gold, letterSpacing:1 },
  symptomsBox:{ backgroundColor:Colors.rosePale, borderRadius:12, padding:12, marginBottom:10, borderWidth:0.5, borderColor:Colors.rose },
  symptomsBoxLabel:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.rose, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  symptomsBoxText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.plum, lineHeight:22 },
  doctorQRow:{ flexDirection:'row', gap:10, paddingVertical:9, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark, alignItems:'flex-start' },
  doctorArrow:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.gold, marginTop:2 },
  doctorQ:{ flex:1, fontFamily:Fonts.sans, fontSize:12, color:Colors.plum, lineHeight:18 },
  doctorNote:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, marginTop:12, lineHeight:17, fontStyle:'italic' },
  phaseCard:{ borderWidth:1.5, borderRadius:18, padding:20, marginBottom:14 },
  phaseLabel:{ fontFamily:Fonts.sansMedium, fontSize:10, letterSpacing:3, textTransform:'uppercase', marginBottom:8 },
  phaseTitle:{ fontFamily:Fonts.serif, fontSize:22, color:Colors.plum, marginBottom:4 },
  phaseDesc:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.mist, marginBottom:16 },
  retakeBtn:{ backgroundColor:Colors.plum, borderRadius:12, padding:12, alignItems:'center' },
  retakeBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.parchment },

  streakCard:{ flexDirection:'row', alignItems:'center', backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12, gap:12 },
  streakCardLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4 },
  streakCardNum:{ fontFamily:Fonts.sansMedium, fontSize:20, color:Colors.plum, marginBottom:2 },
  streakCardSub:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  streakRing:{ width:56, height:56, borderRadius:28, borderWidth:1.5, borderColor:Colors.gold, alignItems:'center', justifyContent:'center', backgroundColor:Colors.goldPale },
  streakRingNum:{ fontFamily:Fonts.sansMedium, fontSize:20, color:Colors.plum },
  streakRingLabel:{ fontFamily:Fonts.sans, fontSize:9, color:Colors.mist },
  notifToggle:{ paddingVertical:8, paddingHorizontal:16, borderRadius:20 },
  footer:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, textAlign:'center', letterSpacing:2, textTransform:'uppercase', paddingVertical:16 },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  modalTitle:{ fontFamily:Fonts.serif, fontSize:22, color:Colors.plum },
  modalClose:{ fontSize:24, color:Colors.mist },
  catRow:{ maxHeight:52 },
  catPill:{ paddingVertical:6, paddingHorizontal:14, borderRadius:20, borderWidth:1 },
  catPillText:{ fontFamily:Fonts.sans, fontSize:11 },
  suppLibRow:{ flexDirection:'row', alignItems:'flex-start', gap:12, paddingVertical:14, flexWrap:'wrap', borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  suppLibName:{ fontFamily:Fonts.sansMedium, fontSize:14, color:Colors.plum, marginBottom:2, flexWrap:'wrap', flex:1 },
  suppLibDose:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, marginBottom:6, flexWrap:'wrap' },
  suppLibWhy:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18, flexWrap:'wrap' },
  suppToggleBtn:{ borderWidth:1.5, borderRadius:20, paddingVertical:10, paddingHorizontal:18, width:90, alignItems:'center', marginTop:2 },
  suppToggleTxt:{ fontFamily:Fonts.sans, fontSize:12 },
  routineSummary:{ backgroundColor:Colors.goldPale, borderRadius:14, padding:14, marginTop:20, borderWidth:0.5, borderColor:Colors.gold },
  routineLabel:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, letterSpacing:1, textTransform:'uppercase' },
  benefitRow:{ paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  benefitTitle:{ fontFamily:Fonts.sansMedium, fontSize:13, color:Colors.plum, marginBottom:3 },
  benefitDesc:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  linkBox:{ backgroundColor:Colors.goldPale, borderRadius:14, padding:16, marginVertical:16, borderWidth:0.5, borderColor:Colors.gold },
  linkBoxLabel:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, letterSpacing:1, textTransform:'uppercase', marginBottom:4 },
  linkBoxVal:{ fontFamily:'monospace', fontSize:14, color:Colors.plum },
  plumBtn:{ backgroundColor:Colors.plum, borderRadius:14, padding:14, alignItems:'center' },
  plumBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.parchment },
});

const insightStyles = StyleSheet.create({
  card: { backgroundColor: '#2D1B4E', borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  logo: { fontFamily: Fonts.serif, fontSize: 28, color: '#C9A84C', letterSpacing: 3 },
  tagline: { fontFamily: Fonts.sans, fontSize: 10, color: 'rgba(245,239,230,0.5)', letterSpacing: 2 },
  phasePill: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 16 },
  phaseText: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(245,239,230,0.8)', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: Fonts.serif, fontSize: 24, marginBottom: 2 },
  statLabel: { fontFamily: Fonts.sans, fontSize: 9, color: 'rgba(245,239,230,0.5)', textAlign: 'center', letterSpacing: 1 },
  section: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 10 },
  sectionTitle: { fontFamily: Fonts.sans, fontSize: 9, color: 'rgba(245,239,230,0.4)', letterSpacing: 2 },
  symptomPill: { backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  symptomText: { fontFamily: Fonts.sans, fontSize: 11, color: '#C9A84C' },
  bigStat: { fontFamily: Fonts.serif, fontSize: 36, color: '#4A9B8E', marginTop: 4 },
  footer: { marginTop: 16, alignItems: 'center' },
  footerText: { fontFamily: Fonts.sans, fontSize: 10, color: 'rgba(245,239,230,0.25)', letterSpacing: 1 },
});
