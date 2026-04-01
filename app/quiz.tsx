import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts } from '../constants/Colors';
import { PhaseKey } from '../constants/Data';
import { useVelaStore } from '../hooks/useVelaStore';

const QUESTIONS = [
  { q: 'How regular are your cycles?', opts: ['Still regular', 'Occasionally irregular', 'Very irregular / skipping', 'No period for 12+ months'] },
  { q: 'Which best describes your experience?', opts: ['Mood shifts, some irregularity', 'Hot flashes, sleep disruption', 'Intense symptoms, very irregular', 'Post-menopause symptoms'] },
  { q: 'How long have you been noticing changes?', opts: ['Just starting (< 1 year)', '1–3 years', '3+ years', 'Post-menopause'] },
];

const PHASE_MAP: Record<number, Record<number, PhaseKey>> = {
  0: { 0:'early', 1:'early', 2:'late', 3:'post' },
  1: { 0:'early', 1:'late',  2:'late', 3:'post' },
  2: { 0:'early', 1:'early', 2:'late', 3:'post' },
};

export default function QuizScreen() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const { setPhase, setOnboarded } = useVelaStore();

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) { setStep(step + 1); setSelected(null); }
    else {
      const scores: Record<PhaseKey, number> = { early:0, late:0, post:0 };
      newAnswers.forEach((a, i) => { const p = PHASE_MAP[i]?.[a]; if (p) scores[p]++; });
      const detectedPhase: PhaseKey = (Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0] as PhaseKey) ?? 'late';
      await setPhase(detectedPhase);
      await setOnboarded(true);
      router.replace('/(tabs)/ritual');
    }
  };

  const q = QUESTIONS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text allowFontScaling={false} style={styles.logo}>vela</Text>
        <Text allowFontScaling={false} style={styles.stepLabel}>Question {step + 1} of {QUESTIONS.length}</Text>
        <View style={styles.progressTrack}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.progressSegment, { backgroundColor: i <= step ? Colors.gold : Colors.parchmentDark }]} />
          ))}
        </View>
        <Text allowFontScaling={false} style={styles.question}>{q.q}</Text>
        {q.opts.map((opt, i) => (
          <TouchableOpacity key={i} style={[styles.option, selected === i && styles.optionSelected]} onPress={() => setSelected(i)} activeOpacity={0.8}>
            <Text allowFontScaling={false} style={[styles.optionText, selected === i && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.button, selected === null && styles.buttonDisabled]} onPress={handleNext} disabled={selected === null} activeOpacity={0.85}>
          <Text allowFontScaling={false} style={styles.buttonText}>{step < QUESTIONS.length - 1 ? 'Continue →' : 'Reveal my phase →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  container: { flexGrow: 1, padding: 28, paddingTop: 40 },
  logo: { fontFamily: Fonts.serif, fontSize: 26, color: Colors.plum, letterSpacing: 2, marginBottom: 8 },
  stepLabel: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginBottom: 24 },
  progressTrack: { flexDirection: 'row', gap: 6, marginBottom: 36 },
  progressSegment: { flex: 1, height: 2, borderRadius: 2 },
  question: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.plum, lineHeight: 32, marginBottom: 28 },
  option: { padding: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.parchmentDark, backgroundColor: Colors.cream },
  optionSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldPale },
  optionText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.plum },
  optionTextSelected: { color: Colors.plum },
  button: { backgroundColor: Colors.plum, borderRadius: 30, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { backgroundColor: Colors.parchmentDark },
  buttonText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.parchment, letterSpacing: 1 },
});
