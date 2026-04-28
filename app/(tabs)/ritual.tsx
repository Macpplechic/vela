import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { PHASES, SYMPTOMS } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

const { width } = Dimensions.get('window');

function detectTriggers(history: any[]): string | null {
  if (history.length < 7) return null;
  const recent = history.slice(-30);

  // Check if coffee correlates with hot flashes
  const coffeedays = recent.filter(e => e.foods.some((f: any) => f.name?.toLowerCase().includes('coffee')));
  const hotFlashDays = recent.filter(e => e.symptoms.includes('Hot flash'));

  if (coffeedays.length >= 3 && hotFlashDays.length >= 3) {
    const overlap = coffeedays.filter(cd =>
      hotFlashDays.some(hd => hd.date === cd.date)
    ).length;
    const pct = Math.round((overlap / coffeedays.length) * 100);
    if (pct >= 60) return `☕ Hot flashes on ${pct}% of days you had coffee — consider reducing or switching to matcha`;
  }

  // Check alcohol + night sweats
  const alcoholDays = recent.filter(e => e.foods.some((f: any) => f.name?.toLowerCase().includes('alcohol') || f.name?.toLowerCase().includes('wine') || f.name?.toLowerCase().includes('beer')));
  const nightSweatDays = recent.filter(e => e.symptoms.includes('Night sweats'));
  if (alcoholDays.length >= 2 && nightSweatDays.length >= 2) {
    const overlap = alcoholDays.filter(ad => nightSweatDays.some(nd => nd.date === ad.date)).length;
    if (overlap >= 2) return `🍷 Night sweats on ${overlap} of ${alcoholDays.length} days with alcohol — this is a common trigger`;
  }

  // Low protein + brain fog
  const lowProteinDays = recent.filter(e => e.totals.protein < 60 && e.foods.length > 0);
  const brainFogDays = recent.filter(e => e.symptoms.includes('Brain fog'));
  if (lowProteinDays.length >= 3 && brainFogDays.length >= 3) {
    const overlap = lowProteinDays.filter(ld => brainFogDays.some(bd => bd.date === ld.date)).length;
    if (overlap >= 2) return `🧠 Brain fog appears on low-protein days — try to hit 100g+ protein daily`;
  }

  // Good streak — positive insight
  if (history.length >= 7) {
    const last7 = history.slice(-7);
    const avgProtein = last7.reduce((a: number, e: any) => a + (e.totals.protein || 0), 0) / 7;
    if (avgProtein > 90) return `✦ Great week — your protein averaged ${Math.round(avgProtein)}g/day. This supports muscle, mood and hormones.`;
  }

  return null;
}

