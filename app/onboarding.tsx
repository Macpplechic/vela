import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    glyph: '◈',
    color: Colors.sage,
    pale: Colors.sagePale ?? '#EEF5EE',
    title: 'Your body is not\nbetraying you.',
    body: 'Perimenopause is one of the most significant hormonal shifts of your life. Vela gives you the tools to understand what\'s happening — and why.',
    feature: 'Daily ritual · Symptom tracking · 90-day patterns',
  },
  {
    glyph: '◎',
    color: Colors.teal,
    pale: Colors.tealPale ?? '#E8F4F2',
    title: 'Track what\nactually matters.',
    body: 'Log food, supplements, symptoms and sleep every day. Vela surfaces patterns so you finally understand what your body is doing.',
    feature: 'The Peri Plate · FluxLog · CoolDown protocols',
  },
  {
    glyph: '✦',
    color: Colors.gold,
    pale: Colors.goldPale ?? '#FDF6E3',
    title: 'Come to every\nappointment prepared.',
    body: 'Generate a beautiful 90-day health report and share it with your doctor. You deserve a thorough conversation.',
    feature: 'Doctor PDF · Symptom history · Nutrition data',
  },
  {
    glyph: '◇',
    color: Colors.plumLight ?? '#7B5EA7',
    pale: '#F3EEF9',
    title: 'You are not\nalone in this.',
    body: 'The Shift connects you with women who are living it too. Share wins, ask questions, find support from a community that gets it.',
    feature: 'The Shift community · Creator program',
  },
];

export default function OnboardingScreen() {
  const { setOnboarded } = useVelaStore();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    setCurrent(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await setOnboarded(true);
    setTimeout(() => router.replace('/quiz'), 100);
  };

  const slide = SLIDES[current];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={handleDone}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* Glyph circle */}
            <View style={[styles.glyphCircle, { backgroundColor: s.pale, borderColor: s.color }]}>
              <Text style={[styles.glyph, { color: s.color }]}>{s.glyph}</Text>
            </View>

            {/* Text */}
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>

            {/* Feature pill */}
            <View style={[styles.featurePill, { backgroundColor: s.pale, borderColor: s.color + '40' }]}>
              <Text style={[styles.featureText, { color: s.color }]}>{s.feature}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot, {
              backgroundColor: i === current ? Colors.plum : Colors.parchmentDark,
              width: i === current ? 24 : 8,
            }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: slide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {current === SLIDES.length - 1 ? 'Start my ritual ✦' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        {current === SLIDES.length - 1 && (
          <Text style={styles.footerNote}>Free to start · No credit card required</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  skip: { alignSelf: 'flex-end', padding: 20 },
  skipText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 20 },
  glyphCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  glyph: { fontSize: 52 },
  title: { fontFamily: Fonts.serif, fontSize: 32, color: Colors.plum, textAlign: 'center', lineHeight: 40, marginBottom: 20 },
  body: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.mist, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  featurePill: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
  featureText: { fontFamily: Fonts.sans, fontSize: 12, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  dot: { height: 8, borderRadius: 4, backgroundColor: Colors.parchmentDark },
  footer: { paddingHorizontal: 32, paddingBottom: 40, alignItems: 'center', gap: 12 },
  nextBtn: { width: '100%', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontFamily: Fonts.sansMedium, fontSize: 16, color: Colors.parchment, letterSpacing: 0.5 },
  footerNote: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist },
});
