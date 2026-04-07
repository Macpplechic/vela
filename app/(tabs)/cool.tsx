import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

interface Step {
  label: string;
  duration: number; // seconds
  instruction: string;
  color: string;
}

interface Protocol {
  title: string;
  duration: string;
  desc: string;
  steps: Step[];
}

const PROTOCOLS: Protocol[] = [
  {
    title: '4-7-8 Breath',
    duration: '4 min',
    desc: 'Inhale 4 counts, hold 7, exhale 8. Activates the parasympathetic nervous system to cool core temperature.',
    steps: [
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4A9B8E' },
      { label: 'Hold', duration: 7, instruction: 'Hold your breath gently', color: '#7B5EA7' },
      { label: 'Exhale', duration: 8, instruction: 'Breathe out completely through your mouth', color: '#B8934A' },
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4A9B8E' },
      { label: 'Hold', duration: 7, instruction: 'Hold your breath gently', color: '#7B5EA7' },
      { label: 'Exhale', duration: 8, instruction: 'Breathe out completely through your mouth', color: '#B8934A' },
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4A9B8E' },
      { label: 'Hold', duration: 7, instruction: 'Hold your breath gently', color: '#7B5EA7' },
      { label: 'Exhale', duration: 8, instruction: 'Breathe out completely through your mouth', color: '#B8934A' },
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose', color: '#4A9B8E' },
      { label: 'Hold', duration: 7, instruction: 'Hold your breath gently', color: '#7B5EA7' },
      { label: 'Exhale', duration: 8, instruction: 'Breathe out completely through your mouth', color: '#B8934A' },
    ],
  },
  {
    title: 'Cold Water Reset',
    duration: '2 min',
    desc: 'Run cold water over your wrists and back of neck. Rapid cooling of pulse points reduces flush intensity.',
    steps: [
      { label: 'Prepare', duration: 10, instruction: 'Go to a sink with cold water. Take a slow breath.', color: '#4A9B8E' },
      { label: 'Wrists', duration: 30, instruction: 'Run cold water over your inner wrists and pulse points', color: '#4A9B8E' },
      { label: 'Breathe', duration: 10, instruction: 'Breathe slowly while the cool water works', color: '#7B5EA7' },
      { label: 'Neck', duration: 30, instruction: 'Cup cold water and apply to the back of your neck', color: '#4A9B8E' },
      { label: 'Breathe', duration: 10, instruction: 'Keep breathing slowly and steadily', color: '#7B5EA7' },
      { label: 'Face', duration: 20, instruction: 'Splash cold water gently on your face if comfortable', color: '#4A9B8E' },
      { label: 'Rest', duration: 10, instruction: 'Pat dry and notice the cooling sensation spreading', color: '#B8934A' },
    ],
  },
  {
    title: 'Progressive Muscle Release',
    duration: '6 min',
    desc: 'Systematically tense and release muscle groups from feet to face. Releases stored heat and tension.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Sit or lie comfortably. Close your eyes.', color: '#7B5EA7' },
      { label: 'Feet — tense', duration: 5, instruction: 'Curl your toes tightly', color: '#B8934A' },
      { label: 'Feet — release', duration: 10, instruction: 'Let your feet go completely loose', color: '#4A9B8E' },
      { label: 'Calves — tense', duration: 5, instruction: 'Flex your calf muscles hard', color: '#B8934A' },
      { label: 'Calves — release', duration: 10, instruction: 'Release and feel the warmth flow out', color: '#4A9B8E' },
      { label: 'Thighs — tense', duration: 5, instruction: 'Squeeze your thigh muscles', color: '#B8934A' },
      { label: 'Thighs — release', duration: 10, instruction: 'Let them drop completely', color: '#4A9B8E' },
      { label: 'Abdomen — tense', duration: 5, instruction: 'Pull your belly in tightly', color: '#B8934A' },
      { label: 'Abdomen — release', duration: 10, instruction: 'Let your belly soften completely', color: '#4A9B8E' },
      { label: 'Hands — tense', duration: 5, instruction: 'Make tight fists', color: '#B8934A' },
      { label: 'Hands — release', duration: 10, instruction: 'Open your hands and let them go limp', color: '#4A9B8E' },
      { label: 'Shoulders — tense', duration: 5, instruction: 'Raise your shoulders to your ears', color: '#B8934A' },
      { label: 'Shoulders — release', duration: 10, instruction: 'Drop them completely and feel the release', color: '#4A9B8E' },
      { label: 'Face — tense', duration: 5, instruction: 'Scrunch your whole face tight', color: '#B8934A' },
      { label: 'Face — release', duration: 15, instruction: 'Let every muscle in your face go soft', color: '#4A9B8E' },
      { label: 'Rest', duration: 20, instruction: 'Breathe naturally. Feel the stillness.', color: '#7B5EA7' },
    ],
  },
  {
    title: 'Paced Breathing',
    duration: '5 min',
    desc: 'Breathe in for 5 counts, out for 5. Studies show paced breathing reduces hot flash frequency by up to 50%.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Sit comfortably. Place one hand on your chest.', color: '#7B5EA7' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' },
      { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' },
      { label: 'Rest', duration: 15, instruction: 'Breathe naturally. You did it.', color: '#7B5EA7' },
    ],
  },
];

