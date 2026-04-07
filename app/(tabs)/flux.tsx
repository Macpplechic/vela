import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
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

export default function FluxScreen() {
  const { fluxActive, unlockFlux, startFluxTrial } = useVelaStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    loadOffering();
    // Load today's saved flow
    const todayKey = '@vela_flow_' + new Date().toISOString().split('T')[0];
    AsyncStorage.getItem(todayKey).then(val => { if (val) setSelectedFlow(val); });
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

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
                  <TouchableOpacity
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
              <View style={{ backgroundColor: Colors.sagePale ?? '#EEF5EE', borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: Colors.sage, fontFamily: Fonts.sans, fontSize: 13 }}>✓ Logged: {selectedFlow}</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cycle insights</Text>
              <Text style={styles.cardSub}>Patterns emerge after a few weeks of logging.</Text>
              {[
                { label: 'Average cycle length', val: '—' },
                { label: 'Last period', val: '—' },
                { label: 'Irregularity score', val: '—' },
                { label: 'Days tracked', val: '0' },
              ].map(item => (
                <View key={item.label} style={styles.insightRow}>
                  <Text style={styles.insightLabel}>{item.label}</Text>
                  <Text style={styles.insightVal}>{item.val}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: Colors.tealPale ?? '#E8F4F2', borderColor: Colors.teal }]}>
              <Text style={[styles.cardTitle, { color: Colors.teal }]}>Why this matters</Text>
              <Text style={[styles.cardSub, { color: Colors.plum, marginBottom: 0 }]}>
                Perimenopausal cycles are unpredictable by design. Logging them over time helps you and your doctor understand your unique hormonal pattern — and catch anything worth investigating.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Pain-led hero */}
            <View style={styles.heroCard}>
              <Text style={styles.heroQuestion}>Has your period disappeared for months — then returned twice in one week?</Text>
              <Text style={styles.heroAnswer}>This is perimenopause. FluxLog is built specifically for cycles like yours.</Text>
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
                ['◎', 'Irregular cycles, spotting, skipped months'],
                ['◎', 'Correlate flow with food, stress & sleep'],
                ['◎', 'Included in your 90-day doctor report'],
                ['◎', 'Designed for perimenopause — not fertility'],
              ].map(([glyph, text]) => (
                <View key={text} style={styles.featureRow}>
                  <Text style={styles.featureGlyph}>{glyph}</Text>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Trial CTA */}
            <TouchableOpacity style={styles.trialBtn} onPress={handleTrial} activeOpacity={0.85}>
              <Text style={styles.trialBtnTitle}>Try FluxLog free for 7 days</Text>
              <Text style={styles.trialBtnSub}>No credit card required</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subscribeBtn} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
              <Text style={styles.subscribeBtnText}>Subscribe · {price}/month</Text>
            </TouchableOpacity>

            <Text style={styles.legalSmall}>Cancel anytime · Billed monthly through Apple</Text>
          </>
        )}
      </ScrollView>

      <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPaywall(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowPaywall(false)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={[styles.modalContent, { paddingBottom: 60 }]}>
            <Text style={styles.modalGlyph}>◎</Text>
            <Text style={styles.modalTitle}>FluxLog</Text>
            <Text style={styles.modalHook}>Your period stopped making sense.{'\n'}FluxLog helps you understand why.</Text>

            {/* Trial box */}
            <TouchableOpacity style={styles.trialBox} onPress={handleTrial} activeOpacity={0.85}>
              <View>
                <Text style={styles.trialBoxTitle}>✦  Start 7-day free trial</Text>
                <Text style={styles.trialBoxSub}>Full access, cancel anytime, no charge today</Text>
              </View>
              <Text style={styles.trialBoxArrow}>→</Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or subscribe now —</Text>

            <View style={styles.priceCard}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePer}>per month</Text>
            </View>

            {['Log flow, spotting & irregularities','Track patterns over time','Correlate with symptoms & supplements','Included in your 90-day doctor report','Cancel anytime'].map(f => (
              <View key={f} style={styles.modalFeatureRow}>
                <Text style={styles.modalFeatureCheck}>✦</Text>
                <Text style={styles.modalFeatureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity style={[styles.purchaseBtn, loading && { opacity: 0.7 }]} onPress={handlePurchase} disabled={loading} activeOpacity={0.85}>
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
  pageSub:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginBottom:20},
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
  legalText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,textAlign:'center',lineHeight:16,marginTop:16},
});
