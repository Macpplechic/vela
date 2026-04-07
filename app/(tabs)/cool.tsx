import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';
const PROTOCOLS = [
  { title:'4-7-8 Breath', duration:'4 min', desc:'Inhale 4 counts, hold 7, exhale 8. Activates the parasympathetic nervous system to cool core temperature.' },
  { title:'Cold Water Reset', duration:'2 min', desc:'Run cold water over your wrists and back of neck. Rapid cooling of pulse points reduces flush intensity.' },
  { title:'Progressive Muscle Release', duration:'6 min', desc:'Systematically tense and release muscle groups from feet to face. Releases stored heat and tension.' },
  { title:'Paced Breathing', duration:'5 min', desc:'Breathe in for 5 counts, out for 5. Studies show paced breathing reduces hot flash frequency by up to 50%.' },
];

export default function CoolScreen() {
  const { coolActive, unlockCool } = useVelaStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<number | null>(null);

  useEffect(() => {
    loadOffering();
  }, []);

  const loadOffering = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.availablePackages.find(
        p => p.product.identifier === 'com.velawellness.app.cooldown_monthly'
      );
      if (monthly) setPkg(monthly);
    } catch (e) { console.log('Offerings error:', e); }
  };

  const handlePurchase = async () => {
    if (!pkg) { Alert.alert('Not available', 'Purchase unavailable right now. Try again later.'); return; }
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['cooldown']) {
        await unlockCool();
        setShowPaywall(false);
        Alert.alert('Welcome to CoolDown ◇', 'Your hot flash protocols are now unlocked.');
      }
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                  <TouchableOpacity style={styles.startBtn} onPress={() => {}} activeOpacity={0.8}>
                    <Text style={styles.startBtnText}>Start protocol →</Text>
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
        <View style={{ height: 20 }} />
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
  startBtn:{backgroundColor:Colors.teal,borderRadius:20,paddingVertical:8,paddingHorizontal:20,alignSelf:'flex-start',marginTop:12},
  startBtnText:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.cream},
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