function ProtocolTimer({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(protocol.steps[0].duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(1)).current;

  const currentStep = protocol.steps[stepIndex];
  const totalSteps = protocol.steps.length;

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (stepIndex < totalSteps - 1) {
        const next = stepIndex + 1;
        setStepIndex(next);
        setSecondsLeft(protocol.steps[next].duration);
        progress.setValue(1);
        Animated.timing(progress, { toValue: 0, duration: protocol.steps[next].duration * 1000, useNativeDriver: false }).start();
      } else {
        setRunning(false);
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, secondsLeft, stepIndex]);

  const handleStart = () => {
    setRunning(true);
    progress.setValue(1);
    Animated.timing(progress, { toValue: 0, duration: currentStep.duration * 1000, useNativeDriver: false }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReset = () => {
    setRunning(false);
    setDone(false);
    setStepIndex(0);
    setSecondsLeft(protocol.steps[0].duration);
    progress.setValue(1);
  };

  const bgColor = currentStep.color + '22';

  return (
    <View style={timerStyles.container}>
      <TouchableOpacity style={timerStyles.closeBtn} onPress={onClose}>
        <Text style={timerStyles.closeTxt}>✕ Close</Text>
      </TouchableOpacity>

      <Text style={timerStyles.protocolName}>{protocol.title}</Text>
      <Text style={timerStyles.stepCount}>{done ? 'Complete' : `Step ${stepIndex + 1} of ${totalSteps}`}</Text>

      {/* Circle timer */}
      <View style={[timerStyles.circle, { backgroundColor: bgColor, borderColor: currentStep.color }]}>
        {done ? (
          <Text style={timerStyles.doneGlyph}>✦</Text>
        ) : (
          <>
            <Text style={[timerStyles.countdown, { color: currentStep.color }]}>{secondsLeft}</Text>
            <Text style={timerStyles.stepLabel}>{currentStep.label}</Text>
          </>
        )}
      </View>

      {/* Progress bar */}
      {!done && (
        <View style={timerStyles.progressTrack}>
          <Animated.View style={[timerStyles.progressFill, {
            backgroundColor: currentStep.color,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      )}

      {/* Instruction */}
      <View style={[timerStyles.instructionBox, { backgroundColor: bgColor }]}>
        <Text style={[timerStyles.instruction, { color: done ? Colors.sage : currentStep.color }]}>
          {done ? 'Well done. Your nervous system has been reset.' : currentStep.instruction}
        </Text>
      </View>

      {/* Step dots */}
      <View style={timerStyles.dots}>
        {protocol.steps.map((_, i) => (
          <View key={i} style={[timerStyles.dot, {
            backgroundColor: i < stepIndex ? Colors.sage : i === stepIndex ? currentStep.color : Colors.parchmentDark,
            width: i === stepIndex ? 10 : 6,
            height: i === stepIndex ? 10 : 6,
          }]} />
        ))}
      </View>

      {/* Action button */}
      {done ? (
        <TouchableOpacity style={[timerStyles.actionBtn, { backgroundColor: Colors.sage }]} onPress={handleReset}>
          <Text style={timerStyles.actionBtnTxt}>Do it again</Text>
        </TouchableOpacity>
      ) : running ? (
        <TouchableOpacity style={[timerStyles.actionBtn, { backgroundColor: Colors.parchmentDark }]} onPress={() => { setRunning(false); progress.stopAnimation(); }}>
          <Text style={[timerStyles.actionBtnTxt, { color: Colors.mist }]}>Pause</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[timerStyles.actionBtn, { backgroundColor: currentStep.color }]} onPress={handleStart} activeOpacity={0.85}>
          <Text style={timerStyles.actionBtnTxt}>{stepIndex === 0 && secondsLeft === protocol.steps[0].duration ? 'Begin' : 'Resume'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center', padding: 30 },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 8 },
  closeTxt: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist },
  protocolName: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.plum, marginBottom: 4, textAlign: 'center' },
  stepCount: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 },
  circle: { width: 180, height: 180, borderRadius: 90, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  countdown: { fontFamily: Fonts.sansMedium, fontSize: 56, lineHeight: 64 },
  stepLabel: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginTop: 4 },
  doneGlyph: { fontSize: 48, color: Colors.sage },
  progressTrack: { width: '100%', height: 4, backgroundColor: Colors.parchmentDark, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  instructionBox: { borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  instruction: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center', marginBottom: 32 },
  dot: { borderRadius: 5 },
  actionBtn: { borderRadius: 30, paddingVertical: 14, paddingHorizontal: 40 },
  actionBtnTxt: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment, letterSpacing: 0.5 },
});

export default function CoolScreen() {
  const { coolActive, unlockCool } = useVelaStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<number | null>(null);
  const [runningProtocol, setRunningProtocol] = useState<Protocol | null>(null);

  useEffect(() => { loadOffering(); }, []);

  const loadOffering = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      let found = null;
      const allOfferings = Object.values(offerings.all);
      for (const offering of allOfferings) {
        const match = offering.availablePackages.find(
          p => p.product.identifier === 'com.velawellness.app.cooldown_monthly'
        );
        if (match) { found = match; break; }
      }
      if (!found) found = offerings.current?.availablePackages.find(
        p => p.product.identifier === 'com.velawellness.app.cooldown_monthly'
      ) ?? null;
      if (found) setPkg(found);
    } catch (e) { console.log('Offerings error:', e); }
  };

  const handlePurchase = async () => {
    if (!pkg) { Alert.alert('Not available', 'Purchase unavailable right now. Try again later.'); return; }
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await unlockCool();
      setShowPaywall(false);
      Alert.alert('Welcome to CoolDown ◇', 'Your hot flash protocols are now unlocked.');
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['cooldown']) {
        await unlockCool();
        setShowPaywall(false);
        Alert.alert('Restored', 'Your CoolDown access has been restored.');
      } else { Alert.alert('Nothing to restore', 'No previous CoolDown purchase found.'); }
    } catch (e: any) { Alert.alert('Restore failed', e.message ?? 'Could not restore purchases.');
    } finally { setLoading(false); }
  };

  const price = pkg?.product.priceString ?? '$4.99';

  // Show guided timer modal
  if (runningProtocol) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ProtocolTimer protocol={runningProtocol} onClose={() => setRunningProtocol(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>CoolDown ◇</Text>
        <Text style={styles.pageSub}>Science-backed protocols for hot flash relief.</Text>
        {coolActive ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Choose your protocol</Text>
              <Text style={styles.cardSub}>Each technique is clinically validated for symptom relief.</Text>
            </View>
            {PROTOCOLS.map((p, i) => (
              <TouchableOpacity key={p.title} style={[styles.protocolCard, activeProtocol===i && styles.protocolCardActive]} onPress={() => setActiveProtocol(activeProtocol===i ? null : i)} activeOpacity={0.8}>
                <View style={styles.protocolHeader}>
                  <View style={{ flex:1 }}>
                    <Text style={styles.protocolTitle}>{p.title}</Text>
                    <Text style={styles.protocolDuration}>{p.duration}</Text>
                  </View>
                  <Text style={styles.protocolChevron}>{activeProtocol===i ? '▲' : '▽'}</Text>
                </View>
                {activeProtocol===i && <Text style={styles.protocolDesc}>{p.desc}</Text>}
                {activeProtocol===i && (
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.85}
                    onPress={(e) => {
                      e.stopPropagation();
                      setRunningProtocol(p);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <Text style={styles.startBtnText}>▶  Start guided session</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <View style={styles.lockedCard}>
              <Text style={styles.lockedGlyph}>◇</Text>
              <Text style={styles.lockedTitle}>CoolDown is a premium feature</Text>
              <Text style={styles.lockedSub}>Science-backed breathwork, cooling techniques, and muscle release protocols — designed to interrupt and reduce hot flash intensity.</Text>
              <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
                <Text style={styles.unlockBtnText}>Unlock CoolDown · {price}/month</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.featureList}>
              {['◇  4 clinically validated protocols','◇  Guided breathwork sequences','◇  Progressive muscle release','◇  Hot flash frequency tracker'].map(f => (
                <Text key={f} style={styles.featureItem}>{f}</Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaywall(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPaywall(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalGlyph}>◇</Text>
            <Text style={styles.modalTitle}>CoolDown</Text>
            <Text style={styles.modalSub}>Relief protocols for hot flashes.</Text>
            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePer}>per month</Text>
            </View>
            {['4 science-backed relief protocols','Guided breathwork & muscle release','Hot flash frequency tracking','Correlate with food & supplements','Cancel anytime'].map(f => (
              <View key={f} style={styles.modalFeatureRow}>
                <Text style={styles.modalFeatureCheck}>✦</Text>
                <Text style={styles.modalFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.purchaseBtn, loading && { opacity:0.7 }]} onPress={handlePurchase} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.parchment} /> : <Text style={styles.purchaseBtnText}>Subscribe · {price}/month</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreBtnText}>Restore purchase</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}>Subscription auto-renews monthly. Cancel anytime in Apple ID settings.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.parchment},
  header:{backgroundColor:Colors.plum,paddingHorizontal:20,paddingTop:8,paddingBottom:14},
  logoText:{fontFamily:Fonts.serif,fontSize:24,color:Colors.goldLight,letterSpacing:4},
  subText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,letterSpacing:3,textTransform:'uppercase',marginTop:1},
  content:{padding:20},
  pageTitle:{fontFamily:Fonts.serif,fontSize:26,color:Colors.plum,marginBottom:4},
  pageSub:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginBottom:24},
  card:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:12},
  cardTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.plum,marginBottom:4},
  cardSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:4},
  protocolCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:16,padding:16,marginBottom:10},
  protocolCardActive:{borderColor:Colors.teal,backgroundColor:Colors.tealPale},
  protocolHeader:{flexDirection:'row',alignItems:'center'},
  protocolTitle:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.plum,marginBottom:2},
  protocolDuration:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  protocolChevron:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  protocolDesc:{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,lineHeight:20,marginTop:12},
  startBtn:{backgroundColor:Colors.teal,borderRadius:20,paddingVertical:10,paddingHorizontal:20,alignSelf:'flex-start',marginTop:14},
  startBtnText:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.cream},
  lockedCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:24,marginBottom:16,alignItems:'center'},
  lockedGlyph:{fontSize:40,color:Colors.plumLight,marginBottom:16},
  lockedTitle:{fontFamily:Fonts.serif,fontSize:20,color:Colors.plum,textAlign:'center',marginBottom:10},
  lockedSub:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,textAlign:'center',lineHeight:20,marginBottom:20},
  unlockBtn:{backgroundColor:Colors.plum,borderRadius:30,paddingVertical:14,paddingHorizontal:28},
  unlockBtnText:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.parchment,letterSpacing:0.5},
  featureList:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,gap:12},
  featureItem:{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,lineHeight:20},
  modalSafe:{flex:1,backgroundColor:Colors.parchment},
  modalClose:{alignSelf:'flex-end',padding:20},
  modalCloseText:{fontFamily:Fonts.sans,fontSize:18,color:Colors.mist},
  modalContent:{padding:28,alignItems:'center'},
  modalGlyph:{fontSize:48,color:Colors.plum,marginBottom:12},
  modalTitle:{fontFamily:Fonts.serif,fontSize:32,color:Colors.plum,letterSpacing:2,marginBottom:8},
  modalSub:{fontFamily:Fonts.sans,fontSize:14,color:Colors.mist,textAlign:'center',marginBottom:24},
  priceCard:{backgroundColor:Colors.goldPale,borderWidth:1,borderColor:Colors.gold,borderRadius:16,paddingVertical:20,paddingHorizontal:40,alignItems:'center',marginBottom:28},
  priceAmount:{fontFamily:Fonts.sansMedium,fontSize:36,color:Colors.plum},
  pricePer:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginTop:2},
  modalFeatureRow:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:12,alignSelf:'stretch'},
  modalFeatureCheck:{fontFamily:Fonts.sans,fontSize:13,color:Colors.gold,marginTop:1},
  modalFeatureText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,flex:1,lineHeight:20},
  purchaseBtn:{backgroundColor:Colors.plum,borderRadius:30,paddingVertical:16,paddingHorizontal:32,alignSelf:'stretch',alignItems:'center',marginTop:24,marginBottom:12},
  purchaseBtnText:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.parchment,letterSpacing:0.5},
  restoreBtn:{paddingVertical:12,alignItems:'center'},
  restoreBtnText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  legalText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,textAlign:'center',lineHeight:16,marginTop:16},
});
