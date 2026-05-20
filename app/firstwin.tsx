import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';
import { PHASES, SYMPTOMS } from '../constants/Data';
import { useVelaStore } from '../hooks/useVelaStore';

const QUICK_SYMPTOMS = [
  'Hot flash', 'Night sweat', 'Brain fog', 'Mood swing',
  'Fatigue', 'Insomnia', 'Anxiety', 'Joint pain',
];

export default function FirstWinScreen() {
  const { phase, setSymptoms, symptoms, mySuppsData, checkedSupps, setCheckedSupps, incrementStreak, streak, lastStreakDate } = useVelaStore();
  const [step, setStep] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const pd = PHASES[phase ?? 'late'];

  const toggleSym = (s: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSymptomDone = async () => {
    if (selectedSymptoms.length === 0) { router.replace('/(tabs)/ritual'); return; }
    await setSymptoms(selectedSymptoms);
    await incrementStreak(streak, lastStreakDate);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep(2);
  };

  // Step 0 — Welcome
  if (step === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: Colors.plum }]} edges={['top', 'bottom']}>
        <View style={s.center}>
          <Text style={s.logo}>vela</Text>
          <Text style={s.glyph}>{pd.glyph}</Text>
          <Text style={s.headline}>{'Welcome to\nyour shift.'}</Text>
          <Text style={s.sub}>
            {'Vela works by learning your patterns over time. The more you log, the clearer your picture becomes.'}
          </Text>
          <Text style={s.sub}>
            {'Let\'s do your first log right now. It takes 60 seconds.'}
          </Text>
          <TouchableOpacity delayPressIn={0} style={[s.btn, { backgroundColor: pd.color ?? Colors.teal }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStep(1); }}
            activeOpacity={0.85}>
            <Text style={s.btnText}>Start my first log</Text>
          </TouchableOpacity>
          <TouchableOpacity delayPressIn={0} onPress={() => router.replace('/(tabs)/ritual')} style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(245,239,230,0.4)' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1 — Symptom picker
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.logo2}>vela</Text>
          <Text style={s.stepLabel}>STEP 1 OF 2</Text>
          <Text style={s.stepHeadline}>{'How is your body\nfeeling today?'}</Text>
          <Text style={s.stepSub}>Tap everything that applies right now.</Text>

          <View style={s.symptomGrid}>
            {QUICK_SYMPTOMS.map(sym => {
              const on = selectedSymptoms.includes(sym);
              return (
                <TouchableOpacity delayPressIn={0} key={sym} onPress={() => toggleSym(sym)} activeOpacity={0.8}
                  style={[s.symptomChip, { borderColor: on ? Colors.rose : Colors.parchmentDark, backgroundColor: on ? '#FDECEA' : Colors.cream }]}>
                  <Text style={[s.symptomText, { color: on ? Colors.rose : Colors.mist }]}>{sym}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedSymptoms.length > 0 && (
            <View style={{ backgroundColor: '#FDECEA', borderRadius: 14, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.rose }}>
                {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected — this becomes your first data point.
              </Text>
            </View>
          )}

          <TouchableOpacity delayPressIn={0} style={[s.btn, { backgroundColor: Colors.plum, marginTop: 8 }]}
            onPress={handleSymptomDone} activeOpacity={0.85}>
            <Text style={s.btnText}>
              {selectedSymptoms.length > 0 ? 'Log these symptoms' : 'Skip — nothing today'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2 — First win celebration
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.plum }]} edges={['top', 'bottom']}>
      <View style={s.center}>
        <Text style={s.logo}>vela</Text>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>{'✦'}</Text>
        <Text style={s.headline}>{'Day 1.\nYou showed up.'}</Text>
        <Text style={s.sub}>
          {selectedSymptoms.length > 0
            ? `You logged ${selectedSymptoms.length} symptom${selectedSymptoms.length !== 1 ? 's' : ''}. Every entry makes your patterns clearer.`
            : 'Your journey starts today. Come back tomorrow to build your streak.'}
        </Text>

        <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, width: '100%', marginBottom: 28 }}>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 13, color: 'rgba(245,239,230,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            What to do next
          </Text>
          {[
            { glyph: '◎', tab: 'FluxLog', desc: 'Track your cycle day by day' },
            { glyph: '◇', tab: 'CoolDown', desc: 'Get hot flash relief in 90 seconds' },
            { glyph: '🍽', tab: 'Plate', desc: 'Log food for hormone insights' },
          ].map(item => (
            <View key={item.tab} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, width: 24 }}>{item.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 13, color: 'rgba(245,239,230,0.9)' }}>{item.tab}</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(245,239,230,0.5)', marginTop: 1 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity delayPressIn={0} style={[s.btn, { backgroundColor: Colors.teal }]}
          onPress={() => router.replace('/(tabs)/ritual')} activeOpacity={0.85}>
          <Text style={s.btnText}>Enter Vela</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  logo: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.goldLight, letterSpacing: 4, marginBottom: 24 },
  logo2: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.plum, letterSpacing: 3, marginBottom: 8 },
  glyph: { fontSize: 48, marginBottom: 16 },
  headline: { fontFamily: Fonts.serif, fontSize: 32, color: '#fff', textAlign: 'center', lineHeight: 40, marginBottom: 16 },
  sub: { fontFamily: Fonts.sans, fontSize: 14, color: 'rgba(245,239,230,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  stepLabel: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  stepHeadline: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.plum, lineHeight: 36, marginBottom: 8 },
  stepSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginBottom: 20 },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  symptomChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, borderWidth: 1.5 },
  symptomText: { fontFamily: Fonts.sans, fontSize: 13 },
  btn: { width: '100%', borderRadius: 20, padding: 18, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansMedium, fontSize: 16, color: '#fff' },
});
