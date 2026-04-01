import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

export default function FluxScreen() {
  const { fluxActive, unlockFlux } = useVelaStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    Purchases.configure({ apiKey: RC_API_KEY });
    loadOffering();
  }, []);

  const loadOffering = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.availablePackages.find(
        p => p.product.identifier === 'com.velawellness.app.fluxlog_monthly'
      );
      if (monthly) setPkg(monthly);
    } catch (e) { console.log('Offerings error:', e); }
  };

  const handlePurchase = async () => {
    if (!pkg) { Alert.alert('Not available', 'Purchase unavailable right now. Try again later.'); return; }
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['fluxlog']) {
        await unlockFlux();
        setShowPaywall(false);
        Alert.alert('Welcome to FluxLog ◎', 'Your cycle tracking is now unlocked.');
      }
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>FluxLog ◎</Text>
        <Text style={styles.pageSub}>Cycle tracking designed for the peri years.</Text>
        {fluxActive ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Log today</Text>
              <Text style={styles.cardSub}>Track flow, spotting, and irregularities.</Text>
              {['Light spotting','Light flow','Moderate flow','Heavy flow','No period'].map(opt => (
                <TouchableOpacity key={opt} style={styles.optRow}>
                  <View style={styles.optDot} />
                  <Text style={styles.optText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cycle insights</Text>
              <Text style={styles.cardSub}>Patterns emerge over time. Keep logging.</Text>
              {['Average cycle length','Last period','Irregularity score'].map(label => (
                <View key={label} style={styles.insightRow}>
                  <Text style={styles.insightLabel}>{label}</Text>
                  <Text style={styles.insightVal}>—</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.lockedCard}>
              <Text style={styles.lockedGlyph}>◎</Text>
              <Text style={styles.lockedTitle}>FluxLog is a premium feature</Text>
              <Text style={styles.lockedSub}>Track your cycle with tools built specifically for perimenopause — irregular periods, spotting patterns, and hormonal correlations.</Text>
              <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
                <Text style={styles.unlockBtnText}>Unlock FluxLog · {price}/month</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.featureList}>
              {['◎  Cycle logging built for irregular periods','◎  Spotting and flow pattern tracking','◎  Hormonal symptom correlations','◎  Included in your doctor report'].map(f => (
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
            <Text style={styles.modalGlyph}>◎</Text>
            <Text style={styles.modalTitle}>FluxLog</Text>
            <Text style={styles.modalSub}>Cycle tracking for the peri years.</Text>
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
  cardSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:14},
  optRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,borderBottomWidth:0.5,borderBottomColor:Colors.parchmentDark},
  optDot:{width:10,height:10,borderRadius:5,borderWidth:1.5,borderColor:Colors.plum},
  optText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum},
  insightRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:Colors.parchmentDark},
  insightLabel:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  insightVal:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum},
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
