import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';
import { PhaseKey } from '../constants/Data';
import { useVelaStore } from '../hooks/useVelaStore';

const QUESTIONS = [
  {
    step: '01',
    q: "What's been happening\nwith your cycle?",
    sub: 'There are no wrong answers here.',
    opts: [
      { text: 'Still regular, but something feels different', sub: 'The classic early sign — everything looks normal but doesn\'t feel it', phase: 'early' },
      { text: 'Irregular — skipping months or unpredictable', sub: 'Cycles changing length, flow, or just disappearing for stretches', phase: 'late' },
      { text: 'Very irregular or barely there anymore', sub: 'Long gaps, very light flow, or wondering if it\'s almost over', phase: 'late' },
      { text: 'No period for 12+ months', sub: 'You\'ve reached menopause — post-menopause begins here', phase: 'post' },
    ],
  },
  {
    step: '02',
    q: "What does your body\nbeen telling you?",
    sub: 'Select everything that resonates.',
    opts: [
      { text: 'Mood shifts, anxiety, brain fog', sub: 'Hormonal changes affect neurotransmitters — this is real, not in your head', phase: 'early' },
      { text: 'Hot flashes, night sweats, sleep problems', sub: 'Your temperature regulation is misfiring — the hallmark of perimenopause', phase: 'late' },
      { text: 'All of the above, intensely', sub: 'Multiple systems affected — your hormones are in significant flux', phase: 'late' },
      { text: 'Dryness, joint pain, low libido', sub: 'Estrogen touches everything — these symptoms are more common post-menopause', phase: 'post' },
    ],
  },
  {
    step: '03',
    q: "How long has this\nbeen building?",
    sub: 'Timing helps us understand your phase.',
    opts: [
      { text: 'Just started — less than a year', sub: 'You\'re likely in the early transition. Data now will be invaluable later.', phase: 'early' },
      { text: 'It\'s been 1–3 years', sub: 'You\'re in it. Patterns are forming. Vela will help you see them.', phase: 'late' },
      { text: 'More than 3 years of changes', sub: 'Deep into perimenopause — your data tells a rich story.', phase: 'late' },
      { text: 'I\'ve crossed into post-menopause', sub: 'Your body has completed the transition. New chapter, new needs.', phase: 'post' },
    ],
  },
];

const PHASE_MAP: Record<string, Record<string, PhaseKey>> = {
  early: 'early', late: 'late', post: 'post',
} as any;

const PHASE_REVEAL: Record<PhaseKey, { glyph: string; label: string; color: string; desc: string; note: string }> = {
  early: {
    glyph: '◈', label: 'Early Perimenopause', color: Colors.sage,
    desc: 'Your hormones are beginning to shift. Estrogen is fluctuating but still present. This is the ideal time to start tracking — patterns that emerge now will guide your care for years.',
    note: 'Most women in early peri are 40–47. You may feel subtle but unmistakable changes.',
  },
  late: {
    glyph: '◎', label: 'Late Perimenopause', color: Colors.rose,
    desc: 'You are in the thick of it. Estrogen is dropping significantly, cycles are irregular, and symptoms are more pronounced. This is the most important time to have data on your side.',
    note: 'Late peri is the most symptomatic phase. Vela was built specifically for this moment.',
  },
  post: {
    glyph: '✦', label: 'Post-Menopause', color: Colors.gold,
    desc: 'You have completed the transition. While many symptoms improve, new considerations emerge — bone density, cardiovascular health, and hormonal balance all deserve attention.',
    note: 'Post-menopause brings its own chapter. Vela helps you navigate it with data.',
  },
};