export default function RitualScreen() {
  const {
    phase, mySuppsData, checkedSupps, setCheckedSupps,
    symptoms, setSymptoms, journal, setJournal,
    totals, foods, streak, lastStreakDate, incrementStreak, history: velaHistory, history,
  } = useVelaStore();
  const [journalSaved, setJournalSaved] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(0);

  const pd = PHASES[phase ?? 'late'];
  const pct = (v: number, m: number) => Math.min(100, Math.round((v / m) * 100));
  const score = Math.round((
    pct(totals.protein, pd.targets.protein) +
    pct(totals.fiber, pd.targets.fiber) +
    pct(totals.calcium, pd.targets.calcium) +
    pct(totals.omega3, pd.targets.omega3)
  ) / 4);
  const aiScore = foods.length > 0 ? Math.min(100, Math.round((totals.ai / (foods.length * 10)) * 100)) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "🌿" : hour < 17 ? "☀️" : "🌙";
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const toggleSymptom = async (s: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = symptoms.includes(s) ? symptoms.filter(x => x !== s) : [...symptoms, s];
    await setSymptoms(next);
  };

  const toggleSupp = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = checkedSupps.includes(id) ? checkedSupps.filter(x => x !== id) : [...checkedSupps, id];
    await setCheckedSupps(next);
    await incrementStreak(streak, lastStreakDate);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>vela</Text>
          <Text style={styles.subText}>your shift. your terms.</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text allowFontScaling={false} style={styles.streakText}>🔥 {streak} day streak</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.push('/quiz')} style={styles.phaseBadge}>
            <Text allowFontScaling={false} style={styles.phaseBadgeText}>{pd.glyph} {pd.label}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.greeting}>{greeting}, beautiful. {greetingEmoji}</Text>
        {streak >= 3 && (
          <View style={styles.streakCelebration}>
            <Text style={styles.streakCelebrationText}>{
              streak >= 365 ? '👑 A full year. You changed your life.' :
              streak >= 30 ? `🌙 ${streak} days — you are unstoppable` :
              streak >= 14 ? `💎 ${streak} days — two weeks strong` :
              streak >= 7 ? '🏆 One full week. Keep going.' :
              '🎉 3-day streak — you are building something real'
            }</Text>
          </View>
        )}
        <Text style={styles.subtitle}>Your 5-minute morning ritual awaits.</Text>

        {velaHistory.length === 0 && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome to Vela ✦</Text>
            <Text style={styles.welcomeSub}>HERE IS WHAT TO DO EACH DAY</Text>
            {[['◈','Ritual','Check off supplements and log symptoms'],['◇','Plate','Log food for hormone insights'],['◎','FluxLog','Track your cycle patterns'],['◇','CoolDown','Guided hot flash relief'],['✦','Profile','Build your supplement stack']].map(([g,tab,desc]) => (
              <View key={tab} style={styles.welcomeRow}>
                <Text style={styles.welcomeGlyph}>{g as string}</Text>
                <View style={{ flex:1 }}>
                  <Text style={styles.welcomeTab}>{tab as string}</Text>
                  <Text style={styles.welcomeDesc}>{desc as string}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.ritualCard, { backgroundColor: pd.bg, borderLeftColor: pd.color }]}>
          <Text style={[styles.ritualLabel, { color: pd.color }]}>Today's ritual · {pd.label}</Text>
          <Text style={styles.ritualText}>{pd.ritual}</Text>
        </View>

        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>This week</Text>
          <View style={styles.weeklyRow}>
            {[0,1,2,3,4,5,6].map(i => {
              const d = new Date(); d.setDate(d.getDate() - (6-i));
              const ds = d.toISOString().split('T')[0];
              const hasEntry = history.some(e => e.date === ds);
              const isToday = ds === new Date().toISOString().split('T')[0];
              return (
                <View key={i} style={[styles.weekDay, hasEntry && styles.weekDayDone, isToday && styles.weekDayToday]}>
                  <Text style={[styles.weekDayLetter, hasEntry && styles.weekDayLetterDone]}>
                    {['S','M','T','W','T','F','S'][d.getDay()]}
                  </Text>
                  {hasEntry && <Text style={styles.weekDayDot}>✦</Text>}
                </View>
              );
            })}
          </View>
          <Text style={styles.weeklyMotivation}>
            {streak >= 7 ? `🔥 ${streak} day streak — you're unstoppable` :
             streak >= 3 ? `🔥 ${streak} days strong — keep it going` :
             streak === 1 ? 'Day 1 — every streak starts here ✦' :
             'Log today to start your streak ◇'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Your hormone score</Text>
              {foods.length > 0 && <Text style={styles.aiScore}>{aiScore >= 70 ? '✦ Strong anti-inflammatory day' : aiScore >= 40 ? '✦ Building your score — add more plants' : '✦ Start logging food to build your score'}</Text>}
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreNum, { color: score > 60 ? Colors.sage : Colors.rose }]}>{score}</Text>
              <Text style={styles.scoreDenom}>/100</Text>
            </View>
          </View>
          {[
            { label:'Protein', v:totals.protein, t:pd.targets.protein, u:'g' },
            { label:'Fiber', v:totals.fiber, t:pd.targets.fiber, u:'g' },
            { label:'Calcium', v:totals.calcium, t:pd.targets.calcium, u:'mg' },
            { label:'Omega-3', v:totals.omega3, t:pd.targets.omega3, u:'g' },
            { label:'Phytoestrogens', v:totals.phyto, t:pd.targets.phyto, u:'mg' },
          ].map(n => (
            <View key={n.label} style={styles.nutrientRow}>
              <View style={styles.nutrientLabels}>
                <Text style={styles.nutrientName}>{n.label}</Text>
                <Text style={styles.nutrientVal}>{n.label==='Omega-3'?n.v.toFixed(1):Math.round(n.v)}{n.u} / {n.t}{n.u}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width:`${pct(n.v,n.t)}%` as any, backgroundColor: pct(n.v,n.t)>=80?Colors.sage:Colors.gold }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hydration today 💧</Text>
          <Text style={styles.cardSub}>Dehydration amplifies hot flashes & brain fog</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8}}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
              <TouchableOpacity key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWaterCount(waterCount === n ? n - 1 : n); }}
                style={{width:36,height:36,borderRadius:18,
                  backgroundColor: n <= waterCount ? (n > 10 ? '#00b4d8' : Colors.teal) : Colors.parchmentDark,
                  alignItems:'center', justifyContent:'center',
                  transform:[{scale: n <= waterCount ? 1.05 : 1}]}}>
                <Text style={{fontSize:16}}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{fontFamily:Fonts.sans, fontSize:11, color: waterCount >= 12 ? '#00b4d8' : waterCount >= 8 ? Colors.teal : Colors.mist}}>
            {waterCount === 0 ? 'Tap each glass as you drink — aim for 8, go wild with 15 💧' :
             waterCount >= 15 ? '🌊 LEGEND. 15 glasses. Your cells are thriving.' :
             waterCount >= 12 ? `🔥 ${waterCount} glasses — absolutely crushing it` :
             waterCount >= 8 ? `✦ ${waterCount} glasses — fully hydrated!` :
             `${waterCount} of 8 glasses — ${8 - waterCount} more to go`}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <Text style={[styles.cardTitle, { flex:1, marginBottom:0, fontSize:16 }]}>Morning supplement ritual</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ borderWidth:1, borderColor:Colors.gold, borderRadius:14, paddingVertical:4, paddingHorizontal:10 }}>
              <Text style={{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold }}>+ manage</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>{mySuppsData.length===0?'Add supplements to track your morning ritual':`${checkedSupps.length} of ${mySuppsData.length} taken today`}</Text>
          {(mySuppsData as any[]).map((s: any) => {
            const on = checkedSupps.includes(s.id);
            return (
              <TouchableOpacity key={s.id} style={styles.suppRow} onPress={() => toggleSupp(s.id)} activeOpacity={0.7}>
                <View style={[styles.checkbox, { borderColor: on ? Colors.sage : Colors.mist, backgroundColor: on ? Colors.sage : 'transparent' }]}>
                  {on && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.suppInfo}>
                  <Text style={styles.suppName}>{s.icon} {s.name}</Text>
                  <Text style={styles.suppDose}>{s.dose}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How is your body today?</Text>
          <Text style={styles.cardSub}>Over 40 symptoms are linked to hormonal change</Text>
          <View style={styles.symptomGrid}>
            {SYMPTOMS.map(s => {
              const on = symptoms.includes(s);
              return (
                <TouchableOpacity key={s} style={[styles.symptomChip, { borderColor: on?Colors.rose:Colors.parchmentDark, backgroundColor: on?Colors.rosePale:Colors.cream }]} onPress={() => toggleSymptom(s)} activeOpacity={0.7}>
                  <Text style={[styles.symptomText, { color: on?Colors.rose:Colors.mist }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {symptoms.length > 0 && <Text style={styles.symptomNote}>{symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} logged today ✓</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How did you sleep? 🌙</Text>
          <Text style={styles.cardSub}>Sleep quality directly affects hot flash frequency</Text>
          <View style={{flexDirection:'row', gap:8, marginTop:12}}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSleepQuality(n); }}
                style={{flex:1, alignItems:'center', paddingVertical:12, borderRadius:12,
                  backgroundColor: sleepQuality===n ? Colors.plum : Colors.parchment,
                  borderWidth:1, borderColor: sleepQuality===n ? Colors.plum : Colors.parchmentDark}}>
                <Text style={{fontSize:22}}>{['😴','😐','🙂','😊','✨'][n-1]}</Text>
                <Text style={{fontFamily:Fonts.sans, fontSize:10, color: sleepQuality===n ? Colors.parchment : Colors.mist, marginTop:3}}>
                  {['poor','okay','good','great','amazing'][n-1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {sleepQuality > 0 && (
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:12}}>
              <Text style={{fontFamily:Fonts.sans, fontSize:12, color:Colors.sage}}>
                ✓ {['poor','okay','good','great','amazing'][sleepQuality-1]} sleep selected
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await saveSleepEntry(
                    { quality: sleepQuality, nightSweats: false, wakeCount: 0, notes: '' },
                    sleepHistory
                  );
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Sleep logged ✦', 'Your sleep quality has been saved to your history.');
                  setSleepQuality(0);
                }}
                style={{backgroundColor:Colors.plum, borderRadius:20, paddingVertical:8, paddingHorizontal:18}}>
                <Text style={{fontFamily:Fonts.sans, fontSize:12, color:Colors.parchment}}>Save sleep</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evening reflection</Text>
          <Text style={[styles.cardSub, { fontStyle:'italic' }]}>What did your body do well today?</Text>
          <TextInput
            style={styles.journalInput}
            value={journal}
            onChangeText={(t) => { setJournal(t); setJournalSaved(false); }}
            placeholder="Write freely, without judgment..."
            placeholderTextColor={Colors.mist}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.saveButton} onPress={async () => { await setJournal(journal); setJournalSaved(true); }} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>{journalSaved ? '✓ Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor: Colors.parchment },
  header: { backgroundColor: Colors.plum, paddingHorizontal:20, paddingTop:12, paddingBottom:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 },
  logoText: { fontFamily: Fonts.serif, fontSize:24, color: Colors.goldLight, letterSpacing:4 },
  subText: { fontFamily: Fonts.sans, fontSize:10, color: Colors.mist, letterSpacing:3, textTransform:'uppercase', marginTop:1 },
  phaseBadge: { borderWidth:1, borderColor: Colors.plumLight, borderRadius:20, paddingVertical:5, paddingHorizontal:14, maxWidth:180 },
  streakBadge: { backgroundColor: Colors.gold, borderRadius:12, paddingVertical:3, paddingHorizontal:10 },
  streakText: { fontFamily: Fonts.sans, fontSize:11, color: Colors.plum },
  phaseBadgeText: { fontFamily: Fonts.sans, fontSize:11, color: Colors.goldLight, letterSpacing:1, flexShrink:1 },
  scroll: { flex:1 },
  content: { padding:20 },
  dateText: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4 },
  greeting: { fontFamily: Fonts.serif, fontSize:26, color: Colors.plum, marginBottom:4 },
  subtitle: { fontFamily: Fonts.sans, fontSize:13, color: Colors.mist, marginBottom:24 },
  ritualCard: { borderRadius:20, padding:20, marginBottom:14, borderLeftWidth:3 },
  ritualLabel: { fontFamily: Fonts.sansMedium, fontSize:10, letterSpacing:3, textTransform:'uppercase', marginBottom:8 },
  ritualText: { fontFamily: Fonts.sans, fontSize:14, color: Colors.plum, lineHeight:22 },
  card: { backgroundColor: Colors.cream, borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12 },
  cardTitle: { fontFamily: Fonts.serif, fontSize:18, color: Colors.plum, marginBottom:4 },
  cardSub: { fontFamily: Fonts.sans, fontSize:12, color: Colors.mist, marginBottom:14 },
  scoreRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  scoreBox: { alignItems:'flex-end' },
  scoreNum: { fontFamily: Fonts.sansMedium, fontSize:36, lineHeight:40 },
  scoreDenom: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist },
  aiScore: { fontFamily: Fonts.sans, fontSize:11, color: Colors.sage, marginTop:3 },
  nutrientRow: { marginBottom:10 },
  nutrientLabels: { flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  nutrientName: { fontFamily: Fonts.sans, fontSize:12, color: Colors.mist },
  nutrientVal: { fontFamily: Fonts.sans, fontSize:12, color: Colors.plum },
  barTrack: { backgroundColor: Colors.parchmentDark, borderRadius:3, height:5, overflow:'hidden' },
  barFill: { height:'100%' as any, borderRadius:3 },
  suppRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, borderBottomWidth:0.5, borderBottomColor: Colors.parchmentDark },
  checkbox: { width:22, height:22, borderRadius:6, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  checkmark: { color: Colors.cream, fontSize:11, fontFamily: Fonts.sansMedium },
  suppInfo: { flex:1 },
  suppName: { fontFamily: Fonts.sans, fontSize:13, color: Colors.plum },
  suppDose: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist },
  symptomGrid: { flexDirection:'row', flexWrap:'wrap', gap:7 },
  symptomChip: { paddingVertical:6, paddingHorizontal:13, borderRadius:20, borderWidth:1 },
  symptomText: { fontFamily: Fonts.sans, fontSize:12 },
  symptomNote: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist, marginTop:10 },
  journalInput: { borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:12, padding:12, fontSize:13, fontFamily: Fonts.sans, color: Colors.plum, backgroundColor: Colors.parchment, minHeight:80, textAlignVertical:'top', marginBottom:10 },
  saveButton: { backgroundColor: Colors.plum, borderRadius:20, paddingVertical:8, paddingHorizontal:20, alignSelf:'flex-start' },
  saveButtonText: { fontFamily: Fonts.sans, fontSize:12, color: Colors.parchment },
  weeklyCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:12},
  weeklyTitle:{fontFamily:Fonts.sansMedium,fontSize:11,color:Colors.mist,letterSpacing:2,textTransform:'uppercase',marginBottom:12},
  weeklyRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:12},
  weekDay:{width:36,height:48,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:Colors.parchment,borderWidth:0.5,borderColor:Colors.parchmentDark,gap:2},
  weekDayDone:{backgroundColor:Colors.plum,borderColor:Colors.plum},
  weekDayToday:{borderColor:Colors.gold,borderWidth:1.5},
  weekDayLetter:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  weekDayLetterDone:{color:Colors.parchment},
  weekDayDot:{fontSize:8,color:Colors.gold},
  weeklyMotivation:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,textAlign:'center'},
  streakCelebration:{backgroundColor:Colors.gold,borderRadius:14,paddingVertical:10,paddingHorizontal:16,marginBottom:16,alignItems:'center'},
  streakCelebrationText:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum,textAlign:'center'},
  welcomeCard: { backgroundColor: Colors.plum, borderRadius: 20, padding: 20, marginBottom: 20 },
  welcomeTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.goldLight, marginBottom: 4 },
  welcomeSub: { fontFamily: Fonts.sans, fontSize: 10, color: 'rgba(245,239,230,0.6)', marginBottom: 14, letterSpacing: 2 },
  welcomeRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  welcomeGlyph: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.gold, marginTop: 2 },
  welcomeTab: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.goldLight, marginBottom: 1 },
  welcomeDesc: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(245,239,230,0.65)', lineHeight: 17 },
});
