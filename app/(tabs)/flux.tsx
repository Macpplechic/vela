import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

const TESTIMONIALS = [
  { text: '"Finally something built for MY body, not a 25-year-old."', name: 'Sarah, 47' },
  { text: '"My doctor was blown away by my 90-day report."', name: 'Maria, 52' },
  { text: '"I finally know what\'s triggering my symptoms."', name: 'Jennifer, 44' },
];

const FLOW_OPTIONS = [
  { label: 'Light spotting', color: Colors.rose + '80' },
  { label: 'Light flow', color: Colors.rose + 'AA' },
  { label: 'Moderate flow', color: Colors.rose },
  { label: 'Heavy flow', color: '#8B1A1A' },
  { label: 'No period', color: Colors.mist },
  { label: 'Skipped month', color: Colors.gold },
  { label: 'Irregular', color: Colors.plumLight ?? '#7B5EA7' },
];

function predictNextPeriod(logs: any[]): string | null {
  // Get logs that have period symptoms
  const periodLogs = logs.filter(l =>
    l.symptoms.some((s: string) => ['Heavy flow','Moderate flow','Light flow','Light spotting'].includes(s))
  ).sort((a: any, b: any) => a.date.localeCompare(b.date));

  if (periodLogs.length < 2) return null;

  // Calculate average cycle length from last 3 cycles
  const cycleLengths: number[] = [];
  for (let i = 1; i < Math.min(periodLogs.length, 4); i++) {
    const prev = new Date(periodLogs[i-1].date);
    const curr = new Date(periodLogs[i].date);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 15 && diff < 90) cycleLengths.push(diff);
  }

  if (cycleLengths.length === 0) return null;

  const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
  const lastPeriod = new Date(periodLogs[periodLogs.length - 1].date);
  const predicted = new Date(lastPeriod);
  predicted.setDate(predicted.getDate() + avgCycle);

  const today = new Date();
  const daysUntil = Math.round((predicted.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return `${Math.abs(daysUntil)} days late (avg cycle: ${avgCycle} days)`;
  if (daysUntil === 0) return 'Expected today';
  if (daysUntil <= 3) return `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''} — coming soon`;
  return `In ~${daysUntil} days (avg cycle: ${avgCycle} days)`;
}

export default function FluxScreen() {
  const { fluxActive, fluxLogs, setFluxLogs, unlockFlux, startFluxTrial } = useVelaStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [cycleInsight, setCycleInsight] = useState<string | null>(null);


  useEffect(() => {
    loadOffering();
    // Load today's saved flow
    const todayKey = '@vela_flow_' + new Date().toISOString().split('T')[0];
    AsyncStorage.getItem(todayKey).then(val => { if (val) setSelectedFlow(val); });
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const getCycleInsight = () => {
    const insights: Record<string, string> = {
      'Light spotting': 'Spotting between cycles is very common in perimenopause — estrogen fluctuations cause the lining to shed irregularly. Track it consistently; if it continues for 3+ months, bring your log to your doctor.',
      'Light flow': 'Lighter periods often mean your cycle is changing — this is normal in early perimenopause. Staying hydrated and reducing stress can help regulate things.',
      'Moderate flow': 'Moderate flow is your body in transition. Magnesium-rich foods like pumpkin seeds and dark chocolate can help reduce cramping and mood dips.',
      'Heavy flow': 'Heavy flow can cause iron depletion — add iron-rich foods like lentils, spinach, and red meat this week. If soaking through pads hourly, talk to your doctor.',
      'No period': 'A skipped period is one of the hallmark signs of perimenopause. Track the date — this data is valuable for your doctor and for understanding your pattern.',
      'Skipped month': 'Skipped months become more frequent as you move through perimenopause. This is your body shifting. Log every occurrence — patterns emerge over 3–6 months.',
      'Irregular': 'Irregular cycles are the norm in perimenopause, not the exception. Reducing caffeine and alcohol can help stabilize frequency. Keep logging — consistency is key.',
    };
    const insight = insights[selectedFlow ?? ''] ?? 'Every log you make builds a clearer picture of your hormonal pattern. Keep going — data is power.';
    setCycleInsight(insight);
  };

  const loadOffering = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      let found = null;
      const allOfferings = Object.values(offerings.all);
      for (const offering of allOfferings) {
        const match = offering.availablePackages.find(
          p => p.product.identifier === 'com.velawellness.app.fluxlog_monthly'
        );
        if (match) { found = match; break; }
      }
      if (!found) found = offerings.current?.availablePackages.find(
        p => p.product.identifier === 'com.velawellness.app.fluxlog_monthly'
      ) ?? null;
      if (found) setPkg(found);
    } catch (e) { /* offerings unavailable */ }
  };

  const handlePurchase = async () => {
    if (!pkg) { Alert.alert('Not available', 'Purchase unavailable right now. Try again later.'); return; }
    setLoading(true);
    try {
      await Purchases.purchasePackage(pkg);
      await unlockFlux();
      setShowPaywall(false);
      Alert.alert('Welcome to FluxLog ◎', 'Your cycle tracking is now unlocked.');
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleTrial = async () => {
    await startFluxTrial();
    setShowPaywall(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['fluxlog']) {
        await unlockFlux();
        setShowPaywall(false);
        Alert.alert('Restored', 'Your FluxLog access has been restored.');
      } else { Alert.alert('Nothing to restore', 'No previous FluxLog purchase found.'); }
    } catch (e: any) { Alert.alert('Restore failed', e.message ?? 'Could not restore purchases.');
    } finally { setLoading(false); }
  };

  const price = pkg?.product.priceString ?? '$4.99';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>FluxLog ◎</Text>
        <Text style={styles.pageSub}>Cycle tracking designed for the peri years.</Text>

        {fluxActive ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How is your flow today?</Text>
              <Text style={styles.cardSub}>Tap to log. Patterns emerge over time.</Text>
              {FLOW_OPTIONS.map(opt => {
                const on = selectedFlow === opt.label;
                return (
                  <TouchableOpacity delayPressIn={0}
                    key={opt.label}
                    style={[styles.optRow, on && { backgroundColor: opt.color + '22', borderColor: opt.color }]}
                    onPress={async () => {
                    const next = on ? null : opt.label;
                    setSelectedFlow(next);
                    const todayKey = '@vela_flow_' + new Date().toISOString().split('T')[0];
                    if (next) await AsyncStorage.setItem(todayKey, next);
                    else await AsyncStorage.removeItem(todayKey);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optDot, { borderColor: opt.color, backgroundColor: on ? opt.color : 'transparent' }]} />
                    <Text style={[styles.optText, on && { color: Colors.plum, fontFamily: Fonts.sansMedium }]}>{opt.label}</Text>
                    {on && <Text style={{ color: opt.color }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedFlow && (
              <TouchableOpacity delayPressIn={0} style={{backgroundColor:Colors.plum,borderRadius:14,paddingVertical:10,paddingHorizontal:16,marginBottom:8,alignItems:'center'}} onPress={getCycleInsight} activeOpacity={0.85}>
                <Text style={{fontFamily:Fonts.sans,fontSize:13,color:Colors.parchment}}>✦ What does this mean?</Text>
              </TouchableOpacity>
            )}
            {cycleInsight && (
              <View style={{backgroundColor:'#F0EBF5',borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:Colors.plum}}>
                <Text style={{fontFamily:Fonts.sansMedium,fontSize:10,color:Colors.plum,letterSpacing:2,marginBottom:6}}>✦ VELA INSIGHT</Text>
                <Text style={{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,lineHeight:20}}>{cycleInsight}</Text>
                <TouchableOpacity delayPressIn={0} onPress={() => setCycleInsight(null)}><Text style={{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,marginTop:8,textAlign:'right'}}>dismiss</Text></TouchableOpacity>
              </View>
            )}
            {selectedFlow && (
              <View style={{ backgroundColor: Colors.sagePale ?? '#EEF5EE', borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: Colors.sage, fontFamily: Fonts.sans, fontSize: 13 }}>✓ Logged today: {selectedFlow} — great consistency!</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cycle insights</Text>
              <Text style={styles.cardSub}>Patterns emerge after a few weeks of logging.</Text>
              {[
                { label: 'Days tracked this month', val: `${Object.keys(AsyncStorage).length || 0}` },
                { label: 'Current flow', val: selectedFlow ?? '—' },
                { label: 'Last logged', val: 'Today' },
                { label: 'Streak', val: selectedFlow ? 'Active' : '—' },
              ].map(item => (
                <View key={item.label} style={styles.insightRow}>
                  <Text style={styles.insightLabel}>{item.label}</Text>
                  <Text style={styles.insightVal}>{item.val}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: Colors.tealPale ?? '#E8F4F2', borderColor: Colors.teal }]}>
              <Text style={[styles.cardTitle, { color: Colors.teal }]}>Why tracking now matters</Text>
              <Text style={[styles.cardSub, { color: Colors.plum, marginBottom: 0 }]}>
                Perimenopause cycles are unpredictable by design — but your patterns tell a story. 90 days of data gives you and your doctor something real to work with. Most women wish they'd started logging sooner.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Pain-led hero */}
            <View style={styles.heroCard}>
              <Text style={styles.heroQuestion}>Your cycle stopped making sense. FluxLog is built for exactly that.</Text>
              <Text style={styles.heroAnswer}>Irregular, unpredictable, confusing — perimenopause cycles don't fit any other app. This one was made for yours.</Text>
            </View>

            {/* Rotating testimonial */}
            <View style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>{TESTIMONIALS[testimonialIdx].text}</Text>
              <Text style={styles.testimonialName}>— {TESTIMONIALS[testimonialIdx].name}</Text>
            </View>

            {/* Features */}
            <View style={styles.featureCard}>
              <Text style={styles.featureCardTitle}>FluxLog tracks what other apps can't</Text>
              {[
                ['◎', 'Built for irregular, skipped, and surprise cycles'],
                ['◎', 'Find your triggers — food, stress, sleep, caffeine'],
                ['◎', 'Auto-builds your 90-day doctor report'],
                ['◎', 'Designed for peri — not fertility, not teens'],
              ].map(([glyph, text]) => (
                <View key={text} style={styles.featureRow}>
                  <Text style={styles.featureGlyph}>{glyph}</Text>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Trial CTA */}

            {/* ── Required Subscription Info ── */}
            <View style={{backgroundColor:'rgba(255,255,255,0.08)', borderRadius:12, padding:14, marginBottom:12}}>
              <Text style={{fontFamily:'System', fontSize:13, color:'rgba(255,255,255,0.9)', fontWeight:'600', marginBottom:6}}>
                FluxLog Monthly
              </Text>
              <Text style={{fontFamily:'System', fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:2}}>
                $4.99 / month · Auto-renews monthly
              </Text>
              <Text style={{fontFamily:'System', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:8}}>
                Cancel anytime in Apple ID settings · Payment charged to Apple ID at confirmation
              </Text>
              <View style={{flexDirection:'row', gap:16}}>
                <Text
                  style={{fontFamily:'System', fontSize:12, color:'#A8D8E8', textDecorationLine:'underline'}}
                  onPress={() => require('react-native').Linking.openURL('https://macpplechic.github.io/vela/terms')}>
                  Terms of Use
                </Text>
                <Text
                  style={{fontFamily:'System', fontSize:12, color:'#A8D8E8', textDecorationLine:'underline'}}
                  onPress={() => require('react-native').Linking.openURL('https://macpplechic.github.io/vela/privacy')}>
                  Privacy Policy
                </Text>
              </View>
            </View>

            <TouchableOpacity delayPressIn={0} style={styles.trialBtn} onPress={handleTrial} activeOpacity={0.85}>
              <Text style={styles.trialBtnTitle}>Start free — 7 days, no card needed</Text>
              <Text style={styles.trialBtnSub}>3,800+ women tracking their peri cycles</Text>
            </TouchableOpacity>

            <TouchableOpacity delayPressIn={0} style={styles.subscribeBtn} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
              <Text style={styles.subscribeBtnText}>Unlock FluxLog · {price}/month</Text>
            </TouchableOpacity>

            <Text style={styles.legalSmall}>Cancel anytime · Billed monthly through Apple</Text>
          </>
        )}
      </ScrollView>

      <Modal visible={showPaywall} animationType="slide" onRequestClose={() => setShowPaywall(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <TouchableOpacity delayPressIn={0} style={styles.modalClose} onPress={() => setShowPaywall(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={[styles.modalContent, { paddingBottom: 60 }]}>
            <Text style={styles.modalGlyph}>◎</Text>
            <Text style={styles.modalTitle}>FluxLog</Text>
            <Text style={styles.modalHook}>Your body is changing. FluxLog helps you
understand it — and take back control.</Text>

            {/* Trial box */}
            <View style={{flexDirection:'row', justifyContent:'center', gap:16, marginBottom:12}}>
              <TouchableOpacity delayPressIn={0} onPress={() => require('react-native').Linking.openURL('https://macpplechic.github.io/vela/terms')}>
                <Text style={{fontFamily:'System', fontSize:11, color:Colors.mist, textDecorationLine:'underline'}}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={{fontFamily:'System', fontSize:11, color:Colors.mist}}>·</Text>
              <TouchableOpacity delayPressIn={0} onPress={() => require('react-native').Linking.openURL('https://macpplechic.github.io/vela/privacy')}>
                <Text style={{fontFamily:'System', fontSize:11, color:Colors.mist, textDecorationLine:'underline'}}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity delayPressIn={0} style={styles.trialBox} onPress={handleTrial} activeOpacity={0.85}>
              <View>
                <Text style={styles.trialBoxTitle}>✦  Start free — full access, 7 days</Text>
                <Text style={styles.trialBoxSub}>No card required · Cancel anytime · Instant access</Text>
              </View>
              <Text style={styles.trialBoxArrow}>→</Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or subscribe now —</Text>

            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePer}>per month</Text>
            </View>

            {['Log any cycle — spotting, skipped, irregular','Patterns emerge within 2 weeks of logging','Correlate flow with food, stress & caffeine','Auto-builds your doctor report in 90 days','Cancel anytime, no questions asked'].map(f => (
              <View key={f} style={styles.modalFeatureRow}>
                <Text style={styles.modalFeatureCheck}>✦</Text>
                <Text style={styles.modalFeatureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity delayPressIn={0} style={[styles.purchaseBtn, loading && { opacity: 0.7 }]} onPress={handlePurchase} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={Colors.parchment} /> : <Text style={styles.purchaseBtnText}>Unlock FluxLog · {price}/month</Text>}
            </TouchableOpacity>

            <TouchableOpacity delayPressIn={0} style={styles.restoreBtn} onPress={handleRestore} disabled={loading}>
              <Text style={styles.restoreBtnText}>Already subscribed? Restore access</Text>
            </TouchableOpacity>
            <View style={styles.legalRow}>
              <Text style={styles.legalText}>{'FluxLog is less than a coffee a week. Auto-renews unless cancelled 24hrs before renewal. Manage in App Store settings. '}
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
  pageSub:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginBottom:20},
  calGrid:{flexDirection:'row',flexWrap:'wrap',gap:4,marginBottom:10},
  calDot:{width:30,height:30,borderRadius:6,alignItems:'center',justifyContent:'center'},
  calDotText:{fontFamily:Fonts.sans,fontSize:9,color:Colors.plum},
  calLegend:{flexDirection:'row',flexWrap:'wrap',gap:10},
  card:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:12},
  cardTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.plum,marginBottom:4},
  cardSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:14},
  optRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:11,borderBottomWidth:0.5,borderBottomColor:Colors.parchmentDark,borderRadius:8,paddingHorizontal:4,borderWidth:0,marginBottom:2},
  optDot:{width:12,height:12,borderRadius:6,borderWidth:1.5},
  optText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,flex:1},
  insightRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:0.5,borderBottomColor:Colors.parchmentDark},
  insightLabel:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  insightVal:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum},
  heroCard:{backgroundColor:Colors.plum,borderRadius:20,padding:24,marginBottom:12},
  heroQuestion:{fontFamily:Fonts.serif,fontSize:20,color:Colors.goldLight,lineHeight:28,marginBottom:12},
  heroAnswer:{fontFamily:Fonts.sans,fontSize:13,color:'rgba(245,239,230,0.8)',lineHeight:20},
  testimonialCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:20,marginBottom:12,alignItems:'center'},
  testimonialText:{fontFamily:Fonts.serif,fontSize:15,color:Colors.plum,textAlign:'center',lineHeight:22,fontStyle:'italic',marginBottom:8},
  testimonialName:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,letterSpacing:1},
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
  legalSmall:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,textAlign:'center',marginBottom:8},
  modalSafe:{flex:1,backgroundColor:Colors.parchment},
  modalClose:{alignSelf:'flex-end',padding:20},
  modalCloseText:{fontFamily:Fonts.sans,fontSize:18,color:Colors.mist},
  modalContent:{padding:28,alignItems:'center'},
  modalGlyph:{fontSize:48,color:Colors.plum,marginBottom:12},
  modalTitle:{fontFamily:Fonts.serif,fontSize:32,color:Colors.plum,letterSpacing:2,marginBottom:12},
  modalHook:{fontFamily:Fonts.sans,fontSize:14,color:Colors.mist,textAlign:'center',lineHeight:22,marginBottom:24},
  trialBox:{backgroundColor:Colors.tealPale??'#E8F4F2',borderWidth:1,borderColor:Colors.teal,borderRadius:16,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',alignSelf:'stretch',marginBottom:16},
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
