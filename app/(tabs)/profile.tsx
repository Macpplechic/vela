import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts } from '../../constants/Colors';
import { scheduleVelaNotifications, cancelAllNotifications } from '../../hooks/useNotifications';
import { generateDoctorReport } from '../../hooks/generateReport';
import { PHASES, SUPP_LIBRARY, DOCTOR_QUESTIONS } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

const CAT_LABELS: Record<string, string> = {
  essential:'✦ Essentials', energy:'Energy & vitality',
  calm:'Calm & sleep', glow:'Skin, hair & glow', metabolism:'Metabolism & balance',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={statStyles.card}>
      <Text allowFontScaling={false} style={statStyles.label}>{label}</Text>
      <Text allowFontScaling={false} style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      {sub ? <Text allowFontScaling={false} style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex:1, backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:14, padding:12, alignItems:'center', minWidth: 80 },
  label: { fontFamily:Fonts.sans, fontSize:9, color:Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4, textAlign:'center' },
  value: { fontFamily:Fonts.sansMedium, fontSize:22, color:Colors.plum, textAlign:'center' },
  sub: { fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, marginTop:2, textAlign:'center' },
});

export default function ProfileScreen() {
  const {
    phase, symptoms, mySupps, mySuppsData, setMySupps,
    checkedSupps, setCheckedSupps,
    fluxActive, coolActive, fluxDaysLeft, coolDaysLeft,
    startFluxTrial, startCoolTrial, resetOnboarding,
    history, sleepHistory, streak, lastStreakDate, topSymptoms, avgNutrients, suppAdherence,
  } = useVelaStore();
  const _mySuppsDataTyped = mySuppsData as any[];

  const pd = PHASES[phase ?? 'late'];
  const [showDoctor, setShowDoctor] = useState(false);
  const [showSuppLib, setShowSuppLib] = useState(false);
  const [suppCat, setSuppCat] = useState('essential');
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await generateDoctorReport({
        phase: phase ?? 'late',
        phaseLabel: pd.label,
        symptoms,
        topSymptoms: topSyms,
        history,
        sleepHistory,
        mySupps: mySuppsData.map((s: any) => s.name),
        suppAdherence: adherence,
        avgNutrients: avgNut,
      });
    } catch (e) {
      console.error('PDF failed:', e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleNotifToggle = async () => {
    setNotifsLoading(true);
    if (notifsEnabled) {
      await cancelAllNotifications();
      setNotifsEnabled(false);
    } else {
      const granted = await scheduleVelaNotifications();
      setNotifsEnabled(granted);
    }
    setNotifsLoading(false);
  };

  const toggleMySupp = async (id: string) => {
    const next = mySupps.includes(id) ? mySupps.filter(x => x !== id) : [...mySupps, id];
    await setMySupps(next);
    if (!next.includes(id)) await setCheckedSupps(checkedSupps.filter(x => x !== id));
  };

  // ── Monthly stats ─────────────────────────────────────────────────────────
  const adherence = suppAdherence();
  const topSyms = topSymptoms(5);
  const avgNut = avgNutrients();

  const monthEntries = useMemo(() => {
    return history.filter(e => e.date.startsWith(selectedMonth));
  }, [history, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = [...new Set(history.map(e => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
    const nowStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
    if (!months.includes(nowStr)) months.unshift(nowStr);
    return months;
  }, [history]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  };

  const monthStats = useMemo(() => {
    if (monthEntries.length === 0) return null;
    const daysWithFood = monthEntries.filter(e => e.foods.length > 0).length;
    const daysWithSymptoms = monthEntries.filter(e => e.symptoms.length > 0).length;
    const daysWithJournal = monthEntries.filter(e => e.journal.trim().length > 0).length;
    const allSymptoms: Record<string, number> = {};
    monthEntries.forEach(e => e.symptoms.forEach(s => { allSymptoms[s] = (allSymptoms[s] ?? 0) + 1; }));
    const topMonthSyms = Object.entries(allSymptoms).sort((a,b) => b[1]-a[1]).slice(0,3);
    const avgProtein = daysWithFood > 0
      ? Math.round(monthEntries.filter(e=>e.foods.length>0).reduce((a,e)=>a+e.totals.protein,0) / daysWithFood)
      : 0;
    const avgCal = daysWithFood > 0
      ? Math.round(monthEntries.filter(e=>e.foods.length>0).reduce((a,e)=>a+e.totals.cal,0) / daysWithFood)
      : 0;
    return { daysWithFood, daysWithSymptoms, daysWithJournal, topMonthSyms, avgProtein, avgCal };
  }, [monthEntries]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.logoText}>vela</Text>
        <Text allowFontScaling={false} style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text allowFontScaling={false} style={styles.pageTitle}>Your profile</Text>

        {/* ── 30-Day Snapshot ── */}
        <Text allowFontScaling={false} style={styles.sectionTitle}>Last 30 days</Text>
        <View style={styles.statsRow}>
          <StatCard label="Supp adherence" value={`${adherence}%`} color={adherence >= 70 ? Colors.sage : Colors.gold} />
          <StatCard label="Days logged" value={`${history.filter(e => { const d = new Date(); d.setDate(d.getDate()-30); return new Date(e.date) >= d; }).length}`} sub="of 30" />
          <StatCard label="Avg protein" value={`${Math.round(avgNut.protein)}g`} sub="daily" />
        </View>

        {/* Streak card */}
        {streak > 0 && (
          <View style={styles.streakCard}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.streakCardLabel}>Current streak</Text>
              <Text allowFontScaling={false} style={styles.streakCardNum}>🔥 {streak} day{streak !== 1 ? 's' : ''}</Text>
              <Text allowFontScaling={false} style={styles.streakCardSub}>
                {streak >= 30 ? 'Incredible — 30+ days of consistency.' :
                 streak >= 14 ? 'Two weeks strong. Keep going.' :
                 streak >= 7  ? 'One full week. You are building something real.' :
                 streak >= 3  ? 'Three days in. Momentum is building.' :
                 'Great start. Come back tomorrow to keep it going.'}
              </Text>
            </View>
            <View style={styles.streakRing}>
              <Text allowFontScaling={false} style={styles.streakRingNum}>{streak}</Text>
              <Text allowFontScaling={false} style={styles.streakRingLabel}>{streak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        )}

        {topSyms.length > 0 && (
          <View style={[styles.card, { marginTop: 4 }]}>
            <Text allowFontScaling={false} style={styles.cardTitle}>Top symptoms this month</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8 }}>
              {topSyms.map(({ symptom, count }) => (
                <View key={symptom} style={styles.symStatChip}>
                  <Text allowFontScaling={false} style={styles.symStatText}>{symptom}</Text>
                  <Text allowFontScaling={false} style={styles.symStatCount}>{count}×</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Monthly History ── */}
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={styles.cardTitleRow} activeOpacity={0.7}>
            <View>
              <Text allowFontScaling={false} style={styles.cardTitle}>Monthly history</Text>
              <Text allowFontScaling={false} style={styles.cardSub}>{history.length} days tracked</Text>
            </View>
            <Text allowFontScaling={false} style={styles.chevron}>{showHistory ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showHistory && (
            <>
              {/* Month selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:12, marginBottom:16 }} contentContainerStyle={{ gap:8 }}>
                {availableMonths.map(ym => (
                  <TouchableOpacity key={ym} onPress={() => setSelectedMonth(ym)}
                    style={[styles.monthPill, { borderColor: selectedMonth===ym ? Colors.plum : Colors.parchmentDark, backgroundColor: selectedMonth===ym ? Colors.plum : Colors.cream }]}>
                    <Text allowFontScaling={false} style={[styles.monthPillText, { color: selectedMonth===ym ? Colors.parchment : Colors.mist }]}>{monthLabel(ym)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {monthEntries.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text allowFontScaling={false} style={styles.emptyHistoryText}>No data logged for {monthLabel(selectedMonth)} yet.</Text>
                  <Text allowFontScaling={false} style={styles.emptyHistorySubText}>Log food, symptoms, and supplements daily — they'll appear here automatically.</Text>
                </View>
              ) : (
                <>
                  {/* Month summary stats */}
                  {monthStats && (
                    <View style={styles.monthSummary}>
                      <View style={styles.monthStatRow}>
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithFood}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Days with{'\n'}food logged</Text>
                        </View>
                        <View style={styles.monthDivider} />
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithSymptoms}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Days with{'\n'}symptoms</Text>
                        </View>
                        <View style={styles.monthDivider} />
                        <View style={styles.monthStat}>
                          <Text allowFontScaling={false} style={styles.monthStatNum}>{monthStats.daysWithJournal}</Text>
                          <Text allowFontScaling={false} style={styles.monthStatLabel}>Journal{'\n'}entries</Text>
                        </View>
                      </View>
                      {monthStats.daysWithFood > 0 && (
                        <View style={styles.monthNutrientRow}>
                          <Text allowFontScaling={false} style={styles.monthNutrientText}>Avg {monthStats.avgProtein}g protein · {monthStats.avgCal} cal/day</Text>
                        </View>
                      )}
                      {monthStats.topMonthSyms.length > 0 && (
                        <View style={{ marginTop:12 }}>
                          <Text allowFontScaling={false} style={styles.monthSymLabel}>Most logged symptoms</Text>
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6 }}>
                            {monthStats.topMonthSyms.map(([sym, cnt]) => (
                              <View key={sym} style={styles.symStatChip}>
                                <Text allowFontScaling={false} style={styles.symStatText}>{sym}</Text>
                                <Text allowFontScaling={false} style={styles.symStatCount}>{cnt}×</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Day-by-day entries */}
                  <Text allowFontScaling={false} style={[styles.cardSub, { marginTop:16, marginBottom:8 }]}>Daily entries</Text>
                  {[...monthEntries].sort((a,b) => b.date.localeCompare(a.date)).map(entry => {
                    const d = new Date(entry.date + 'T12:00:00');
                    const label = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
                    return (
                      <View key={entry.date} style={styles.dayEntry}>
                        <Text allowFontScaling={false} style={styles.dayEntryDate}>{label}</Text>
                        <View style={styles.dayEntryBody}>
                          {entry.foods.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine}>
                              🍽 {entry.foods.length} food{entry.foods.length !== 1 ? 's' : ''} · {Math.round(entry.totals.cal)} cal · {Math.round(entry.totals.protein)}g protein
                            </Text>
                          )}
                          {entry.symptoms.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine} numberOfLines={2}>
                              ◎ {entry.symptoms.slice(0,4).join(' · ')}{entry.symptoms.length > 4 ? ` +${entry.symptoms.length - 4}` : ''}
                            </Text>
                          )}
                          {entry.checkedSupps.length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryLine}>
                              ✦ {entry.checkedSupps.length} supplement{entry.checkedSupps.length !== 1 ? 's' : ''} taken
                            </Text>
                          )}
                          {entry.journal.trim().length > 0 && (
                            <Text allowFontScaling={false} style={styles.dayEntryJournal} numberOfLines={2}>
                              "{entry.journal.trim()}"
                            </Text>
                          )}
                          {entry.foods.length === 0 && entry.symptoms.length === 0 && entry.checkedSupps.length === 0 && !entry.journal.trim() && (
                            <Text allowFontScaling={false} style={styles.dayEntryEmpty}>No data logged</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* ── Modules ── */}
        <Text allowFontScaling={false} style={styles.sectionTitle}>Your modules</Text>
        <View style={styles.moduleGrid}>
          {[
            { id:'flux', name:'FluxLog', glyph:'◎', color:Colors.teal, pale:Colors.tealPale, active:fluxActive, daysLeft:fluxDaysLeft, onStart:startFluxTrial },
            { id:'cool', name:'CoolDown', glyph:'◌', color:Colors.indigo, pale:Colors.indigoPale, active:coolActive, daysLeft:coolDaysLeft, onStart:startCoolTrial },
          ].map(m => (
            <View key={m.id} style={[styles.moduleCard, { backgroundColor:m.active?m.pale:Colors.cream, borderColor:m.active?m.color:Colors.parchmentDark }]}>
              <Text allowFontScaling={false} style={[styles.moduleGlyph, { color:m.active?m.color:Colors.parchmentDark }]}>{m.glyph}</Text>
              <Text allowFontScaling={false} style={styles.moduleName}>{m.name}</Text>
              {m.active
                ? <Text allowFontScaling={false} style={[styles.moduleStatus, { color:m.color }]}>{m.daysLeft !== null ? `${m.daysLeft}d trial` : '✦ Active'}</Text>
                : <TouchableOpacity onPress={m.onStart} style={[styles.trialBtn, { borderColor:m.color }]}>
                    <Text allowFontScaling={false} style={[styles.trialBtnText, { color:m.color }]}>Start trial</Text>
                  </TouchableOpacity>
              }
            </View>
          ))}
        </View>

        {/* ── Supplements ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text allowFontScaling={false} style={styles.cardTitle}>My supplements</Text>
            <TouchableOpacity onPress={() => setShowSuppLib(true)} style={styles.manageBadge}>
              <Text allowFontScaling={false} style={styles.manageBadgeText}>+ manage</Text>
            </TouchableOpacity>
          </View>
          <Text allowFontScaling={false} style={styles.cardSub}>{_mySuppsDataTyped.length} supplements · {adherence}% adherence last 30 days</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
            {_mySuppsDataTyped.map((s:any) => (
              <View key={s.id} style={styles.suppChip}>
                <Text allowFontScaling={false} style={styles.suppChipText}>{s.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Creator program ── */}
        <View style={styles.plumCard}>
          <Text allowFontScaling={false} style={styles.plumLabel}>✦ Vela Creator Program</Text>
          <Text allowFontScaling={false} style={styles.plumTitle}>Share Vela. Earn with us.</Text>
          <Text allowFontScaling={false} style={styles.plumText}>Share your referral link and earn 30% of every subscription — forever.</Text>
          <TouchableOpacity onPress={() => setShowAffiliate(true)} style={styles.goldOutlineBtn}>
            <Text allowFontScaling={false} style={styles.goldOutlineBtnText}>✦ Join the Creator Program</Text>
          </TouchableOpacity>
        </View>

        {/* ── Doctor prep ── */}
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setShowDoctor(!showDoctor)} style={styles.cardTitleRow} activeOpacity={0.7}>
            <View style={{ flex:1 }}>
              <Text allowFontScaling={false} style={styles.cardTitle}>Doctor visit prep</Text>
              <Text allowFontScaling={false} style={styles.cardSub}>Know your rights. Ask the right questions.</Text>
            </View>
            <Text allowFontScaling={false} style={styles.chevron}>{showDoctor ? '−' : '+'}</Text>
          </TouchableOpacity>
          {showDoctor && (
            <View style={{ marginTop:14 }}>
              {symptoms.length > 0 && (
                <View style={styles.symptomsBox}>
                  <Text allowFontScaling={false} style={styles.symptomsBoxLabel}>Your logged symptoms today</Text>
                  <Text allowFontScaling={false} style={styles.symptomsBoxText}>{symptoms.join(' · ')}</Text>
                </View>
              )}
              {/* Streak card */}
        {streak > 0 && (
          <View style={styles.streakCard}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.streakCardLabel}>Current streak</Text>
              <Text allowFontScaling={false} style={styles.streakCardNum}>🔥 {streak} day{streak !== 1 ? 's' : ''}</Text>
              <Text allowFontScaling={false} style={styles.streakCardSub}>
                {streak >= 30 ? 'Incredible — 30+ days of consistency.' :
                 streak >= 14 ? 'Two weeks strong. Keep going.' :
                 streak >= 7  ? 'One full week. You are building something real.' :
                 streak >= 3  ? 'Three days in. Momentum is building.' :
                 'Great start. Come back tomorrow to keep it going.'}
              </Text>
            </View>
            <View style={styles.streakRing}>
              <Text allowFontScaling={false} style={styles.streakRingNum}>{streak}</Text>
              <Text allowFontScaling={false} style={styles.streakRingLabel}>{streak === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        )}

        {topSyms.length > 0 && (
                <View style={[styles.symptomsBox, { borderColor:Colors.gold, backgroundColor:Colors.goldPale }]}>
                  <Text allowFontScaling={false} style={[styles.symptomsBoxLabel, { color:Colors.gold }]}>Most frequent last 30 days</Text>
                  <Text allowFontScaling={false} style={styles.symptomsBoxText}>{topSyms.map(s => `${s.symptom} (${s.count}×)`).join(' · ')}</Text>
                </View>
              )}
              {DOCTOR_QUESTIONS.map((q, i) => (
                <View key={i} style={styles.doctorQRow}>
                  <Text allowFontScaling={false} style={styles.doctorArrow}>→</Text>
                  <Text allowFontScaling={false} style={styles.doctorQ}>{q}</Text>
                </View>
              ))}
              <Text allowFontScaling={false} style={styles.doctorNote}>Many women see multiple providers before getting answers. Come prepared — you deserve a thorough conversation.</Text>
            </View>
          )}
        </View>

        {/* ── Phase ── */}
        <View style={[styles.phaseCard, { backgroundColor:pd.bg, borderColor:pd.color }]}>
          <Text allowFontScaling={false} style={[styles.phaseLabel, { color:pd.color }]}>Your phase</Text>
          <Text allowFontScaling={false} style={styles.phaseTitle}>{pd.label}</Text>
          <Text allowFontScaling={false} style={styles.phaseDesc}>{pd.desc}</Text>
          <TouchableOpacity onPress={() => { resetOnboarding(); router.replace('/onboarding'); }} style={styles.retakeBtn}>
            <Text allowFontScaling={false} style={styles.retakeBtnText}>✎ Retake phase quiz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>Doctor report</Text>
          <Text allowFontScaling={false} style={styles.cardSub}>90-day PDF — symptoms, sleep, nutrition, supplements</Text>
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={pdfLoading}
            style={[styles.retakeBtn, { backgroundColor: pdfLoading ? Colors.parchmentDark : Colors.plum }]}>
            <Text allowFontScaling={false} style={styles.retakeBtnText}>
              {pdfLoading ? 'Generating...' : '✦ Export PDF for my doctor'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.cardTitle}>Daily reminders</Text>
          <Text allowFontScaling={false} style={styles.cardSub}>Supplement check-ins, sleep logs, and weekly insights</Text>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <View>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sans, fontSize:13, color:Colors.plum }}>
                {notifsEnabled ? '🔔 Notifications on' : '🔕 Notifications off'}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, marginTop:2 }}>
                {notifsEnabled ? '7:30am · 8am · 1pm · 5pm · 9pm' : 'Tap to enable reminders'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNotifToggle}
              disabled={notifsLoading}
              style={[styles.notifToggle, { backgroundColor: notifsEnabled ? Colors.sage : Colors.parchmentDark }]}>
              <Text allowFontScaling={false} style={{ fontFamily:Fonts.sansMedium, fontSize:12, color: notifsEnabled ? Colors.cream : Colors.mist }}>
                {notifsLoading ? '...' : notifsEnabled ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.footer}>Always consult your healthcare provider</Text>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Supplement Library Modal ── */}
      <Modal visible={showSuppLib} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSuppLib(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor: Colors.cream }}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={styles.modalTitle}>Supplement library</Text>
            <TouchableOpacity onPress={() => setShowSuppLib(false)}>
              <Text allowFontScaling={false} style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ paddingHorizontal:20, gap:8, paddingVertical:4 }}>
            {Object.entries(CAT_LABELS).map(([cat, lbl]) => (
              <TouchableOpacity key={cat} onPress={() => setSuppCat(cat)} style={[styles.catPill, { borderColor: suppCat===cat?Colors.plum:Colors.parchmentDark, backgroundColor: suppCat===cat?Colors.plum:Colors.cream }]}>
                <Text allowFontScaling={false} style={[styles.catPillText, { color: suppCat===cat?Colors.parchment:Colors.mist }]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView contentContainerStyle={{ padding:20 }}>
            {(SUPP_LIBRARY as any[]).filter((s:any) => s.category === suppCat).map((s:any) => {
              const inR = mySupps.includes(s.id);
              return (
                <View key={s.id} style={styles.suppLibRow}>
                  <View style={{ flex:1 }}>
                    <Text allowFontScaling={false} style={styles.suppLibName}>{s.icon} {s.name}</Text>
                    <Text allowFontScaling={false} style={styles.suppLibDose}>{s.dose}</Text>
                    <Text allowFontScaling={false} style={styles.suppLibWhy}>{s.why}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleMySupp(s.id)} style={[styles.suppToggleBtn, { borderColor:inR?Colors.rose:Colors.gold, backgroundColor:inR?Colors.rosePale:Colors.goldPale }]}>
                    <Text allowFontScaling={false} style={[styles.suppToggleTxt, { color:inR?Colors.rose:Colors.plum }]}>{inR?'× remove':'✦ add'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={styles.routineSummary}>
              <Text allowFontScaling={false} style={styles.routineLabel}>Your routine ({_mySuppsDataTyped.length})</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:8 }}>
                {_mySuppsDataTyped.map((s:any) => (
                  <View key={s.id} style={styles.suppChip}><Text allowFontScaling={false} style={styles.suppChipText}>{s.name}</Text></View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Affiliate Modal ── */}
      <Modal visible={showAffiliate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAffiliate(false)}>
        <SafeAreaView style={{ flex:1, backgroundColor: Colors.cream }}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={styles.modalTitle}>Vela Creator Program</Text>
            <TouchableOpacity onPress={() => setShowAffiliate(false)}><Text allowFontScaling={false} style={styles.modalClose}>×</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding:20 }}>
            {[
              { title:'30% revenue share', desc:'Earn 30% of every subscription your link generates — for the lifetime of that subscriber.' },
              { title:'6 months free', desc:'Creators with 10K+ followers get 6 months of Vela Premium, no strings attached.' },
              { title:'Creator badge', desc:'A verified Vela Creator badge in-app and in The Shift community.' },
              { title:'Custom link + dashboard', desc:'Your own referral link, live earnings dashboard, and monthly payouts.' },
            ].map((b,i) => (
              <View key={i} style={styles.benefitRow}>
                <Text allowFontScaling={false} style={styles.benefitTitle}>✦ {b.title}</Text>
                <Text allowFontScaling={false} style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
            <View style={styles.linkBox}>
              <Text allowFontScaling={false} style={styles.linkBoxLabel}>Your referral link</Text>
              <Text allowFontScaling={false} style={styles.linkBoxVal}>vela.app/ref/yourname</Text>
            </View>
            <TouchableOpacity style={styles.plumBtn}>
              <Text allowFontScaling={false} style={styles.plumBtnText}>Apply to join ✦</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:Colors.parchment },
  header:{ backgroundColor:Colors.plum, paddingHorizontal:20, paddingTop:8, paddingBottom:14 },
  logoText:{ fontFamily:Fonts.serif, fontSize:24, color:Colors.goldLight, letterSpacing:4 },
  subText:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, letterSpacing:3, textTransform:'uppercase', marginTop:1 },
  scroll:{ flex:1 },
  content:{ padding:20 },
  pageTitle:{ fontFamily:Fonts.serif, fontSize:26, color:Colors.plum, marginBottom:20 },
  sectionTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.plum, marginBottom:12 },
  statsRow:{ flexDirection:'row', gap:8, marginBottom:12 },
  card:{ backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12 },
  cardTitleRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:6 },
  cardTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.plum, marginBottom:4 },
  cardSub:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, marginBottom:14 },
  chevron:{ fontSize:18, color:Colors.mist },
  symStatChip:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:Colors.rosePale, borderWidth:0.5, borderColor:Colors.rose, borderRadius:12, paddingVertical:4, paddingHorizontal:10 },
  symStatText:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.rose },
  symStatCount:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.rose },
  monthPill:{ paddingVertical:6, paddingHorizontal:14, borderRadius:20, borderWidth:1 },
  monthPillText:{ fontFamily:Fonts.sans, fontSize:12 },
  emptyHistory:{ alignItems:'center', paddingVertical:24 },
  emptyHistoryText:{ fontFamily:Fonts.serif, fontSize:16, color:Colors.plum, textAlign:'center', marginBottom:8 },
  emptyHistorySubText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, textAlign:'center', lineHeight:18 },
  monthSummary:{ backgroundColor:Colors.parchment, borderRadius:14, padding:16, marginBottom:8 },
  monthStatRow:{ flexDirection:'row', justifyContent:'space-around', alignItems:'center' },
  monthStat:{ alignItems:'center', flex:1 },
  monthStatNum:{ fontFamily:Fonts.sansMedium, fontSize:28, color:Colors.plum },
  monthStatLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, textAlign:'center', marginTop:2, lineHeight:14 },
  monthDivider:{ width:0.5, height:40, backgroundColor:Colors.parchmentDark },
  monthNutrientRow:{ marginTop:12, paddingTop:12, borderTopWidth:0.5, borderTopColor:Colors.parchmentDark },
  monthNutrientText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, textAlign:'center' },
  monthSymLabel:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.plum, letterSpacing:1, textTransform:'uppercase' },
  dayEntry:{ paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  dayEntryDate:{ fontFamily:Fonts.sansMedium, fontSize:12, color:Colors.plum, marginBottom:4 },
  dayEntryBody:{ gap:3 },
  dayEntryLine:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  dayEntryJournal:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, fontStyle:'italic', lineHeight:16, marginTop:2 },
  dayEntryEmpty:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.parchmentDark },
  moduleGrid:{ flexDirection:'row', gap:10, marginBottom:20 },
  moduleCard:{ flex:1, borderWidth:1, borderRadius:18, padding:16, alignItems:'center', minHeight:120 },
  moduleGlyph:{ fontSize:28, marginBottom:6 },
  moduleName:{ fontFamily:Fonts.serif, fontSize:15, color:Colors.plum, marginBottom:4, textAlign:'center' },
  moduleStatus:{ fontFamily:Fonts.sansMedium, fontSize:11 },
  trialBtn:{ borderWidth:1, borderRadius:12, paddingVertical:5, paddingHorizontal:12, marginTop:4 },
  trialBtnText:{ fontFamily:Fonts.sans, fontSize:11 },
  manageBadge:{ borderWidth:1, borderColor:Colors.gold, borderRadius:14, paddingVertical:4, paddingHorizontal:10 },
  manageBadgeText:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold },
  suppChip:{ backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:12, paddingVertical:4, paddingHorizontal:10 },
  suppChipText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.plum },
  plumCard:{ backgroundColor:Colors.plum, borderRadius:20, padding:20, marginBottom:14 },
  plumLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.gold, letterSpacing:3, textTransform:'uppercase', marginBottom:8 },
  plumTitle:{ fontFamily:Fonts.serif, fontSize:18, color:Colors.goldLight, marginBottom:8 },
  plumText:{ fontFamily:Fonts.sans, fontSize:13, color:'rgba(245,239,230,0.7)', lineHeight:20, marginBottom:16 },
  goldOutlineBtn:{ borderWidth:1, borderColor:Colors.gold, borderRadius:14, padding:12, alignItems:'center' },
  goldOutlineBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.gold, letterSpacing:1 },
  symptomsBox:{ backgroundColor:Colors.rosePale, borderRadius:12, padding:12, marginBottom:10, borderWidth:0.5, borderColor:Colors.rose },
  symptomsBoxLabel:{ fontFamily:Fonts.sansMedium, fontSize:11, color:Colors.rose, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  symptomsBoxText:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.plum, lineHeight:22 },
  doctorQRow:{ flexDirection:'row', gap:10, paddingVertical:9, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark, alignItems:'flex-start' },
  doctorArrow:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.gold, marginTop:2 },
  doctorQ:{ flex:1, fontFamily:Fonts.sans, fontSize:12, color:Colors.plum, lineHeight:18 },
  doctorNote:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.mist, marginTop:12, lineHeight:17, fontStyle:'italic' },
  phaseCard:{ borderWidth:1.5, borderRadius:18, padding:20, marginBottom:14 },
  phaseLabel:{ fontFamily:Fonts.sansMedium, fontSize:10, letterSpacing:3, textTransform:'uppercase', marginBottom:8 },
  phaseTitle:{ fontFamily:Fonts.serif, fontSize:22, color:Colors.plum, marginBottom:4 },
  phaseDesc:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.mist, marginBottom:16 },
  retakeBtn:{ backgroundColor:Colors.plum, borderRadius:12, padding:12, alignItems:'center' },
  retakeBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.parchment },

  streakCard:{ flexDirection:'row', alignItems:'center', backgroundColor:Colors.cream, borderWidth:0.5, borderColor:Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12, gap:12 },
  streakCardLabel:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4 },
  streakCardNum:{ fontFamily:Fonts.sansMedium, fontSize:20, color:Colors.plum, marginBottom:2 },
  streakCardSub:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  streakRing:{ width:56, height:56, borderRadius:28, borderWidth:1.5, borderColor:Colors.gold, alignItems:'center', justifyContent:'center', backgroundColor:Colors.goldPale },
  streakRingNum:{ fontFamily:Fonts.sansMedium, fontSize:20, color:Colors.plum },
  streakRingLabel:{ fontFamily:Fonts.sans, fontSize:9, color:Colors.mist },
  notifToggle:{ paddingVertical:8, paddingHorizontal:16, borderRadius:20 },
  footer:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, textAlign:'center', letterSpacing:2, textTransform:'uppercase', paddingVertical:16 },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  modalTitle:{ fontFamily:Fonts.serif, fontSize:22, color:Colors.plum },
  modalClose:{ fontSize:24, color:Colors.mist },
  catRow:{ maxHeight:52 },
  catPill:{ paddingVertical:6, paddingHorizontal:14, borderRadius:20, borderWidth:1 },
  catPillText:{ fontFamily:Fonts.sans, fontSize:11 },
  suppLibRow:{ flexDirection:'row', alignItems:'flex-start', gap:12, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  suppLibName:{ fontFamily:Fonts.sansMedium, fontSize:14, color:Colors.plum, marginBottom:2 },
  suppLibDose:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, marginBottom:6 },
  suppLibWhy:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  suppToggleBtn:{ borderWidth:1, borderRadius:20, paddingVertical:7, paddingHorizontal:14, marginTop:2 },
  suppToggleTxt:{ fontFamily:Fonts.sans, fontSize:12 },
  routineSummary:{ backgroundColor:Colors.goldPale, borderRadius:14, padding:14, marginTop:20, borderWidth:0.5, borderColor:Colors.gold },
  routineLabel:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, letterSpacing:1, textTransform:'uppercase' },
  benefitRow:{ paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:Colors.parchmentDark },
  benefitTitle:{ fontFamily:Fonts.sansMedium, fontSize:13, color:Colors.plum, marginBottom:3 },
  benefitDesc:{ fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, lineHeight:18 },
  linkBox:{ backgroundColor:Colors.goldPale, borderRadius:14, padding:16, marginVertical:16, borderWidth:0.5, borderColor:Colors.gold },
  linkBoxLabel:{ fontFamily:Fonts.sans, fontSize:11, color:Colors.gold, letterSpacing:1, textTransform:'uppercase', marginBottom:4 },
  linkBoxVal:{ fontFamily:'monospace', fontSize:14, color:Colors.plum },
  plumBtn:{ backgroundColor:Colors.plum, borderRadius:14, padding:14, alignItems:'center' },
  plumBtnText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.parchment },
});
