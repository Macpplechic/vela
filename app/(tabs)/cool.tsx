import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Linking, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

interface Step { label: string; duration: number; instruction: string; color: string; }
interface Protocol { title: string; duration: string; desc: string; emoji: string; steps: Step[]; }

const PROTOCOLS: Protocol[] = [
  {
    title: 'Emergency Cool', duration: '90 sec', emoji: '⚡',
    desc: 'When you need relief RIGHT NOW. A rapid 90-second protocol to interrupt a hot flash in progress.',
    steps: [
      { label: 'Stop', duration: 5, instruction: 'Stop what you are doing. This is your moment.', color: '#7B5EA7' },
      { label: 'Inhale', duration: 4, instruction: 'Deep breath in through your nose', color: '#4A9B8E' },
      { label: 'Exhale', duration: 8, instruction: 'Slow exhale through pursed lips — as slow as you can', color: '#4A9B8E' },
      { label: 'Inhale', duration: 4, instruction: 'In through nose', color: '#4A9B8E' },
      { label: 'Exhale', duration: 8, instruction: 'Out slow — the flash is already peaking', color: '#4A9B8E' },
      { label: 'Inhale', duration: 4, instruction: 'In', color: '#4A9B8E' },
      { label: 'Exhale', duration: 8, instruction: 'Out — feel it passing', color: '#4A9B8E' },
      { label: 'Inhale', duration: 4, instruction: 'In', color: '#4A9B8E' },
      { label: 'Exhale', duration: 8, instruction: 'Out — it is passing', color: '#4A9B8E' },
      { label: 'Inhale', duration: 4, instruction: 'Last one in', color: '#4A9B8E' },
      { label: 'Exhale', duration: 8, instruction: 'Release everything. You made it through.', color: '#7B5EA7' },
      { label: 'Done', duration: 15, instruction: 'You did it. The worst is over. Breathe easy now.', color: '#7B5EA7' },
    ],
  },
  {
    title: '4-7-8 Breath', duration: '4 min', emoji: '🌬',
    desc: 'Inhale 4, hold 7, exhale 8. Activates the parasympathetic nervous system to cool core temperature.',
    steps: [
      { label: 'Settle', duration: 10, instruction: 'Sit comfortably. Close your eyes.', color: '#7B5EA7' },
      ...Array(4).fill(null).flatMap(() => [
        { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4A9B8E' },
        { label: 'Hold', duration: 7, instruction: 'Hold your breath gently', color: '#7B5EA7' },
        { label: 'Exhale', duration: 8, instruction: 'Breathe out completely through your mouth', color: '#B8934A' },
      ]),
      { label: 'Rest', duration: 15, instruction: 'Breathe naturally. Feel the calm.', color: '#7B5EA7' },
    ],
  },
  {
    title: 'Paced Breathing', duration: '5 min', emoji: '〰',
    desc: 'Breathe in for 5 counts, out for 5. Studies show paced breathing reduces hot flash frequency by up to 50%.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Sit comfortably. Place one hand on your chest.', color: '#7B5EA7' },
      ...Array(20).fill(null).map((_, i) => i % 2 === 0
        ? { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' }
        : { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' }
      ),
      { label: 'Rest', duration: 15, instruction: 'Breathe naturally. You did it.', color: '#7B5EA7' },
    ],
  },
  {
    title: 'Box Breathing', duration: '4 min', emoji: '⬜',
    desc: 'Equal counts of inhale, hold, exhale, hold. Used by Navy SEALs for instant stress control.',
    steps: [
      { label: 'Settle', duration: 10, instruction: 'Sit tall. Roll your shoulders back. Close your eyes.', color: '#7B5EA7' },
      ...Array(8).fill(null).flatMap(() => [
        { label: 'Inhale', duration: 4, instruction: 'Breathe in through your nose — 1, 2, 3, 4', color: '#4A9B8E' },
        { label: 'Hold', duration: 4, instruction: 'Hold — 1, 2, 3, 4', color: '#7B5EA7' },
        { label: 'Exhale', duration: 4, instruction: 'Breathe out through your mouth — 1, 2, 3, 4', color: '#B8934A' },
        { label: 'Hold', duration: 4, instruction: 'Hold empty — 1, 2, 3, 4', color: '#7B5EA7' },
      ]),
      { label: 'Rest', duration: 15, instruction: 'Return to natural breath. Feel the stillness.', color: '#7B5EA7' },
    ],
  },
  {
    title: 'Body Scan', duration: '7 min', emoji: '🌊',
    desc: 'A guided journey from head to toe, releasing heat and tension as you go. Deeply restorative.',
    steps: [
      { label: 'Settle', duration: 20, instruction: 'Lie down or sit comfortably. Close your eyes. Let your breath slow.', color: '#7B5EA7' },
      { label: 'Crown', duration: 20, instruction: 'Bring attention to the top of your head. Imagine cool air resting there.', color: '#4A9B8E' },
      { label: 'Face', duration: 20, instruction: 'Soften your forehead, jaw, tongue. Let all expression dissolve.', color: '#4A9B8E' },
      { label: 'Neck', duration: 20, instruction: 'Notice your neck and throat. With each exhale, release tension.', color: '#4A9B8E' },
      { label: 'Shoulders', duration: 25, instruction: 'Feel your shoulders drop. Imagine warmth draining away down your arms.', color: '#4A9B8E' },
      { label: 'Chest', duration: 25, instruction: 'Notice your heartbeat. Each beat is steady, calm, reliable.', color: '#7B5EA7' },
      { label: 'Belly', duration: 25, instruction: 'Feel your belly rise and fall. Let it soften completely.', color: '#4A9B8E' },
      { label: 'Legs', duration: 25, instruction: 'Feel your thighs, knees, calves grow heavy and warm.', color: '#4A9B8E' },
      { label: 'Feet', duration: 20, instruction: 'Bring attention to your feet. Imagine roots growing down, grounding you.', color: '#4A9B8E' },
      { label: 'Whole body', duration: 30, instruction: 'Sense your whole body at once — calm, heavy, cool. You are here.', color: '#7B5EA7' },
      { label: 'Rest', duration: 30, instruction: 'Stay here as long as you need. You did something good for yourself.', color: '#7B5EA7' },
    ],
  },
  {
    title: 'Cold Water Reset', duration: '2 min', emoji: '💧',
    desc: 'Run cold water over your wrists and neck. Rapid cooling of pulse points reduces flush intensity.',
    steps: [
      { label: 'Prepare', duration: 10, instruction: 'Go to a sink with cold water. Take a slow breath.', color: '#4A9B8E' },
      { label: 'Wrists', duration: 30, instruction: 'Run cold water over your inner wrists and pulse points', color: '#4A9B8E' },
      { label: 'Breathe', duration: 10, instruction: 'Breathe slowly while the cool water works', color: '#7B5EA7' },
      { label: 'Neck', duration: 30, instruction: 'Cup cold water and apply to the back of your neck', color: '#4A9B8E' },
      { label: 'Breathe', duration: 10, instruction: 'Keep breathing slowly and steadily', color: '#7B5EA7' },
      { label: 'Face', duration: 20, instruction: 'Splash cold water gently on your face', color: '#4A9B8E' },
      { label: 'Rest', duration: 10, instruction: 'Pat dry and notice the cooling sensation spreading', color: '#B8934A' },
    ],
  },
  {
    title: 'Cooling Visualization', duration: '5 min', emoji: '🌙',
    desc: 'Guide your mind to a cool, peaceful place. Mental imagery lowers perceived temperature.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Close your eyes. Let your breath slow naturally.', color: '#7B5EA7' },
      { label: 'Arrive', duration: 20, instruction: 'Imagine you are standing at the edge of a still, cool lake at dawn.', color: '#4A9B8E' },
      { label: 'Air', duration: 25, instruction: 'Feel the cool morning air on your skin. With each breath in, coolness flows through you.', color: '#4A9B8E' },
      { label: 'Water', duration: 25, instruction: 'Look at the lake — perfectly still, silver, impossibly cool.', color: '#4A9B8E' },
      { label: 'Cool', duration: 30, instruction: 'The cool water rises through your body with each breath. Heat dissolves into the lake.', color: '#4A9B8E' },
      { label: 'Breathe', duration: 30, instruction: 'Breathe in — coolness. Breathe out — heat leaving. You are at peace.', color: '#7B5EA7' },
      { label: 'Return', duration: 20, instruction: 'Begin to return. Bring the coolness with you. You carry it now.', color: '#7B5EA7' },
      { label: 'Rest', duration: 20, instruction: 'Gently open your eyes. You are cooler than when you started.', color: '#4A9B8E' },
    ],
  },
  {
    title: 'Progressive Muscle Release', duration: '6 min', emoji: '✦',
    desc: 'Systematically tense and release muscle groups from feet to face. Releases stored heat and tension.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Sit or lie comfortably. Close your eyes.', color: '#7B5EA7' },
      { label: 'Feet — tense', duration: 5, instruction: 'Curl your toes tightly', color: '#B8934A' },
      { label: 'Feet — release', duration: 10, instruction: 'Let your feet go completely loose', color: '#4A9B8E' },
      { label: 'Calves — tense', duration: 5, instruction: 'Flex your calf muscles hard', color: '#B8934A' },
      { label: 'Calves — release', duration: 10, instruction: 'Release and feel the warmth flow out', color: '#4A9B8E' },
      { label: 'Thighs — tense', duration: 5, instruction: 'Squeeze your thigh muscles', color: '#B8934A' },
      { label: 'Thighs — release', duration: 10, instruction: 'Let them drop completely', color: '#4A9B8E' },
      { label: 'Hands — tense', duration: 5, instruction: 'Make tight fists', color: '#B8934A' },
      { label: 'Hands — release', duration: 10, instruction: 'Open your hands and let them go limp', color: '#4A9B8E' },
      { label: 'Shoulders — tense', duration: 5, instruction: 'Raise your shoulders to your ears', color: '#B8934A' },
      { label: 'Shoulders — release', duration: 10, instruction: 'Drop them completely and feel the release', color: '#4A9B8E' },
      { label: 'Face — tense', duration: 5, instruction: 'Scrunch your whole face tight', color: '#B8934A' },
      { label: 'Face — release', duration: 15, instruction: 'Let every muscle in your face go soft', color: '#4A9B8E' },
      { label: 'Rest', duration: 20, instruction: 'Breathe naturally. Feel the stillness.', color: '#7B5EA7' },
    ],
  },
];

