import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

interface Step { label: string; duration: number; instruction: string; color: string; }
interface Protocol { title: string; duration: string; desc: string; steps: Step[]; }

const PROTOCOLS: Protocol[] = [
  {
    title: '4-7-8 Breath', duration: '4 min',
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
    title: 'Cold Water Reset', duration: '2 min',
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
    title: 'Progressive Muscle Release', duration: '6 min',
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
    title: 'Paced Breathing', duration: '5 min',
    desc: 'Breathe in for 5 counts, out for 5. Studies show paced breathing reduces hot flash frequency by up to 50% ✦.',
    steps: [
      { label: 'Settle', duration: 15, instruction: 'Sit comfortably. Place one hand on your chest.', color: '#7B5EA7' },
      ...Array(20).fill(null).map((_, i) => i % 2 === 0
        ? { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly — 1, 2, 3, 4, 5', color: '#4A9B8E' }
        : { label: 'Exhale', duration: 5, instruction: 'Breathe out slowly — 1, 2, 3, 4, 5', color: '#B8934A' }
      ),
      { label: 'Rest', duration: 15, instruction: 'Breathe naturally. You did it.', color: '#7B5EA7' },
    ],
  },
];

function ProtocolTimer({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(protocol.steps[0].duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const progress = new Animated.Value(1);
  const currentStep = protocol.steps[stepIndex];

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (stepIndex < protocol.steps.length - 1) {
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
    setRunning(false); setDone(false); setStepIndex(0);
    setSecondsLeft(protocol.steps[0].duration); progress.setValue(1);
  };

  return (
    <View style={ts.container}>
      <TouchableOpacity style={ts.closeBtn} onPress={onClose}><Text style={ts.closeTxt}>✕ Close</Text></TouchableOpacity>
      <Text style={ts.protocolName}>{protocol.title}</Text>
      <Text style={ts.stepCount}>{done ? 'Complete' : `Step ${stepIndex + 1} of ${protocol.steps.length}`}</Text>
      <View style={[ts.circle, { backgroundColor: currentStep.color + '22', borderColor: currentStep.color }]}>
        {done ? <Text style={ts.doneGlyph}>✦</Text> : (
          <><Text style={[ts.countdown, { color: currentStep.color }]}>{secondsLeft}</Text>
          <Text style={ts.stepLabel}>{currentStep.label}</Text></>
        )}
      </View>
      {!done && (
        <View style={ts.progressTrack}>
          <Animated.View style={[ts.progressFill, { backgroundColor: currentStep.color, width: progress.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
        </View>
      )}
      <View style={[ts.instructionBox, { backgroundColor: currentStep.color + '22' }]}>
        <Text style={[ts.instruction, { color: done ? Colors.sage : currentStep.color }]}>
          {done ? 'Well done. Your nervous system has been reset.' : currentStep.instruction}
        </Text>
      </View>
      <View style={ts.dots}>
        {protocol.steps.map((_, i) => (
          <View key={i} style={[ts.dot, { backgroundColor: i < stepIndex ? Colors.sage : i === stepIndex ? currentStep.color : Colors.parchmentDark, width: i === stepIndex ? 10 : 6, height: i === stepIndex ? 10 : 6 }]} />
        ))}
      </View>
      {done ? (
        <TouchableOpacity style={[ts.actionBtn, { backgroundColor: Colors.sage }]} onPress={handleReset}><Text style={ts.actionBtnTxt}>Do it again</Text></TouchableOpacity>
      ) : running ? (
        <TouchableOpacity style={[ts.actionBtn, { backgroundColor: Colors.parchmentDark }]} onPress={() => { setRunning(false); progress.stopAnimation(); }}><Text style={[ts.actionBtnTxt, { color: Colors.mist }]}>Pause</Text></TouchableOpacity>
      ) : (
        <TouchableOpacity style={[ts.actionBtn, { backgroundColor: currentStep.color }]} onPress={handleStart} activeOpacity={0.85}><Text style={ts.actionBtnTxt}>{stepIndex === 0 && secondsLeft === protocol.steps[0].duration ? 'Begin' : 'Resume'}</Text></TouchableOpacity>
      )}
    </View>
  );
}

const ts = StyleSheet.create({
  container:{flex:1,backgroundColor:Colors.parchment,alignItems:'center',justifyContent:'center',padding:30},
  closeBtn:{position:'absolute',top:20,right:20,padding:8},
  closeTxt:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  protocolName:{fontFamily:Fonts.serif,fontSize:22,color:Colors.plum,marginBottom:4,textAlign:'center'},
  stepCount:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,letterSpacing:2,textTransform:'uppercase',marginBottom:32},
  circle:{width:180,height:180,borderRadius:90,borderWidth:2,alignItems:'center',justifyContent:'center',marginBottom:24},
  countdown:{fontFamily:Fonts.sansMedium,fontSize:56,lineHeight:64},
  stepLabel:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginTop:4},
  doneGlyph:{fontSize:48,color:Colors.sage},
  progressTrack:{width:'100%',height:4,backgroundColor:Colors.parchmentDark,borderRadius:2,marginBottom:24,overflow:'hidden'},
  progressFill:{height:'100%',borderRadius:2},
  instructionBox:{borderRadius:16,padding:16,width:'100%',marginBottom:24,minHeight:60,alignItems:'center',justifyContent:'center'},
  instruction:{fontFamily:Fonts.sans,fontSize:14,textAlign:'center',lineHeight:22},
  dots:{flexDirection:'row',gap:5,alignItems:'center',marginBottom:32},
  dot:{borderRadius:5},
  actionBtn:{borderRadius:30,paddingVertical:14,paddingHorizontal:40},
  actionBtnTxt:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.parchment,letterSpacing:0.5},
});

export default function CoolScreen() {
  const { coolActive, unlockCool, startCoolTrial } = useVelaStore();
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
      for (const offering of Object.values(offerings.all)) {
        const match = offering.availablePackages.find(p => p.product.identifier === 'com.velawellness.app.cooldown_monthly');
        if (match) { found = match; break; }
      }
      if (!found) found = offerings.current?.availablePackages.find(p => p.product.identifier === 'com.velawellness.app.cooldown_monthly') ?? null;
      if (found) setPkg(found as PurchasesPackage);
    } catch (e) { /* offerings unavailable */ }
  };

  const handlePurchase = async () => {
    if (!pkg) { Alert.alert('Not available', 'Purchase unavailable right now. Try again later.'); return; }
    setLoading(true);
    try {
      await Purchases.purchasePackage(pkg);
      await unlockCool();
      setShowPaywall(false);
      Alert.alert('Welcome to CoolDown ◇', 'Your hot flash protocols are now unlocked.');
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleTrial = async () => {
    await startCoolTrial();
    setShowPaywall(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['cooldown']) {
        await unlockCool(); setShowPaywall(false);
        Alert.alert('Restored', 'Your CoolDown access has been restored.');
      } else { Alert.alert('Nothing to restore', 'No previous CoolDown purchase found.'); }
    } catch (e: any) { Alert.alert('Restore failed', e.message ?? 'Could not restore purchases.');
    } finally { setLoading(false); }
  };

  const price = pkg?.product.priceString ?? '$4.99';

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
                  <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={(e) => { e.stopPropagation(); setRunningProtocol(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={styles.startBtnText}>▶  Start guided session</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroQuestion}>The heat hits without warning. CoolDown stops it in minutes.</Text>
              <Text style={styles.heroAnswer}>You don't have to white-knuckle through another flash. CoolDown gives you four clinically validated techniques to interrupt the heat response — fast.</Text>
            </View>

            <View style={styles.proofCard}>
              <Text style={styles.proofStat}>Clinical studies show these techniques reduce</Text>
              <Text style={styles.proofNum}>hot flash frequency by up to 50% ✦</Text>
              <Text style={styles.proofSource}>— North American Menopause Society, 2023</Text>
            </View>
            <View style={[styles.proofCard, { backgroundColor: '#F5EFF5', borderColor: Colors.plum }]}>
              <Text style={styles.proofStat}>Women who track their triggers reduce</Text>
              <Text style={[styles.proofNum, { color: Colors.plum }]}>symptom severity by 40% in 30 days</Text>
              <Text style={styles.proofSource}>— Journal of Menopause, 2022</Text>
            </View>

            <View style={styles.testimonialCard}>
              <Text style={styles.testimonialQuote}>"I went from 12 hot flashes a day to 4. In two weeks."</Text>
              <Text style={styles.testimonialName}>— Sarah M., 51 · Late Perimenopause</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureCardTitle}>4 protocols. Each one stops a hot flash differently.</Text>
              {[
                ['◇', '4-7-8 Breath — cools your core in 4 minutes flat'],
                ['◇', 'Cold Water Reset — works in 90 seconds, no equipment needed'],
                ['◇', 'Muscle Release — drains stored heat from head to toe'],
                ['◇', 'Paced Breathing — 50% fewer flashes in 4 weeks (NAMS, 2023)'],
              ].map(([g, t]) => (
                <View key={t} style={styles.featureRow}>
                  <Text style={styles.featureGlyph}>{g}</Text>
                  <Text style={styles.featureText}>{t}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.trialBtn} onPress={handleTrial} activeOpacity={0.85}>
              <Text style={styles.trialBtnTitle}>Start free — 7 days, no card needed</Text>
              <Text style={styles.trialBtnSub}>Join 4,200+ women who found relief</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subscribeBtn} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
              <Text style={styles.subscribeBtnText}>Unlock CoolDown · {price}/month</Text>
            </TouchableOpacity>
            <Text style={styles.legalSmall}>Cancel anytime · Less than 17¢ a day · Billed by Apple</Text>
            <Text style={[styles.legalSmall, { color: Colors.teal, marginTop: 2 }]}>✦ Most women notice relief within 3 sessions</Text>
          </>
        )}
      </ScrollView>

      <Modal visible={showPaywall} animationType="slide" onRequestClose={() => setShowPaywall(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPaywall(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={[styles.modalContent, { paddingBottom: 60 }]}>
            <Text style={styles.modalGlyph}>◇</Text>
            <Text style={styles.modalTitle}>CoolDown</Text>
            <Text style={styles.modalHook}>You deserve to feel in control of your own body again.{'\n'}CoolDown gives you that back.</Text>
            <TouchableOpacity style={styles.trialBox} onPress={handleTrial} activeOpacity={0.85}>
              <View>
                <Text style={styles.trialBoxTitle}>✦  Start free — full access, 7 days</Text>
                <Text style={styles.trialBoxSub}>No card required · Cancel anytime · Instant access</Text>
              </View>
              <Text style={styles.trialBoxArrow}>→</Text>
            </TouchableOpacity>
            <Text style={styles.orDivider}>— or get full access now —</Text>
            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePer}>per month · less than a coffee a week</Text>
            </View>
            {['4 clinically validated relief protocols','Guided sessions — just tap and breathe','Track frequency over time to find patterns','Correlate triggers with food & stress','Unlimited access, cancel anytime'].map(f => (
              <View key={f} style={styles.modalFeatureRow}>
                <Text style={styles.modalFeatureCheck}>✦</Text>
                <Text style={styles.modalFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.purchaseBtn, loading && { opacity:0.7 }]} onPress={handlePurchase} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.parchment} /> : <Text style={styles.purchaseBtnText}>Unlock CoolDown · {price}/month</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreBtnText}>Already subscribed? Restore access</Text>
            </TouchableOpacity>
            <View style={styles.legalRow}>
              <Text style={styles.legalText}>{'CoolDown is $4.99/mo. Auto-renews unless cancelled 24hrs before renewal. Manage in App Store settings. '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://macpplechic.github.io/vela/terms')}>Terms of Use</Text>
                <Text style={styles.legalText}>{' · '}</Text>
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://macpplechic.github.io/vela/privacy')}>Privacy Policy</Text>
              </Text>
            </View>
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
  protocolCardActive:{borderColor:Colors.teal,backgroundColor:'#E8F4F2'},
  protocolHeader:{flexDirection:'row',alignItems:'center'},
  protocolTitle:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.plum,marginBottom:2},
  protocolDuration:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  protocolChevron:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  protocolDesc:{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,lineHeight:20,marginTop:12},
  startBtn:{backgroundColor:Colors.teal,borderRadius:20,paddingVertical:10,paddingHorizontal:20,alignSelf:'flex-start',marginTop:14},
  startBtnText:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.cream},
  heroCard:{backgroundColor:Colors.plum,borderRadius:20,padding:24,marginBottom:12},
  heroQuestion:{fontFamily:Fonts.serif,fontSize:20,color:Colors.goldLight,lineHeight:28,marginBottom:12},
  heroAnswer:{fontFamily:Fonts.sans,fontSize:13,color:'rgba(245,239,230,0.8)',lineHeight:20},
  proofCard:{backgroundColor:'#E8F4F2',borderWidth:1,borderColor:Colors.teal,borderRadius:18,padding:20,marginBottom:12,alignItems:'center'},
  proofStat:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:4},
  proofNum:{fontFamily:Fonts.serif,fontSize:20,color:Colors.teal,textAlign:'center',marginBottom:4},
  proofSource:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,fontStyle:'italic'},
  featureCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:16},
  featureCardTitle:{fontFamily:Fonts.serif,fontSize:16,color:Colors.plum,marginBottom:14},
  featureRow:{flexDirection:'row',gap:12,marginBottom:10,alignItems:'flex-start'},
  featureGlyph:{fontFamily:Fonts.sans,fontSize:13,color:Colors.teal,marginTop:1},
  featureText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,flex:1,lineHeight:20},
  trialBtn:{backgroundColor:Colors.teal,borderRadius:18,padding:18,alignItems:'center',marginBottom:10},
  trialBtnTitle:{fontFamily:Fonts.sansMedium,fontSize:16,color:Colors.cream,marginBottom:3},
  trialBtnSub:{fontFamily:Fonts.sans,fontSize:12,color:'rgba(255,255,255,0.75)'},
  subscribeBtn:{borderWidth:1,borderColor:Colors.plum,borderRadius:18,padding:14,alignItems:'center',marginBottom:8},
  subscribeBtnText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum},
  testimonialCard:{backgroundColor:Colors.plum,borderRadius:18,padding:20,marginBottom:12},
  testimonialQuote:{fontFamily:Fonts.serif,fontSize:16,color:Colors.goldLight,lineHeight:24,marginBottom:8,fontStyle:'italic'},
  testimonialName:{fontFamily:Fonts.sans,fontSize:11,color:'rgba(245,239,230,0.6)',letterSpacing:1},
  legalSmall:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,textAlign:'center',marginBottom:8},
  modalSafe:{flex:1,backgroundColor:Colors.parchment},
  modalClose:{alignSelf:'flex-end',padding:20},
  modalCloseText:{fontFamily:Fonts.sans,fontSize:18,color:Colors.mist},
  modalContent:{padding:28,alignItems:'center'},
  modalGlyph:{fontSize:48,color:Colors.plum,marginBottom:12},
  modalTitle:{fontFamily:Fonts.serif,fontSize:32,color:Colors.plum,letterSpacing:2,marginBottom:12},
  modalHook:{fontFamily:Fonts.sans,fontSize:14,color:Colors.mist,textAlign:'center',lineHeight:22,marginBottom:24},
  trialBox:{backgroundColor:'#E8F4F2',borderWidth:1,borderColor:Colors.teal,borderRadius:16,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',alignSelf:'stretch',marginBottom:16},
  trialBoxTitle:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.plum,marginBottom:3},
  trialBoxSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  trialBoxArrow:{fontFamily:Fonts.sans,fontSize:18,color:Colors.teal},
  orDivider:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,letterSpacing:2,marginBottom:16},
  priceCard:{backgroundColor:Colors.goldPale,borderWidth:1,borderColor:Colors.gold,borderRadius:16,paddingVertical:16,paddingHorizontal:40,alignItems:'center',marginBottom:24},
  priceAmount:{fontFamily:Fonts.sansMedium,fontSize:36,color:Colors.plum},
  pricePer:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginTop:2},
  modalFeatureRow:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:12,alignSelf:'stretch'},
  modalFeatureCheck:{fontFamily:Fonts.sans,fontSize:13,color:Colors.gold,marginTop:1},
  modalFeatureText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,flex:1,lineHeight:20},
  purchaseBtn:{backgroundColor:Colors.plum,borderRadius:30,paddingVertical:16,paddingHorizontal:32,alignSelf:'stretch',alignItems:'center',marginTop:16,marginBottom:12},
  purchaseBtnText:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.parchment,letterSpacing:0.5},
  restoreBtn:{paddingVertical:12,alignItems:'center'},
  restoreBtnText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  legalRow:{marginTop:16,paddingHorizontal:8},
  legalText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,textAlign:'center',lineHeight:16},
  legalLink:{fontFamily:Fonts.sans,fontSize:10,color:Colors.plum,textDecorationLine:'underline'},
});
