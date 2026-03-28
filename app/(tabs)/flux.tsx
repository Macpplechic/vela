import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Fonts } from '../../constants/Colors';
import { SYMPTOMS } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

function TrialGate({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.gateContainer}>
      <View style={[styles.gateIcon, { backgroundColor:Colors.tealPale, borderColor:Colors.teal }]}>
        <Text style={[styles.gateGlyph, { color:Colors.teal }]}>◎</Text>
      </View>
      <Text style={styles.gateName}>FluxLog</Text>
      <Text style={styles.gateDesc}>
        Track your symptoms alongside every trigger — food, stress, sleep, alcohol, caffeine, exercise, and weather. Vela surfaces the patterns so you finally know what's causing what.
      </Text>
      <View style={styles.featureGrid}>
        {['Trigger correlation','Pattern detection','Doctor-ready export','Daily severity log'].map(f=>(
          <View key={f} style={[styles.featureChip, { backgroundColor:Colors.tealPale }]}>
            <Text style={[styles.featureText, { color:Colors.plum }]}>✦ {f}</Text>
          </View>
        ))}
      </View>
      <View style={styles.trialBox}>
        <Text style={styles.trialBoxTitle}>7-day free trial</Text>
        <Text style={styles.trialBoxSub}>Then $4.99/month or included in Vela Premium. Cancel anytime.</Text>
      </View>
      <TouchableOpacity onPress={onStart} style={styles.startButton}>
        <Text style={styles.startButtonText}>Start free trial →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FluxScreen() {
  const { startFluxTrial, fluxDaysLeft, fluxTrialStarted, fluxUnlocked } = useVelaStore();
  const [active, setActive] = useState(false);
  const [fluxLogs, setFluxLogs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('log');
  const [entry, setEntry] = useState({ symptoms:[] as string[], stress:3, sleep:7, exercise:'none', alcohol:false, caffeine:false, food:'', weather:'' });

  const handleStart = async () => {
    await startFluxTrial();
    setActive(true);
  };

  const saveEntry = () => {
    setFluxLogs([{ ...entry, id:Date.now(), date:new Date().toLocaleDateString() }, ...fluxLogs]);
    setEntry({ symptoms:[], stress:3, sleep:7, exercise:'none', alcohol:false, caffeine:false, food:'', weather:'' });
    setShowForm(false);
  };

  const toggleSym = (s: string) => {
    setEntry(e => ({ ...e, symptoms: e.symptoms.includes(s) ? e.symptoms.filter(x=>x!==s) : [...e.symptoms, s] }));
  };

  const isActive = active || (fluxTrialStarted !== null && (fluxDaysLeft ?? 0) > 0) || fluxUnlocked;

  if (!isActive) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.logoText}>vela</Text><Text style={styles.subText}>your shift. your terms.</Text></View>
      <ScrollView contentContainerStyle={styles.content}><TrialGate onStart={handleStart} /></ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.logoText}>vela</Text><Text style={styles.subText}>your shift. your terms.</Text></View>
      <ScrollView contentContainerStyle={styles.content}>

        {fluxTrialStarted && !fluxUnlocked && fluxDaysLeft !== null && (
          <View style={styles.trialBanner}>
            <View>
              <Text style={styles.trialBannerTitle}>{fluxDaysLeft} day{fluxDaysLeft!==1?'s':''} left in your free trial</Text>
              <Text style={styles.trialBannerSub}>Then $4.99/month · cancel anytime</Text>
            </View>
            <TouchableOpacity style={styles.unlockBtn}><Text style={styles.unlockBtnText}>Unlock ✦</Text></TouchableOpacity>
          </View>
        )}

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>FluxLog</Text>
            <Text style={styles.pageSub}>Symptom + trigger intelligence</Text>
          </View>
          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ log today</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subTabRow}>
          {['log','patterns'].map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)} style={[styles.subTab, { borderColor:view===v?Colors.teal:Colors.parchmentDark, backgroundColor:view===v?Colors.teal:Colors.cream }]}>
              <Text style={[styles.subTabText, { color:view===v?Colors.cream:Colors.mist }]}>{v.charAt(0).toUpperCase()+v.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {view==='log' && (
          <>
            {fluxLogs.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>◎</Text>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyText}>Log your symptoms and triggers daily — patterns unlock after 3 entries.</Text>
                <TouchableOpacity onPress={() => setShowForm(true)} style={styles.logButton}>
                  <Text style={styles.logButtonText}>Log my first entry →</Text>
                </TouchableOpacity>
              </View>
            )}
            {fluxLogs.map((log, i) => (
              <View key={log.id} style={styles.logCard}>
                <Text style={styles.logDate}>{log.date}</Text>
                {log.symptoms.length > 0 && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                    {log.symptoms.map((s:string) => (
                      <View key={s} style={styles.symChip}><Text style={styles.symChipText}>{s}</Text></View>
                    ))}
                  </View>
                )}
                <View style={styles.logMeta}>
                  <Text style={styles.logMetaText}>😴 Sleep: {log.sleep}h</Text>
                  <Text style={styles.logMetaText}>💧 Stress: {log.stress}/5</Text>
                  {log.alcohol && <Text style={[styles.logMetaText, { color:Colors.rose }]}>🍷 Alcohol</Text>}
                  {log.caffeine && <Text style={styles.logMetaText}>☕ Caffeine</Text>}
                  {log.food ? <Text style={styles.logMetaText}>🍽 {log.food}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {view==='patterns' && (
          <>
            {fluxLogs.length < 3 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>◎</Text>
                <Text style={styles.emptyTitle}>Log {3-fluxLogs.length} more {3-fluxLogs.length===1?'entry':'entries'} to unlock patterns</Text>
                <Text style={styles.emptyText}>Vela needs at least 3 entries to start detecting meaningful correlations.</Text>
              </View>
            ) : (
              <>
                <View style={[styles.patternCard, { backgroundColor:Colors.tealPale, borderColor:Colors.teal }]}>
                  <Text style={[styles.patternLabel, { color:Colors.teal }]}>◎ Pattern detected</Text>
                  <Text style={styles.patternTitle}>Sleep under 6h → more symptoms next day</Text>
                  <Text style={styles.patternDesc}>On nights with under 6 hours of sleep, your next-day symptom count is significantly higher.</Text>
                </View>
                {fluxLogs.some((l:any)=>l.alcohol) && (
                  <View style={[styles.patternCard, { backgroundColor:Colors.rosePale, borderColor:Colors.rose }]}>
                    <Text style={[styles.patternLabel, { color:Colors.rose }]}>◎ Pattern detected</Text>
                    <Text style={styles.patternTitle}>Alcohol logged → night sweats likely</Text>
                    <Text style={styles.patternDesc}>Alcohol appears alongside night sweats in the majority of your logs.</Text>
                  </View>
                )}
                <View style={[styles.patternCard, { backgroundColor:Colors.sagePale, borderColor:Colors.sage }]}>
                  <Text style={[styles.patternLabel, { color:Colors.sage }]}>◎ Positive pattern</Text>
                  <Text style={styles.patternTitle}>Exercise days → fewer symptoms</Text>
                  <Text style={styles.patternDesc}>On days you log exercise, your average symptom count is lower.</Text>
                </View>
              </>
            )}
          </>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log today</Text>

            <Text style={styles.formLabel}>Symptoms</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {SYMPTOMS.slice(0,12).map(s => {
                const on = entry.symptoms.includes(s);
                return (
                  <TouchableOpacity key={s} onPress={() => toggleSym(s)} style={[styles.symBtn, { borderColor:on?Colors.rose:Colors.parchmentDark, backgroundColor:on?Colors.rosePale:Colors.parchment }]}>
                    <Text style={[styles.symBtnText, { color:on?Colors.rose:Colors.mist }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Stress level: {entry.stress}/5</Text>
            <View style={{ flexDirection:'row', gap:8, marginBottom:16 }}>
              {[1,2,3,4,5].map(v => (
                <TouchableOpacity key={v} onPress={() => setEntry(e=>({...e,stress:v}))} style={[styles.numBtn, { backgroundColor:entry.stress===v?Colors.rose:Colors.parchment, borderColor:entry.stress===v?Colors.rose:Colors.parchmentDark }]}>
                  <Text style={[styles.numBtnText, { color:entry.stress===v?Colors.cream:Colors.mist }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Hours slept: {entry.sleep}h</Text>
            <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:16 }}>
              {[4,5,6,7,8,9,10].map(v => (
                <TouchableOpacity key={v} onPress={() => setEntry(e=>({...e,sleep:v}))} style={[styles.numBtn, { backgroundColor:entry.sleep===v?Colors.indigo:Colors.parchment, borderColor:entry.sleep===v?Colors.indigo:Colors.parchmentDark }]}>
                  <Text style={[styles.numBtnText, { color:entry.sleep===v?Colors.cream:Colors.mist }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Exercise</Text>
            <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:16 }}>
              {['none','walked','strength','cardio','yoga'].map(v => (
                <TouchableOpacity key={v} onPress={() => setEntry(e=>({...e,exercise:v}))} style={[styles.numBtn, { backgroundColor:entry.exercise===v?Colors.sage:Colors.parchment, borderColor:entry.exercise===v?Colors.sage:Colors.parchmentDark, paddingHorizontal:12 }]}>
                  <Text style={[styles.numBtnText, { color:entry.exercise===v?Colors.cream:Colors.mist }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection:'row', gap:10, marginBottom:16 }}>
              <TouchableOpacity onPress={() => setEntry(e=>({...e,alcohol:!e.alcohol}))} style={[styles.toggleBtn, { borderColor:entry.alcohol?Colors.rose:Colors.parchmentDark, backgroundColor:entry.alcohol?Colors.rosePale:Colors.parchment }]}>
                <Text style={[styles.toggleBtnText, { color:entry.alcohol?Colors.rose:Colors.mist }]}>🍷 Alcohol</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEntry(e=>({...e,caffeine:!e.caffeine}))} style={[styles.toggleBtn, { borderColor:entry.caffeine?Colors.plum:Colors.parchmentDark, backgroundColor:entry.caffeine?Colors.indigoPale:Colors.parchment }]}>
                <Text style={[styles.toggleBtnText, { color:entry.caffeine?Colors.plum:Colors.mist }]}>☕ Caffeine</Text>
              </TouchableOpacity>
            </View>

            <TextInput value={entry.food} onChangeText={t => setEntry(e=>({...e,food:t}))} placeholder="Notable foods today..." placeholderTextColor={Colors.mist} style={styles.textInput} />
            <TextInput value={entry.weather} onChangeText={t => setEntry(e=>({...e,weather:t}))} placeholder="Weather / temperature..." placeholderTextColor={Colors.mist} style={[styles.textInput, { marginBottom:16 }]} />

            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={[styles.cancelBtn]}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEntry} style={[styles.saveBtn]}>
                <Text style={styles.saveBtnText}>Save entry ✦</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.parchment},
  header:{backgroundColor:Colors.plum,paddingHorizontal:20,paddingTop:16,paddingBottom:14},
  logoText:{fontFamily:Fonts.serif,fontSize:24,color:Colors.goldLight,letterSpacing:4},
  subText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,letterSpacing:3,textTransform:'uppercase',marginTop:1},
  content:{padding:20},
  gateContainer:{alignItems:'center',paddingVertical:20},
  gateIcon:{width:72,height:72,borderRadius:36,borderWidth:2,alignItems:'center',justifyContent:'center',marginBottom:20},
  gateGlyph:{fontSize:32},
  gateName:{fontFamily:Fonts.serif,fontSize:24,color:Colors.plum,marginBottom:8},
  gateDesc:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,textAlign:'center',lineHeight:22,marginBottom:24},
  featureGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:24},
  featureChip:{borderRadius:12,paddingVertical:10,paddingHorizontal:12},
  featureText:{fontFamily:Fonts.sans,fontSize:12},
  trialBox:{backgroundColor:Colors.goldPale,borderWidth:1,borderColor:Colors.gold,borderRadius:16,padding:16,marginBottom:20,width:'100%'},
  trialBoxTitle:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum,marginBottom:3},
  trialBoxSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  startButton:{backgroundColor:Colors.plum,borderRadius:30,paddingVertical:15,paddingHorizontal:40,width:'100%',alignItems:'center'},
  startButtonText:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.parchment,letterSpacing:1},
  trialBanner:{backgroundColor:Colors.goldPale,borderWidth:1,borderColor:Colors.gold,borderRadius:14,padding:12,marginBottom:16,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8},
  trialBannerTitle:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.plum},
  trialBannerSub:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  unlockBtn:{backgroundColor:Colors.gold,borderRadius:14,paddingVertical:7,paddingHorizontal:14},
  unlockBtnText:{fontFamily:Fonts.sansMedium,fontSize:11,color:Colors.plum},
  titleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8},
  pageTitle:{fontFamily:Fonts.serif,fontSize:24,color:Colors.plum},
  pageSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  addButton:{backgroundColor:Colors.teal,borderRadius:20,paddingVertical:9,paddingHorizontal:18},
  addButtonText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.cream,letterSpacing:1},
  subTabRow:{flexDirection:'row',gap:8,marginBottom:20},
  subTab:{paddingVertical:8,paddingHorizontal:18,borderRadius:20,borderWidth:1},
  subTabText:{fontFamily:Fonts.sans,fontSize:12},
  emptyCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:32,alignItems:'center'},
  emptyIcon:{fontSize:32,color:Colors.parchmentDark,marginBottom:12},
  emptyTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.plum,marginBottom:8,textAlign:'center'},
  emptyText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,textAlign:'center',lineHeight:20,marginBottom:20},
  logButton:{backgroundColor:Colors.plum,borderRadius:20,paddingVertical:12,paddingHorizontal:24},
  logButtonText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.parchment},
  logCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:16,padding:16,marginBottom:10},
  logDate:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum,marginBottom:8},
  logMeta:{flexDirection:'row',flexWrap:'wrap',gap:10},
  logMetaText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  symChip:{backgroundColor:Colors.rosePale,borderRadius:12,paddingVertical:3,paddingHorizontal:10,borderWidth:0.5,borderColor:Colors.rose},
  symChipText:{fontFamily:Fonts.sans,fontSize:11,color:Colors.rose},
  patternCard:{borderRadius:16,padding:16,marginBottom:12,borderWidth:0.5},
  patternLabel:{fontFamily:Fonts.sansMedium,fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:6},
  patternTitle:{fontFamily:Fonts.serif,fontSize:17,color:Colors.plum,marginBottom:6},
  patternDesc:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,lineHeight:18},
  formCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginTop:12},
  formTitle:{fontFamily:Fonts.serif,fontSize:20,color:Colors.plum,marginBottom:16},
  formLabel:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.plum,marginBottom:8},
  symBtn:{paddingVertical:6,paddingHorizontal:12,borderRadius:20,borderWidth:1},
  symBtnText:{fontFamily:Fonts.sans,fontSize:12},
  numBtn:{width:44,height:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center'},
  numBtnText:{fontFamily:Fonts.sans,fontSize:13},
  toggleBtn:{flex:1,padding:12,borderRadius:14,borderWidth:1,alignItems:'center'},
  toggleBtnText:{fontFamily:Fonts.sans,fontSize:13},
  textInput:{borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:12,padding:10,fontSize:13,fontFamily:Fonts.sans,color:Colors.plum,backgroundColor:Colors.parchment,marginBottom:10},
  cancelBtn:{flex:1,padding:12,borderRadius:14,borderWidth:0.5,borderColor:Colors.parchmentDark,alignItems:'center'},
  cancelBtnText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  saveBtn:{flex:2,padding:12,borderRadius:14,backgroundColor:Colors.plum,alignItems:'center'},
  saveBtnText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.parchment},
  indigoPale:{},
});