// ── Animated breathing orb ──────────────────────────────────
function BreathOrb({ phase, color }: { phase: string; color: string }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const toScale = phase === 'Inhale' ? 1.3 : phase === 'Hold' ? 1.3 : 0.7;
    const toOpacity = phase === 'Inhale' ? 1 : phase === 'Hold' ? 0.9 : 0.6;
    Animated.parallel([
      Animated.timing(scale, { toValue: toScale, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(opacity, { toValue: toOpacity, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [phase]);

  return (
    <Animated.View style={{
      width: 160, height: 160, borderRadius: 80,
      backgroundColor: color,
      transform: [{ scale }],
      opacity,
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: Fonts.serif, fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{phase}</Text>
    </Animated.View>
  );
}

// ── Protocol Timer ──────────────────────────────────────────
function ProtocolTimer({ protocol, onClose, onComplete }: { protocol: Protocol; onClose: () => void; onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(protocol.steps[0].duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(1)).current;
  const currentStep = protocol.steps[stepIndex];

  useEffect(() => {
    if (!running || done) return;
    if (secondsLeft <= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (stepIndex < protocol.steps.length - 1) {
        const next = stepIndex + 1;
        setStepIndex(next);
        setSecondsLeft(protocol.steps[next].duration);
        progress.setValue(1);
        Animated.timing(progress, { toValue: 0, duration: protocol.steps[next].duration * 1000, useNativeDriver: false }).start();
      } else {
        setDone(true);
        setRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
      }
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, running, stepIndex, done]);

  const handleStart = () => {
    if (done) {
      setStepIndex(0);
      setSecondsLeft(protocol.steps[0].duration);
      setDone(false);
      setRunning(true);
      progress.setValue(1);
      Animated.timing(progress, { toValue: 0, duration: protocol.steps[0].duration * 1000, useNativeDriver: false }).start();
      return;
    }
    if (!running) {
      setRunning(true);
      Animated.timing(progress, { toValue: 0, duration: secondsLeft * 1000, useNativeDriver: false }).start();
    }
  };

  const bgColor = done ? '#4A9B8E' : currentStep.color;

  return (
    <SafeAreaView style={[ts.container, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
      <TouchableOpacity delayPressIn={0} onPress={onClose} style={ts.closeBtn} activeOpacity={0.7}>
        <Text style={ts.closeTxt}>✕  Close</Text>
      </TouchableOpacity>
      <Text style={ts.protocolEmoji}>{protocol.emoji}</Text>
      <Text style={ts.protocolName}>{protocol.title}</Text>
      <Text style={ts.stepCount}>{done ? 'Session complete ✦' : `Step ${stepIndex + 1} of ${protocol.steps.length}`}</Text>

      <View style={{ marginVertical: 32, alignItems: 'center' }}>
        {done ? (
          <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 48 }}>✦</Text>
          </View>
        ) : (
          <BreathOrb phase={currentStep.label} color="rgba(255,255,255,0.25)" />
        )}
      </View>

      {!done && (
        <>
          <Text style={ts.instruction}>{currentStep.instruction}</Text>
          <Text style={ts.timer}>{secondsLeft}</Text>
          <View style={ts.progressTrack}>
            <Animated.View style={[ts.progressFill, {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: 'rgba(255,255,255,0.8)',
            }]} />
          </View>
          <View style={ts.dots}>
            {protocol.steps.map((_, i) => (
              <View key={i} style={[ts.dot, i === stepIndex && ts.dotActive, i < stepIndex && ts.dotDone]} />
            ))}
          </View>
        </>
      )}

      {done && (
        <Text style={ts.doneMsg}>You showed up for yourself.{'\n'}That matters.</Text>
      )}

      <TouchableOpacity delayPressIn={0} style={ts.actionBtn} onPress={handleStart} activeOpacity={0.85}>
        <Text style={ts.actionBtnTxt}>
          {done ? 'Do it again' : stepIndex === 0 && secondsLeft === protocol.steps[0].duration ? 'Begin session' : 'Resume'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  closeBtn: { position: 'absolute', top: 60, left: 24, padding: 8 },
  closeTxt: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  protocolEmoji: { fontSize: 32, marginBottom: 8 },
  protocolName: { fontFamily: Fonts.serif, fontSize: 26, color: '#fff', marginBottom: 4, textAlign: 'center' },
  stepCount: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  instruction: { fontFamily: Fonts.sans, fontSize: 16, color: '#fff', textAlign: 'center', lineHeight: 24, marginBottom: 16, paddingHorizontal: 16 },
  timer: { fontFamily: Fonts.serif, fontSize: 56, color: '#fff', textAlign: 'center', marginBottom: 16 },
  progressTrack: { width: '80%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  dots: { flexDirection: 'row', gap: 5, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#fff', width: 10 },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.6)' },
  doneMsg: { fontFamily: Fonts.serif, fontSize: 18, color: '#fff', textAlign: 'center', lineHeight: 28, marginBottom: 32, paddingHorizontal: 16 },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  actionBtnTxt: { fontFamily: Fonts.sansMedium, fontSize: 16, color: '#fff', letterSpacing: 0.5 },
});

// ── Main CoolDown Screen ────────────────────────────────────
export default function CoolScreen() {
  const { coolActive, unlockCool, startCoolTrial, startBundleTrial, unlockBundle, bundleActive } = useVelaStore();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runningProtocol, setRunningProtocol] = useState<Protocol | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<number | null>(null);
  const [coolTab, setCoolTab] = useState<'breathe' | 'log' | 'tips' | 'stats'>('breathe');
  const [sessionCount, setSessionCount] = useState(0);
  const [hotFlashCount, setHotFlashCount] = useState(0);
  const [trialStarted, setTrialStarted] = useState(false);

  useEffect(() => {
    Purchases.configure({ apiKey: RC_API_KEY });
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        let found: PurchasesPackage | null = offerings.all['cooldown']?.availablePackages[0] ?? null;
        if (!found) found = offerings.current?.availablePackages.find(p => p.product.identifier === 'com.velawellness.app.cooldown_monthly') ?? null;
        if (found != null) setPkg(found as PurchasesPackage);
      } catch {}
    })();
    if (coolActive) {
      // Alert.alert removed
    }
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setLoading(true);
    try {
      await Purchases.purchasePackage(pkg as PurchasesPackage);
      await unlockCool();
    } catch {}
    setLoading(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['cooldown']) await unlockCool();
    } catch {}
    setLoading(false);
  };

  const handleTrial = async () => {
    setTrialStarted(true);
    await startBundleTrial();
  };

  if (runningProtocol) {
    return (
      <ProtocolTimer
        protocol={runningProtocol}
        onClose={() => setRunningProtocol(null)}
        onComplete={() => { setSessionCount(s => s + 1); setRunningProtocol(null); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

        {/* ── Page header ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.pageTitle}>CoolDown ◇</Text>
          <Text style={styles.pageSub}>Science-backed protocols for hot flash relief</Text>
          {coolActive && sessionCount > 0 && (
            <View style={{ backgroundColor: Colors.tealPale, borderRadius: 12, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🌬</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.teal }}>
                {sessionCount} session{sessionCount !== 1 ? 's' : ''} completed · {sessionCount * 5} min of relief
              </Text>
            </View>
          )}
        </View>

        {/* ── Tab bar (subscribers only) ── */}
        {coolActive && (
          <View style={{ flexDirection: 'row', backgroundColor: Colors.parchmentDark, borderRadius: 30, padding: 3, marginBottom: 16 }}>
            {(['breathe', 'log', 'tips', 'stats'] as const).map(t => {
              const labels: Record<string, string> = { breathe: '🌬 Breathe', log: '🔥 Log', tips: '💡 Tips', stats: '📊 Stats' };
              return (
                <TouchableOpacity delayPressIn={0} key={t} onPress={() => setCoolTab(t)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 28, alignItems: 'center', backgroundColor: coolTab === t ? Colors.teal : 'transparent' }}>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: coolTab === t ? Colors.parchment : Colors.mist }}>{labels[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Breathe tab / default ── */}
        {(!coolActive || coolTab === 'breathe') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your protocols</Text>
            <Text style={styles.cardSub}>Choose what your body needs right now</Text>
            {PROTOCOLS.map((p, i) => (
              <TouchableOpacity delayPressIn={0} key={p.title}
                style={[styles.protocolCard, activeProtocol === i && styles.protocolCardActive]}
                onPress={() => setActiveProtocol(activeProtocol === i ? null : i)}
                activeOpacity={0.8}>
                <View style={styles.protocolHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.protocolTitle}>{p.title}</Text>
                      <Text style={styles.protocolDuration}>{p.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.protocolChevron}>{activeProtocol === i ? '▲' : '▽'}</Text>
                </View>
                {activeProtocol === i && <Text style={styles.protocolDesc}>{p.desc}</Text>}
                {coolActive && (
                  <TouchableOpacity delayPressIn={0} style={styles.startBtn} activeOpacity={0.85}
                    onPress={() => { setRunningProtocol(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={styles.startBtnText}>▶  Begin guided session</Text>
                  </TouchableOpacity>
                )}
                {!coolActive && activeProtocol === i && (
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 8, fontStyle: 'italic' }}>
                    Subscribe to unlock guided sessions
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Hot Flash Log tab ── */}
        {coolActive && coolTab === 'log' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔥 Hot Flash Tracker</Text>
            <Text style={styles.cardSub}>Tap each time you have a hot flash to track your patterns</Text>
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              <TouchableOpacity delayPressIn={0}
                onPress={() => { setHotFlashCount(c => c + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
                style={{ width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.rose, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.rose, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
                <Text style={{ fontSize: 44 }}>🔥</Text>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: '#fff', marginTop: 4 }}>Log it</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.serif, fontSize: 48, color: Colors.rose }}>{hotFlashCount}</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>hot flashes today</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.serif, fontSize: 48, color: Colors.teal }}>{sessionCount}</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>relief sessions</Text>
              </View>
            </View>
            {hotFlashCount > 0 && (
              <TouchableOpacity delayPressIn={0} onPress={() => setHotFlashCount(0)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>Reset today</Text>
              </TouchableOpacity>
            )}
            <View style={{ backgroundColor: Colors.tealPale, borderRadius: 12, padding: 12, marginTop: 8 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.teal, lineHeight: 18 }}>
                After logging a hot flash, go to the Breathe tab and start Emergency Cool for immediate relief.
              </Text>
            </View>
          </View>
        )}

        {/* ── Tips tab ── */}
        {coolActive && coolTab === 'tips' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Evidence-Based Tips</Text>
            <Text style={styles.cardSub}>What the research says actually works</Text>
            <View style={{ gap: 0, marginTop: 12 }}>
              {[
                { emoji: '🌬', tip: 'Paced breathing (6 breaths/min) reduces hot flash frequency by up to 50% — use CoolDown daily' },
                { emoji: '🧊', tip: 'Sipping cold water at onset can reduce intensity. Keep a cold bottle nearby at all times' },
                { emoji: '👗', tip: 'Dress in layers you can remove quickly. Natural fabrics breathe better than synthetics' },
                { emoji: '🌡', tip: 'Keep your bedroom at 65-68°F. A cooler sleep environment dramatically reduces night sweats' },
                { emoji: '☕', tip: 'Caffeine and alcohol are common triggers. Track yours in FluxLog to find your patterns' },
                { emoji: '🧘', tip: 'Chronic stress amplifies hot flashes. Even 5 minutes of breathing daily makes a measurable difference' },
                { emoji: '🥗', tip: 'Phytoestrogen-rich foods — soy, flaxseed, chickpeas — may reduce frequency for some women' },
                { emoji: '💊', tip: 'Magnesium glycinate before bed can reduce night sweats. Ask your doctor about dosing' },
                { emoji: '🚶', tip: 'Regular moderate exercise (not intense) reduces hot flash frequency over time' },
                { emoji: '🌸', tip: 'Evening primrose oil and black cohosh have evidence for some women — discuss with your provider' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark }}>
                  <Text style={{ fontSize: 20, marginTop: 1 }}>{item.emoji}</Text>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, flex: 1, lineHeight: 19 }}>{item.tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Stats tab ── */}
        {coolActive && coolTab === 'stats' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Your CoolDown Stats</Text>
            <Text style={styles.cardSub}>Your progress at a glance</Text>
            <View style={{ gap: 0, marginTop: 12 }}>
              {[
                { label: 'Breathing sessions completed', value: sessionCount, color: Colors.teal, emoji: '🌬' },
                { label: 'Hot flashes logged today', value: hotFlashCount, color: Colors.rose, emoji: '🔥' },
                { label: 'Minutes of relief delivered', value: sessionCount * 5, color: Colors.sage, emoji: '⏱' },
                { label: 'Protocols available', value: PROTOCOLS.length, color: Colors.gold, emoji: '◇' },
              ].map(stat => (
                <View key={stat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark }}>
                  <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>{stat.label}</Text>
                    <Text style={{ fontFamily: Fonts.serif, fontSize: 32, color: stat.color }}>{stat.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: Colors.tealPale, borderRadius: 12, padding: 12, marginTop: 12 }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.teal }}>
                {sessionCount === 0
                  ? '✦ Complete your first breathing session to start tracking your progress'
                  : `✦ ${sessionCount} session${sessionCount !== 1 ? 's' : ''} done. Consistency is everything — you are building a real habit.`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Paywall ── */}
        {!coolActive && (
          <View style={styles.paywallCard}>

            <View style={{ backgroundColor: Colors.gold, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 14 }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.plum }}>BEST VALUE — SAVE 17%</Text>
            </View>

            <Text style={styles.paywallHeadline}>
              Everything your body{'\n'}needs. One subscription.
            </Text>
            <Text style={styles.paywallSub}>
              Vela Full Access unlocks CoolDown and FluxLog together — hot flash protocols, cycle tracking, pattern insights, and guided breathing.
            </Text>

            <View style={{ gap: 10, marginBottom: 20 }}>
              {[
                { emoji: '⚡', text: 'Emergency Cool — interrupt a flash in 90 seconds' },
                { emoji: '🌬', text: '8 guided breathing protocols' },
                { emoji: '◎', text: 'FluxLog — cycle + symptom tracking' },
                { emoji: '📊', text: 'Stats, trends and phase tips' },
                { emoji: '💡', text: 'Evidence-based tips that actually work' },
              ].map(f => (
                <View key={f.text} style={styles.featureRow}>
                  <Text style={{ fontSize: 14, width: 22 }}>{f.emoji}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' }}>FluxLog + CoolDown separately</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' }}>$9.98/mo</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: '#fff' }}>Vela Full Access</Text>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.gold }}>$8.99/mo</Text>
              </View>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>4,200+ women · Paced breathing reduces hot flashes by up to 50%</Text>
            </View>

            <TouchableOpacity delayPressIn={0} style={styles.trialBtn} onPress={handleTrial} activeOpacity={0.85}>
              <Text style={styles.trialBtnTitle}>Try free for 7 days</Text>
              <Text style={styles.trialBtnSub}>Full access · No card required · Cancel anytime</Text>
            </TouchableOpacity>

            <TouchableOpacity delayPressIn={0} onPress={async () => { setLoading(true); try { if (pkg) { await Purchases.purchasePackage(pkg as PurchasesPackage); await unlockCool(); } } catch {} setLoading(false); }} activeOpacity={0.7}
              style={{ alignItems: 'center', paddingVertical: 10, marginBottom: 4 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Just CoolDown — $4.99/mo</Text>
            </TouchableOpacity>

            <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 8 }}>
              $8.99/month after trial · Auto-renews · Cancel anytime in Apple ID settings
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: '#A8D8E8', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://macpplechic.github.io/vela/terms')}>Terms</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: '#A8D8E8', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://macpplechic.github.io/vela/privacy')}>Privacy</Text>
            </View>
            <TouchableOpacity delayPressIn={0} style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
              <Text style={styles.restoreTxt}>Already subscribed? Restore access</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  logoText: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.plum },
  subText: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, letterSpacing: 0.5 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  pageTitle: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.plum },
  pageSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginTop: 2 },
  card: { backgroundColor: Colors.cream, borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.plum, marginBottom: 2 },
  cardSub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginBottom: 4 },
  protocolCard: { backgroundColor: Colors.parchment, borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1.5, borderColor: Colors.parchmentDark },
  protocolCardActive: { borderColor: Colors.teal, backgroundColor: '#EBF7F6' },
  protocolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  protocolTitle: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.plum },
  protocolDuration: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  protocolChevron: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist },
  protocolDesc: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, lineHeight: 18, marginTop: 10, marginBottom: 4 },
  startBtn: { backgroundColor: Colors.plum, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'stretch', marginTop: 12, alignItems: 'center' },
  startBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.parchment, letterSpacing: 0.5 },
  paywallCard: { backgroundColor: Colors.plum, borderRadius: 24, padding: 24, marginBottom: 14 },
  paywallHeadline: { fontFamily: Fonts.serif, fontSize: 22, color: '#fff', marginBottom: 12, lineHeight: 30 },
  paywallSub: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 },
  socialProof: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 18 },
  trialBtn: { backgroundColor: Colors.teal, borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  trialBtnTitle: { fontFamily: Fonts.sansMedium, fontSize: 17, color: Colors.cream, marginBottom: 3 },
  trialBtnSub: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreTxt: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