export default function QuizScreen() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [detectedPhase, setDetectedPhase] = useState<PhaseKey | null>(null);
  const { setPhase, setOnboarded } = useVelaStore();

  const handleSelect = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(i);
  };

  const handleNext = async () => {
    if (selected === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const opt = QUESTIONS[step].opts[selected];
    const newAnswers = [...answers, opt.phase];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      setSelected(null);
    } else {
      // Tally votes
      const scores: Record<string, number> = { early: 0, late: 0, post: 0 };
      newAnswers.forEach(p => { scores[p] = (scores[p] ?? 0) + 1; });
      const phase = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as PhaseKey) ?? 'late';
      setDetectedPhase(phase);
    }
  };

  const handleBegin = async () => {
    if (!detectedPhase) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setPhase(detectedPhase);
    await setOnboarded(true);
    router.replace('/(tabs)/ritual');
  };

  // Phase reveal screen
  if (detectedPhase) {
    const reveal = PHASE_REVEAL[detectedPhase];
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.plum }]} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.revealContainer}>
          <Text allowFontScaling={false} style={styles.revealLogo}>vela</Text>
          <Text allowFontScaling={false} style={styles.revealEyebrow}>YOUR PHASE</Text>
          <Text allowFontScaling={false} style={[styles.revealGlyph, { color: reveal.color }]}>{reveal.glyph}</Text>
          <Text allowFontScaling={false} style={styles.revealLabel}>{reveal.label}</Text>
          <Text allowFontScaling={false} style={styles.revealDesc}>{reveal.desc}</Text>
          <View style={styles.revealNote}>
            <Text allowFontScaling={false} style={styles.revealNoteText}>{reveal.note}</Text>
          </View>
          <Text allowFontScaling={false} style={styles.revealSub}>Vela will now personalize your daily ritual, supplement recommendations, and health insights to your phase.</Text>
          <TouchableOpacity style={[styles.revealBtn, { backgroundColor: reveal.color }]} onPress={handleBegin} activeOpacity={0.85}>
            <Text allowFontScaling={false} style={styles.revealBtnText}>Begin my Vela journey ✦</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setDetectedPhase(null); setStep(0); setSelected(null); setAnswers([]); }} style={{ marginTop: 16 }}>
            <Text allowFontScaling={false} style={styles.retakeText}>This doesn't sound right — retake</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = QUESTIONS[step];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text allowFontScaling={false} style={styles.logo}>vela</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.progressDot,
              i < step && styles.progressDotDone,
              i === step && styles.progressDotActive,
            ]} />
          ))}
        </View>
        <Text allowFontScaling={false} style={styles.stepLabel}>{q.step} of 03</Text>

        <Text allowFontScaling={false} style={styles.question}>{q.q}</Text>
        <Text allowFontScaling={false} style={styles.questionSub}>{q.sub}</Text>

        {q.opts.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, selected === i && styles.optionSelected]}
            onPress={() => handleSelect(i)}
            activeOpacity={0.8}
          >
            <Text allowFontScaling={false} style={[styles.optionText, selected === i && styles.optionTextSelected]}>{opt.text}</Text>
            <Text allowFontScaling={false} style={[styles.optionSub, selected === i && styles.optionSubSelected]}>{opt.sub}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, selected === null && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected === null}
          activeOpacity={0.85}
        >
          <Text allowFontScaling={false} style={styles.buttonText}>
            {step < QUESTIONS.length - 1 ? 'This sounds like me →' : 'Reveal my phase →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  container: { flexGrow: 1, padding: 28, paddingTop: 32, paddingBottom: 48 },
  logo: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.plum, letterSpacing: 3, marginBottom: 24 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.parchmentDark },
  progressDotDone: { backgroundColor: Colors.plum },
  progressDotActive: { width: 24, backgroundColor: Colors.gold },
  stepLabel: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 },
  question: { fontFamily: Fonts.serif, fontSize: 26, color: Colors.plum, lineHeight: 36, marginBottom: 8 },
  questionSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginBottom: 28 },
  option: { padding: 18, marginBottom: 10, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.parchmentDark, backgroundColor: Colors.cream },
  optionSelected: { borderColor: Colors.plum, backgroundColor: '#F0EBF5' },
  optionText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.plum, marginBottom: 4 },
  optionTextSelected: { color: Colors.plum },
  optionSub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, lineHeight: 18 },
  optionSubSelected: { color: '#7A5E88' },
  button: { backgroundColor: Colors.plum, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: Colors.parchmentDark },
  buttonText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment, letterSpacing: 0.5 },
  // Reveal screen
  revealContainer: { flexGrow: 1, padding: 28, paddingTop: 40, alignItems: 'center' },
  revealLogo: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.goldLight, letterSpacing: 4, marginBottom: 40 },
  revealEyebrow: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, marginBottom: 16 },
  revealGlyph: { fontSize: 64, marginBottom: 16 },
  revealLabel: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.parchment, textAlign: 'center', marginBottom: 20 },
  revealDesc: { fontFamily: Fonts.sans, fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  revealNote: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 24, width: '100%' },
  revealNoteText: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20 },
  revealSub: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  revealBtn: { borderRadius: 30, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', width: '100%' },
  revealBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.plum },
  retakeText: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
});
