import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/Colors';
import { BREATHWORK, SOMATIC } from '../../constants/Data';
import { useVelaStore, SleepEntry } from '../../hooks/useVelaStore';

const QUALITY_LABELS = ['','Poor','Fair','Good','Great','Deep'];
const QUALITY_COLORS = ['',Colors.rose,Colors.rose,Colors.gold,Colors.sage,Colors.teal];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const todayStr = () => new Date().toISOString().split('T')[0];

export default function CoolScreen() {
  const { startCoolTrial, coolDaysLeft, coolTrialStarted, coolUnlocked, sleepHistory, saveSleepEntry } = useVelaStore();
  const [active, setActive] = useState(false);
  const [coolView, setCoolView] = useState('breathwork');

  // Breathwork
  const [activeBreath, setActiveBreath] = useState<any>(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [breathProgress, setBreathProgress] = useState(0);
  const [breathRunning, setBreathRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Sleep log — pre-fill from today's saved entry if exists
  const todayEntry = sleepHistory.find(e => e.date === todayStr());
  const [sleepQuality, setSleepQuality] = useState<number|null>(todayEntry?.quality ?? null);
  const [nightSweats, setNightSweats] = useState(todayEntry?.nightSweats ?? false);
  const [wakeCount, setWakeCount] = useState(todayEntry?.wakeCount ?? 0);
  const [sleepSaved, setSleepSaved] = useState(!!todayEntry);

  // Sleep history browsing
  const [showSleepHistory, setShowSleepHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  });

  const isActive = active || (coolTrialStarted !== null && (coolDaysLeft ?? 0) > 0) || coolUnlocked;
  const handleStart = async () => { await startCoolTrial(); setActive(true); };

  // Breathwork timer
  const startBreath = (ex: any) => {
    setActiveBreath(ex); setBreathPhase(0); setBreathCount(0); setBreathProgress(0); setBreathRunning(true);
  };
  const stopBreath = () => {
    setBreathRunning(false); setActiveBreath(null); clearInterval(timerRef.current);
  };
  useEffect(() => {
    if (!breathRunning || !activeBreath) return;
    let elapsed = 0;
    const step = activeBreath.steps[breathPhase];
    timerRef.current = setInterval(() => {
      elapsed += 0.1;
      setBreathProgress(Math.min(100, (elapsed / step.secs) * 100));
      if (elapsed >= step.secs) {
        elapsed = 0; setBreathProgress(0);
        const nextPhase = (breathPhase + 1) % activeBreath.steps.length;
        setBreathPhase(nextPhase);
        if (nextPhase === 0) setBreathCount(c => c + 1);
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [breathRunning, breathPhase, activeBreath]);

  // Save sleep
  const handleSaveSleep = async () => {
    const entry: SleepEntry = { date: todayStr(), quality: sleepQuality, nightSweats, wakeCount, notes: '' };
    await saveSleepEntry(entry, sleepHistory);
    setSleepSaved(true);
  };

  // 90-day sleep snapshot
  const sleepStats = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const recent = sleepHistory.filter(e => new Date(e.date) >= cutoff);
    if (recent.length === 0) return null;
    const withQ = recent.filter(e => e.quality);
    const avgQuality = withQ.length > 0 ? withQ.reduce((a,e) => a+(e.quality??0), 0) / withQ.length : 0;
    const nightSweatDays = recent.filter(e => e.nightSweats).length;
    const avgWakes = recent.reduce((a,e) => a+e.wakeCount, 0) / recent.length;
    // Quality trend: compare first half vs second half
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(mid).filter(e=>e.quality);
    const secondHalf = recent.slice(0, mid).filter(e=>e.quality);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a,e)=>a+(e.quality??0),0)/firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a,e)=>a+(e.quality??0),0)/secondHalf.length : 0;
    const trend = secondAvg - firstAvg;
    return { count: recent.length, avgQuality, nightSweatDays, avgWakes, trend };
  }, [sleepHistory]);

  // Month browser
  const availableMonths = useMemo(() => {
    const months = [...new Set(sleepHistory.map(e => e.date.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
    const nowStr = (() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
    if (!months.includes(nowStr)) months.unshift(nowStr);
    return months;
  }, [sleepHistory]);

  const monthEntries = useMemo(() =>
    sleepHistory.filter(e => e.date.startsWith(selectedMonth)).sort((a,b)=>b.date.localeCompare(a.date)),
  [sleepHistory, selectedMonth]);

  const monthLabel = (ym: string) => {
    const [y,m] = ym.split('-');
    return `${MONTH_NAMES[parseInt(m)-1]} ${y}`;
  };

  const monthStats = useMemo(() => {
    if (monthEntries.length === 0) return null;
    const withQ = monthEntries.filter(e => e.quality);
    const avgQ = withQ.length > 0 ? withQ.reduce((a,e)=>a+(e.quality??0),0)/withQ.length : 0;
    const sweats = monthEntries.filter(e=>e.nightSweats).length;
    const avgW = monthEntries.reduce((a,e)=>a+e.wakeCount,0)/monthEntries.length;
    return { logged: monthEntries.length, avgQ, sweats, avgW };
  }, [monthEntries]);

  // ── Gate screen ───────────────────────────────────────────────────────────
  if (!isActive) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.logoText}>vela</Text>
        <Text allowFontScaling={false} style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gateContainer}>
          <View style={[styles.gateIcon, { backgroundColor:Colors.indigoPale, borderColor:Colors.indigo }]}>
            <Text allowFontScaling={false} style={[styles.gateGlyph, { color:Colors.indigo }]}>◌</Text>
          </View>
          <Text allowFontScaling={false} style={styles.gateName}>CoolDown</Text>
          <Text allowFontScaling={false} style={styles.gateDesc}>Guided breathwork, somatic techniques, and a 90-day sleep tracker — everything you need to calm your nervous system and sleep through the night.</Text>
          <View style={styles.featureGrid}>
            {['4 breathing protocols','5 somatic techniques','90-day sleep history','Night sweat tracking'].map(f=>(
              <View key={f} style={[styles.featureChip,{backgroundColor:Colors.indigoPale}]}>
                <Text allowFontScaling={false} style={[styles.featureText,{color:Colors.plum}]}>✦ {f}</Text>
              </View>
            ))}
          </View>
          <View style={styles.trialBox}>
            <Text allowFontScaling={false} style={styles.trialBoxTitle}>7-day free trial</Text>
            <Text allowFontScaling={false} style={styles.trialBoxSub}>Then $4.99/month or included in Vela Premium. Cancel anytime.</Text>
          </View>
          <TouchableOpacity onPress={handleStart} style={styles.startButton}>
            <Text allowFontScaling={false} style={styles.startButtonText}>Start free trial →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.logoText}>vela</Text>
        <Text allowFontScaling={false} style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        {coolTrialStarted && !coolUnlocked && coolDaysLeft !== null && (
          <View style={styles.trialBanner}>
            <View style={{flex:1}}>
              <Text allowFontScaling={false} style={styles.trialBannerTitle}>{coolDaysLeft} day{coolDaysLeft!==1?'s':''} left in your free trial</Text>
              <Text allowFontScaling={false} style={styles.trialBannerSub}>Then $4.99/month · cancel anytime</Text>
            </View>
            <TouchableOpacity style={styles.unlockBtn}>
              <Text allowFontScaling={false} style={styles.unlockBtnText}>Unlock ✦</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text allowFontScaling={false} style={styles.pageTitle}>CoolDown</Text>
        <Text allowFontScaling={false} style={styles.pageSub}>Nervous system & sleep coach</Text>

        {/* ── 90-day sleep snapshot ── */}
        {sleepStats ? (
          <View style={styles.snapshotCard}>
            <Text allowFontScaling={false} style={styles.snapshotTitle}>90-day sleep snapshot</Text>
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotStat}>
                <Text allowFontScaling={false} style={[styles.snapshotNum, {color: sleepStats.avgQuality >= 3 ? Colors.sage : Colors.rose}]}>
                  {sleepStats.avgQuality.toFixed(1)}
                </Text>
                <Text allowFontScaling={false} style={styles.snapshotLabel}>avg quality{'\n'}/5</Text>
              </View>
              <View style={styles.snapshotDivider}/>
              <View style={styles.snapshotStat}>
                <Text allowFontScaling={false} style={styles.snapshotNum}>{sleepStats.count}</Text>
                <Text allowFontScaling={false} style={styles.snapshotLabel}>nights{'\n'}logged</Text>
              </View>
              <View style={styles.snapshotDivider}/>
              <View style={styles.snapshotStat}>
                <Text allowFontScaling={false} style={[styles.snapshotNum, {color: sleepStats.nightSweatDays > 20 ? Colors.rose : Colors.gold}]}>
                  {sleepStats.nightSweatDays}
                </Text>
                <Text allowFontScaling={false} style={styles.snapshotLabel}>night sweat{'\n'}nights</Text>
              </View>
              <View style={styles.snapshotDivider}/>
              <View style={styles.snapshotStat}>
                <Text allowFontScaling={false} style={[styles.snapshotNum, {color: sleepStats.avgWakes > 2 ? Colors.rose : Colors.sage}]}>
                  {sleepStats.avgWakes.toFixed(1)}
                </Text>
                <Text allowFontScaling={false} style={styles.snapshotLabel}>avg wake{'\n'}ups</Text>
              </View>
            </View>
            {sleepStats.trend !== 0 && (
              <View style={styles.trendRow}>
                <Text allowFontScaling={false} style={[styles.trendText, {color: sleepStats.trend > 0 ? Colors.sage : Colors.rose}]}>
                  {sleepStats.trend > 0 ? '↑ Sleep quality improving' : '↓ Sleep quality declining'} over the past 90 days
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.snapshotEmpty}>
            <Text allowFontScaling={false} style={styles.snapshotEmptyText}>Log sleep nightly — your 90-day snapshot will appear here.</Text>
          </View>
        )}

        {/* ── Tabs ── */}
        <View style={styles.subTabRow}>
          {['breathwork','somatic','sleep'].map(v => (
            <TouchableOpacity key={v} onPress={() => { setCoolView(v); stopBreath(); }}
              style={[styles.subTab, {borderColor:coolView===v?Colors.indigo:Colors.parchmentDark, backgroundColor:coolView===v?Colors.indigo:Colors.cream}]}>
              <Text allowFontScaling={false} style={[styles.subTabText, {color:coolView===v?Colors.cream:Colors.mist}]}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BREATHWORK ── */}
        {coolView==='breathwork' && !activeBreath && (
          <>
            <Text allowFontScaling={false} style={styles.sectionDesc}>Breathwork activates your parasympathetic nervous system — calming hot flashes, reducing cortisol, and preparing your body for deep sleep.</Text>
            {BREATHWORK.map(ex => (
              <View key={ex.id} style={styles.card}>
                <View style={{flex:1, marginBottom:10}}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap'}}>
                    <Text allowFontScaling={false} style={styles.breathName}>{ex.name}</Text>
                    <View style={styles.breathTag}>
                      <Text allowFontScaling={false} style={styles.breathTagText}>{ex.tag}</Text>
                    </View>
                  </View>
                  <Text allowFontScaling={false} style={styles.breathDur}>◌ {ex.duration}</Text>
                  <Text allowFontScaling={false} style={styles.breathDesc}>{ex.desc}</Text>
                </View>
                <View style={styles.stepsRow}>
                  {ex.steps.map((s:any,i:number) => (
                    <View key={i} style={[styles.stepChip, {backgroundColor:`${s.color}20`, borderColor:s.color}]}>
                      <Text allowFontScaling={false} style={[styles.stepChipText, {color:s.color}]}>{s.label} {s.secs}s</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={() => startBreath(ex)} style={styles.beginButton}>
                  <Text allowFontScaling={false} style={styles.beginButtonText}>Begin ◌</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ── ACTIVE BREATHWORK ── */}
        {coolView==='breathwork' && activeBreath && (
          <View style={styles.activeCard}>
            <Text allowFontScaling={false} style={styles.activeTitle}>{activeBreath.name}</Text>
            <View style={styles.circleContainer}>
              <View style={styles.circleOuter}>
                <View style={[styles.circleInner, {backgroundColor:activeBreath.steps[breathPhase].color, opacity:0.15+(breathProgress/100)*0.35}]}/>
                <View style={styles.circleText}>
                  <Text allowFontScaling={false} style={[styles.circlePhase, {color:activeBreath.steps[breathPhase].color}]}>{activeBreath.steps[breathPhase].label}</Text>
                  <Text allowFontScaling={false} style={styles.circleCount}>Round {breathCount+1}</Text>
                </View>
              </View>
            </View>
            <View style={styles.dotsRow}>
              {activeBreath.steps.map((_:any,i:number) => (
                <View key={i} style={[styles.dot, {backgroundColor:i===breathPhase?activeBreath.steps[breathPhase].color:Colors.parchmentDark}]}/>
              ))}
            </View>
            <TouchableOpacity onPress={stopBreath} style={styles.endButton}>
              <Text allowFontScaling={false} style={styles.endButtonText}>End session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SOMATIC ── */}
        {coolView==='somatic' && (
          <>
            <Text allowFontScaling={false} style={styles.sectionDesc}>Somatic techniques work directly on the body's stress response — discharging tension, grounding anxious energy, and preparing the nervous system for sleep.</Text>
            {SOMATIC.map(t => (
              <View key={t.id} style={styles.card}>
                <View style={styles.somaticHeader}>
                  <Text allowFontScaling={false} style={styles.somaticName}>{t.name}</Text>
                  <View style={styles.durBadge}>
                    <Text allowFontScaling={false} style={styles.durBadgeText}>◌ {t.duration}</Text>
                  </View>
                </View>
                <Text allowFontScaling={false} style={styles.somaticDesc}>{t.desc}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── SLEEP LOG ── */}
        {coolView==='sleep' && (
          <>
            {/* Today's log */}
            <View style={styles.card}>
              <Text allowFontScaling={false} style={styles.cardTitle}>Last night's sleep</Text>

              <Text allowFontScaling={false} style={styles.formLabel}>Overall quality</Text>
              <View style={{flexDirection:'row', gap:6, marginBottom:16, flexWrap:'wrap'}}>
                {[{v:1,l:'Poor'},{v:2,l:'Fair'},{v:3,l:'Good'},{v:4,l:'Great'},{v:5,l:'Deep'}].map(q=>(
                  <TouchableOpacity key={q.v} onPress={() => { setSleepQuality(q.v); setSleepSaved(false); }}
                    style={[styles.qualityBtn, {borderColor:sleepQuality===q.v?Colors.indigo:Colors.parchmentDark, backgroundColor:sleepQuality===q.v?Colors.indigoPale:Colors.cream}]}>
                    <Text allowFontScaling={false} style={[styles.qualityText, {color:sleepQuality===q.v?Colors.indigo:Colors.mist}]}>{q.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text allowFontScaling={false} style={styles.formLabel}>Night sweats</Text>
              <View style={{flexDirection:'row', gap:8, marginBottom:16}}>
                {['No','Yes'].map(v=>(
                  <TouchableOpacity key={v} onPress={() => { setNightSweats(v==='Yes'); setSleepSaved(false); }}
                    style={[styles.toggleBtn, {flex:1, borderColor:(nightSweats&&v==='Yes')||(!nightSweats&&v==='No')?Colors.rose:Colors.parchmentDark, backgroundColor:(nightSweats&&v==='Yes')||(!nightSweats&&v==='No')?Colors.rosePale:Colors.cream}]}>
                    <Text allowFontScaling={false} style={[styles.toggleBtnText, {color:(nightSweats&&v==='Yes')||(!nightSweats&&v==='No')?Colors.rose:Colors.mist}]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text allowFontScaling={false} style={styles.formLabel}>Times woken: {wakeCount}×</Text>
              <View style={{flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:20}}>
                {[0,1,2,3,4,5,6,7,8].map(v=>(
                  <TouchableOpacity key={v} onPress={() => { setWakeCount(v); setSleepSaved(false); }}
                    style={[styles.numBtn, {borderColor:wakeCount===v?Colors.indigo:Colors.parchmentDark, backgroundColor:wakeCount===v?Colors.indigoPale:Colors.cream}]}>
                    <Text allowFontScaling={false} style={[styles.numBtnText, {color:wakeCount===v?Colors.indigo:Colors.mist}]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleSaveSleep} style={styles.saveBtn}>
                <Text allowFontScaling={false} style={styles.saveBtnText}>{sleepSaved ? '✓ Sleep logged' : 'Save sleep log'}</Text>
              </TouchableOpacity>
            </View>

            {/* Sleep history */}
            <View style={styles.card}>
              <TouchableOpacity onPress={() => setShowSleepHistory(!showSleepHistory)} style={styles.historyToggleRow} activeOpacity={0.7}>
                <View style={{flex:1}}>
                  <Text allowFontScaling={false} style={styles.cardTitle}>Sleep history</Text>
                  <Text allowFontScaling={false} style={styles.cardSub}>{sleepHistory.length} nights logged · 90 days</Text>
                </View>
                <Text allowFontScaling={false} style={styles.chevron}>{showSleepHistory ? '−' : '+'}</Text>
              </TouchableOpacity>

              {showSleepHistory && (
                <>
                  {/* Month selector */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12, marginBottom:16}} contentContainerStyle={{gap:8}}>
                    {availableMonths.map(ym => (
                      <TouchableOpacity key={ym} onPress={() => setSelectedMonth(ym)}
                        style={[styles.monthPill, {borderColor:selectedMonth===ym?Colors.indigo:Colors.parchmentDark, backgroundColor:selectedMonth===ym?Colors.indigo:Colors.cream}]}>
                        <Text allowFontScaling={false} style={[styles.monthPillText, {color:selectedMonth===ym?Colors.cream:Colors.mist}]}>{monthLabel(ym)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {monthEntries.length === 0 ? (
                    <View style={styles.emptyHistory}>
                      <Text allowFontScaling={false} style={styles.emptyHistoryText}>No sleep logged for {monthLabel(selectedMonth)}.</Text>
                    </View>
                  ) : (
                    <>
                      {/* Month summary */}
                      {monthStats && (
                        <View style={styles.monthSummary}>
                          <View style={styles.monthStatRow}>
                            <View style={styles.monthStat}>
                              <Text allowFontScaling={false} style={[styles.monthStatNum, {color: monthStats.avgQ >= 3 ? Colors.sage : Colors.rose}]}>{monthStats.avgQ.toFixed(1)}</Text>
                              <Text allowFontScaling={false} style={styles.monthStatLabel}>avg quality{'\n'}/5</Text>
                            </View>
                            <View style={styles.monthDivider}/>
                            <View style={styles.monthStat}>
                              <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.logged}</Text>
                              <Text allowFontScaling={false} style={styles.monthStatLabel}>nights{'\n'}logged</Text>
                            </View>
                            <View style={styles.monthDivider}/>
                            <View style={styles.monthStat}>
                              <Text allowFontScaling={false} style={[styles.monthStatNum, {color: monthStats.sweats > 10 ? Colors.rose : Colors.gold}]}>{monthStats.sweats}</Text>
                              <Text allowFontScaling={false} style={styles.monthStatLabel}>night sweat{'\n'}nights</Text>
                            </View>
                            <View style={styles.monthDivider}/>
                            <View style={styles.monthStat}>
                              <Text allowFontScaling={false} style={[styles.monthStatNum, {color: monthStats.avgW > 2 ? Colors.rose : Colors.sage}]}>{monthStats.avgW.toFixed(1)}</Text>
                              <Text allowFontScaling={false} style={styles.monthStatLabel}>avg wake{'\n'}ups</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Day-by-day */}
                      <Text allowFontScaling={false} style={[styles.cardSub, {marginTop:16, marginBottom:8}]}>Nightly entries</Text>
                      {monthEntries.map(entry => {
                        const d = new Date(entry.date + 'T12:00:00');
                        const label = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
                        const qColor = QUALITY_COLORS[entry.quality ?? 0] || Colors.mist;
                        const qLabel = QUALITY_LABELS[entry.quality ?? 0] || '—';
                        return (
                          <View key={entry.date} style={styles.dayEntry}>
                            <Text allowFontScaling={false} style={styles.dayEntryDate}>{label}</Text>
                            <View style={styles.dayEntryBody}>
                              <View style={{flexDirection:'row', gap:10, flexWrap:'wrap'}}>
                                {entry.quality && (
                                  <View style={[styles.qualityBadge, {backgroundColor:`${qColor}20`, borderColor:qColor}]}>
                                    <Text allowFontScaling={false} style={[styles.qualityBadgeText, {color:qColor}]}>{qLabel}</Text>
                                  </View>
                                )}
                                {entry.nightSweats && (
                                  <View style={[styles.qualityBadge, {backgroundColor:Colors.rosePale, borderColor:Colors.rose}]}>
                                    <Text allowFontScaling={false} style={[styles.qualityBadgeText, {color:Colors.rose}]}>Night sweats</Text>
                                  </View>
                                )}
                                {entry.wakeCount > 0 && (
                                  <Text allowFontScaling={false} style={styles.dayEntryMeta}>Woke {entry.wakeCount}× </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </View>

            {/* Wind-down ritual */}
            <View style={styles.darkCard}>
              <Text allowFontScaling={false} style={styles.darkCardTitle}>Tonight's wind-down ritual</Text>
              {[
                'Magnesium glycinate 300mg — take now',
                '10 min progressive muscle release (Somatic tab)',
                '4-7-8 breathwork in bed — 4 cycles',
                'Keep bedroom below 67°F / 19°C',
                'No screens 30 min before sleep',
              ].map((tip,i)=>(
                <View key={i} style={styles.tipRow}>
                  <Text allowFontScaling={false} style={styles.tipNum}>{i+1}.</Text>
                  <Text allowFontScaling={false} style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{height:20}}/>
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
  trialBanner:{backgroundColor:Colors.goldPale,borderWidth:1,borderColor:Colors.gold,borderRadius:14,padding:12,marginBottom:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},
  trialBannerTitle:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.plum},
  trialBannerSub:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  unlockBtn:{backgroundColor:Colors.gold,borderRadius:14,paddingVertical:7,paddingHorizontal:14},
  unlockBtnText:{fontFamily:Fonts.sansMedium,fontSize:11,color:Colors.plum},
  pageTitle:{fontFamily:Fonts.serif,fontSize:24,color:Colors.plum},
  pageSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:16},
  snapshotCard:{backgroundColor:Colors.indigoPale,borderWidth:1,borderColor:Colors.indigo,borderRadius:18,padding:18,marginBottom:16},
  snapshotTitle:{fontFamily:Fonts.sansMedium,fontSize:10,color:Colors.indigo,letterSpacing:2,textTransform:'uppercase',marginBottom:14},
  snapshotRow:{flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
  snapshotStat:{alignItems:'center',flex:1},
  snapshotNum:{fontFamily:Fonts.sansMedium,fontSize:24,color:Colors.plum},
  snapshotLabel:{fontFamily:Fonts.sans,fontSize:9,color:Colors.mist,textAlign:'center',marginTop:3,lineHeight:13},
  snapshotDivider:{width:0.5,height:36,backgroundColor:Colors.indigo,opacity:0.3},
  trendRow:{marginTop:12,paddingTop:12,borderTopWidth:0.5,borderTopColor:`${Colors.indigo}40`},
  trendText:{fontFamily:Fonts.sans,fontSize:12,textAlign:'center'},
  snapshotEmpty:{backgroundColor:Colors.indigoPale,borderRadius:14,padding:16,marginBottom:16,alignItems:'center'},
  snapshotEmptyText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,textAlign:'center',lineHeight:18},
  subTabRow:{flexDirection:'row',gap:8,marginBottom:20},
  subTab:{paddingVertical:8,paddingHorizontal:16,borderRadius:20,borderWidth:1},
  subTabText:{fontFamily:Fonts.sans,fontSize:12},
  sectionDesc:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,lineHeight:20,marginBottom:16},
  card:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:12},
  cardTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.plum,marginBottom:4},
  cardSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:8},
  historyToggleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  chevron:{fontSize:18,color:Colors.mist},
  breathName:{fontFamily:Fonts.serif,fontSize:17,color:Colors.plum},
  breathTag:{backgroundColor:Colors.indigoPale,borderRadius:10,paddingVertical:3,paddingHorizontal:8},
  breathTagText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.indigo},
  breathDur:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,marginBottom:6},
  breathDesc:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,lineHeight:18},
  stepsRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:14},
  stepChip:{borderRadius:12,paddingVertical:4,paddingHorizontal:10,borderWidth:0.5},
  stepChipText:{fontFamily:Fonts.sans,fontSize:11},
  beginButton:{backgroundColor:Colors.plum,borderRadius:12,padding:12,alignItems:'center'},
  beginButtonText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.parchment},
  activeCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:32,marginBottom:12,alignItems:'center'},
  activeTitle:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,letterSpacing:2,textTransform:'uppercase',marginBottom:24},
  circleContainer:{marginBottom:24},
  circleOuter:{width:180,height:180,borderRadius:90,borderWidth:0.5,borderColor:Colors.parchmentDark,alignItems:'center',justifyContent:'center',backgroundColor:Colors.parchment},
  circleInner:{position:'absolute',width:180,height:180,borderRadius:90},
  circleText:{alignItems:'center'},
  circlePhase:{fontFamily:Fonts.serif,fontSize:20,marginBottom:4},
  circleCount:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  dotsRow:{flexDirection:'row',gap:8,marginBottom:24},
  dot:{width:8,height:8,borderRadius:4},
  endButton:{borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:20,paddingVertical:11,paddingHorizontal:32},
  endButtonText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
  somaticHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8},
  somaticName:{fontFamily:Fonts.serif,fontSize:17,color:Colors.plum,flex:1},
  durBadge:{backgroundColor:Colors.parchmentDark,borderRadius:10,paddingVertical:3,paddingHorizontal:8},
  durBadgeText:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  somaticDesc:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,lineHeight:20},
  formLabel:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.plum,marginBottom:8},
  qualityBtn:{flex:1,paddingVertical:10,borderRadius:12,borderWidth:1,alignItems:'center',minWidth:56},
  qualityText:{fontFamily:Fonts.sans,fontSize:11},
  toggleBtn:{padding:12,borderRadius:14,borderWidth:1,alignItems:'center'},
  toggleBtnText:{fontFamily:Fonts.sans,fontSize:13},
  numBtn:{width:40,height:40,borderRadius:20,borderWidth:1,alignItems:'center',justifyContent:'center'},
  numBtnText:{fontFamily:Fonts.sans,fontSize:13},
  saveBtn:{backgroundColor:Colors.plum,borderRadius:14,padding:14,alignItems:'center'},
  saveBtnText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.parchment},
  monthPill:{paddingVertical:6,paddingHorizontal:14,borderRadius:20,borderWidth:1},
  monthPillText:{fontFamily:Fonts.sans,fontSize:12},
  emptyHistory:{alignItems:'center',paddingVertical:20},
  emptyHistoryText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,textAlign:'center'},
  monthSummary:{backgroundColor:Colors.parchment,borderRadius:14,padding:16,marginBottom:8},
  monthStatRow:{flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
  monthStat:{alignItems:'center',flex:1},
  monthStatNum:{fontFamily:Fonts.sansMedium,fontSize:24,color:Colors.plum},
  monthStatLabel:{fontFamily:Fonts.sans,fontSize:9,color:Colors.mist,textAlign:'center',marginTop:2,lineHeight:13},
  monthDivider:{width:0.5,height:36,backgroundColor:Colors.parchmentDark},
  dayEntry:{paddingVertical:10,borderBottomWidth:0.5,borderBottomColor:Colors.parchmentDark},
  dayEntryDate:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.plum,marginBottom:6},
  dayEntryBody:{gap:4},
  dayEntryMeta:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  qualityBadge:{borderRadius:10,paddingVertical:3,paddingHorizontal:10,borderWidth:0.5},
  qualityBadgeText:{fontFamily:Fonts.sans,fontSize:11},
  darkCard:{backgroundColor:Colors.plum,borderRadius:18,padding:20,marginBottom:12},
  darkCardTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.goldLight,marginBottom:12},
  tipRow:{flexDirection:'row',gap:10,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:'rgba(255,255,255,0.08)'},
  tipNum:{fontFamily:Fonts.sans,fontSize:12,color:Colors.gold,marginTop:1},
  tipText:{flex:1,fontFamily:Fonts.sans,fontSize:13,color:'rgba(245,239,230,0.8)',lineHeight:20},
});
