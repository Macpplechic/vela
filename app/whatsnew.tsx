/**
 * app/whatsnew.tsx
 * Shown once after updating to 1.1.0.
 * Trigger from root layout by checking AsyncStorage for last seen version.
 */

import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';

const FEATURES = [
  { icon: '✦', title: 'Vela Coach', desc: 'On-device AI reads your data and answers your questions. No cloud. No cost. Your data never leaves your phone.' },
  { icon: '📅', title: 'Pattern calendar', desc: 'Navigate 12 months of symptoms, sleep, and flow in one view. Tap any day for full details.' },
  { icon: '💊', title: 'HRT tracker', desc: 'Log what you take and see how your symptoms change before and after.' },
  { icon: '🦴', title: 'Bone health score', desc: 'Calcium, D3, exercise, and lifestyle rolled into a 0–100 score with DEXA reminders.' },
  { icon: '🧠', title: '6-week CBT program', desc: 'Reduces hot flash distress by up to 50% in clinical trials. Same techniques used in NHS clinics.' },
  { icon: '🤍', title: 'Partner mode', desc: 'Weekly digest for someone you trust — in plain language they can actually understand.' },
  { icon: '🩺', title: 'Doctor prep', desc: 'Select your topics. Get a PDF with talking points and questions, ready to share.' },
  { icon: '📊', title: '90-day trends', desc: 'Symptom frequency, sleep curve, nutrition adherence — all charted over 30, 60, or 90 days.' },
  { icon: '📸', title: 'Photo food logging', desc: 'Snap a meal. Vela identifies every food and fills in your nutrients automatically.' },
  { icon: '❤️', title: 'Apple Health sync', desc: 'Sleep, steps, heart rate, and HRV appear on your dashboard automatically.' },
];

export default function WhatsNewScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.version}>Version 1.1.0</Text>
        <Text style={styles.title}>Your biggest update.</Text>
        <Text style={styles.sub}>10 new features, all built around you.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{f.title}</Text>
              <Text style={styles.rowDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)/ritual');
          }}
        >
          <Text style={styles.btnText}>Explore what's new →</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>New tools are in your Profile tab</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.plum },
  header:    { padding: 28, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  version:   { fontFamily: Fonts.sans, fontSize: 11, color: Colors.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  title:     { fontFamily: Fonts.serif, fontSize: 32, color: Colors.parchment, marginBottom: 6 },
  sub:       { fontFamily: Fonts.sans, fontSize: 14, color: 'rgba(245,239,230,0.6)' },
  row:       { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)', alignItems: 'flex-start' },
  rowIcon:   { fontSize: 22, marginTop: 2 },
  rowTitle:  { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment, marginBottom: 3 },
  rowDesc:   { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(245,239,230,0.6)', lineHeight: 18 },
  footer:    { padding: 24, paddingBottom: 16 },
  btn:       { backgroundColor: Colors.gold, borderRadius: 20, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  btnText:   { fontFamily: Fonts.sansMedium, fontSize: 16, color: Colors.plum },
  footerNote:{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(245,239,230,0.4)', textAlign: 'center' },
});
