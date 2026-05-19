import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

const RC_API_KEY = 'appl_ZXvRoLscVYwTsOwsgaswQuLvRgC';

const FLOW_OPTIONS = ['spotting', 'light', 'medium', 'heavy'] as const;
type FlowType = typeof FLOW_OPTIONS[number];

const SYMPTOMS = [
  'Hot flash', 'Night sweat', 'Brain fog', 'Mood swing',
  'Fatigue', 'Insomnia', 'Headache', 'Joint pain',
  'Anxiety', 'Bloating', 'Heart palpitations', 'Low libido',
];

const FLOW_COLORS: Record<string, string> = {
  spotting: '#E8C5C5',
  light: '#D4877E',
  medium: Colors.rose,
  heavy: '#8B3A3A',
};

const PHASE_TIPS: Record<string, { title: string; tips: string[] }> = {
  early: {
    title: 'Early perimenopause',
    tips: [
      'Cycles may start varying — this is normal',
      'Track mood changes around ovulation',
      'Magnesium can help with sleep disruptions starting now',
      'Strength training helps protect bone density from now on',
    ],
  },
  mid: {
    title: 'Mid perimenopause',
    tips: [
      'Hot flashes may peak during this phase — track triggers',
      'Progesterone naturally declines — prioritize sleep',
      'Increase calcium and vitamin D intake',
      'Consider tracking cycle length changes monthly',
    ],
  },
  late: {
    title: 'Late perimenopause',
    tips: [
      'Cycles become more irregular — gaps are normal',
      'Vaginal dryness may appear — hydration helps',
      'Heart health becomes more important as estrogen drops',
      'Consider discussing options with your doctor',
    ],
  },
  post: {
    title: 'Post-menopause',
    tips: [
      'Focus on bone density — weight-bearing exercise is key',
      'Heart disease risk increases — track blood pressure',
      'Sleep architecture changes — CoolDown breathing helps',
      'Annual bone density screening is recommended',
    ],
  },
};

export default function FluxScreen() {
  const { fluxActive, fluxLogs, setFluxLogs, unlockFlux, startFluxTrial, startBundleTrial, unlockBundle, bundleActive, phase } = useVelaStore();
  const [pkg, setPkg] = useState<any>(null);
  const [bundlePkg, setBundlePkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'calendar' | 'insights' | 'stats'>('log');
  const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    Purchases.configure({ apiKey: RC_API_KEY });
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        let found: PurchasesPackage | null = offerings.all['fluxlog']?.availablePackages[0] ?? null;
        if (!found) found = offerings.current?.availablePackages.find(
          p => p.product.identifier === 'com.velawellness.app.fluxlog_monthly'
        ) ?? null;
        if (found != null) setPkg(found as PurchasesPackage);
        let bundle = offerings.all['bundle']?.availablePackages[0] ?? offerings.current?.availablePackages.find(p => p.product.identifier === 'com.velawellness.app.bundle_monthly') ?? null;
        if (bundle != null) setBundlePkg(bundle as PurchasesPackage);
      } catch {}
    })();
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setLoading(true);
    try {
      await Purchases.purchasePackage(pkg as PurchasesPackage);
      await unlockFlux();
    } catch {}
    setLoading(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active['fluxlog']) await unlockFlux();
    } catch {}
    setLoading(false);
  };

  const handleTrial = async () => {
    await startBundleTrial();
  };

  const handleBundlePurchase = async () => {
    if (!bundlePkg) return;
    setLoading(true);
    try {
      await Purchases.purchasePackage(bundlePkg as PurchasesPackage);
      await unlockBundle();
    } catch {}
    setLoading(false);
  };

  const logToday = async () => {
    if (!selectedFlow && selectedSymptoms.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const entry = {
      date: today,
      flow: selectedFlow,
      symptoms: selectedSymptoms,
    };
    const updated = [...(fluxLogs || []).filter((l: any) => l.date !== today), entry];
    await setFluxLogs(updated);
    setTodayLogged(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  // ── Computed stats ──────────────────────────────────────────
  const logs = fluxLogs || [];
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth();

  const flowCounts = useMemo(() => logs.reduce((acc: any, l: any) => {
    if (l.flow) acc[l.flow] = (acc[l.flow] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [logs]);

  const topSymptoms = useMemo(() => {
    const counts = logs.reduce((acc: any, l: any) => {
      (l.symptoms || []).forEach((s: string) => { acc[s] = (acc[s] || 0) + 1; });
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const symptomsThisMonth = useMemo(() => logs.filter((l: any) => {
    return new Date(l.date).getMonth() === thisMonth;
  }).reduce((acc: number, l: any) => acc + (l.symptoms?.length || 0), 0), [logs]);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find((l: any) => l.date === dateStr);
      days.push({ date: dateStr, log, label: d.toLocaleDateString('en', { weekday: 'short' }) });
    }
    return days;
  }, [logs]);

  const phaseTip = PHASE_TIPS[phase ?? 'late'];

  // ── Calendar grid ────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const log = logs.find((l: any) => l.date === dateStr);
      days.push({ day: i, dateStr, log });
    }
    return days;
  }, [logs]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

        {/* ── Page header ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.pageTitle}>FluxLog ◎</Text>
          <Text style={styles.pageSub}>Track your cycle through perimenopause</Text>
          {fluxActive && logs.length > 0 && (
            <View style={{ backgroundColor: Colors.rosePale ?? '#FDECEA', borderRadius: 12, padding: 10, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>◎</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.rose }}>
                {logs.length} day{logs.length !== 1 ? 's' : ''} tracked · {topSymptoms.length} symptom pattern{topSymptoms.length !== 1 ? 's' : ''} identified
              </Text>
            </View>
          )}
        </View>

        {/* ── Tab bar (subscribers only) ── */}
        {fluxActive && (
          <View style={{ flexDirection: 'row', backgroundColor: Colors.parchmentDark, borderRadius: 30, padding: 3, marginBottom: 16 }}>
            {(['log', 'calendar', 'insights', 'stats'] as const).map(t => {
              const labels: Record<string, string> = { log: '📋 Log', calendar: '📅 Calendar', insights: '✦ Insights', stats: '📊 Stats' };
              return (
                <TouchableOpacity delayPressIn={0} key={t} onPress={() => setActiveTab(t)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 28, alignItems: 'center', backgroundColor: activeTab === t ? Colors.plum : 'transparent' }}>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: activeTab === t ? Colors.parchment : Colors.mist }}>{labels[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Log Tab ── */}
        {(!fluxActive || activeTab === 'log') && fluxActive && (
          <View>
            {/* Today's log */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How is your flow today?</Text>
              <Text style={styles.cardSub}>{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 }}>
                {FLOW_OPTIONS.map(f => (
                  <TouchableOpacity delayPressIn={0} key={f} onPress={() => setSelectedFlow(selectedFlow === f ? null : f)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5,
                      borderColor: selectedFlow === f ? FLOW_COLORS[f] : Colors.parchmentDark,
                      backgroundColor: selectedFlow === f ? FLOW_COLORS[f] + '22' : 'transparent' }}>
                    <Text style={{ fontSize: 16, marginBottom: 2 }}>
                      {f === 'spotting' ? '🩸' : f === 'light' ? '💧' : f === 'medium' ? '🌊' : '🌧'}
                    </Text>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: selectedFlow === f ? Colors.plum : Colors.mist }}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.cardSub, { marginBottom: 10, color: Colors.plum }]}>Symptoms today</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {SYMPTOMS.map(s => (
                  <TouchableOpacity delayPressIn={0} key={s} onPress={() => toggleSymptom(s)}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1,
                      borderColor: selectedSymptoms.includes(s) ? Colors.rose : Colors.parchmentDark,
                      backgroundColor: selectedSymptoms.includes(s) ? Colors.rose + '18' : 'transparent' }}>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: selectedSymptoms.includes(s) ? Colors.rose : Colors.mist }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity delayPressIn={0} onPress={logToday}
                style={{ backgroundColor: todayLogged ? Colors.sage : Colors.plum, borderRadius: 20, padding: 14, alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.parchment }}>
                  {todayLogged ? '✓ Logged for today' : 'Save today\'s log'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phase support */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌿 {phaseTip.title}</Text>
              <Text style={styles.cardSub}>What your body needs right now</Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {phaseTip.tips.map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: Colors.teal, fontSize: 12, marginTop: 2 }}>✦</Text>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, flex: 1, lineHeight: 18 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Last 7 days */}
            {logs.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Last 7 days</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  {last7Days.map((d, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: Fonts.sans, fontSize: 9, color: Colors.mist }}>{d.label}</Text>
                      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: d.log?.flow ? FLOW_COLORS[d.log.flow] + '33' : Colors.parchmentDark,
                        borderWidth: d.date === today ? 2 : 0, borderColor: Colors.plum }}>
                        <Text style={{ fontSize: d.log?.flow ? 14 : 10 }}>
                          {d.log?.flow ? (d.log.flow === 'spotting' ? '🩸' : d.log.flow === 'light' ? '💧' : d.log.flow === 'medium' ? '🌊' : '🌧') : '·'}
                        </Text>
                      </View>
                      {d.log?.symptoms && d.log.symptoms.length > 0 && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.rose }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Calendar Tab ── */}
        {fluxActive && activeTab === 'calendar' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.cardSub}>Your cycle this month</Text>
            <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 4 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist }}>{d}</Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays.map((d, i) => (
                <View key={i} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                  {d ? (
                    <View style={{ width: '100%', aspectRatio: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: d.log?.flow ? FLOW_COLORS[d.log.flow] + '33' : 'transparent',
                      borderWidth: d.dateStr === today ? 2 : 0, borderColor: Colors.plum }}>
                      <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: d.log ? Colors.plum : Colors.mist }}>{d.day}</Text>
                      {d.log?.symptoms && d.log.symptoms.length > 0 && (
                        <View style={{ position: 'absolute', bottom: 2, width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.rose }} />
                      )}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {Object.entries(FLOW_COLORS).map(([f, c]) => (
                <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c + '66' }} />
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist }}>{f}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rose }} />
                <Text style={{ fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist }}>symptoms</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Insights Tab ── */}
        {fluxActive && activeTab === 'insights' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✦ Your Cycle Insights</Text>
              <Text style={styles.cardSub}>Patterns from your logged data</Text>
              {logs.length < 5 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 32, marginBottom: 10 }}>◎</Text>
                  <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.plum, marginBottom: 6 }}>Keep logging</Text>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, textAlign: 'center', lineHeight: 18 }}>
                    Log at least 5 days to start seeing your patterns. You have {logs.length} so far.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 12 }}>
                  <View style={{ backgroundColor: Colors.parchmentDark, borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.plum, marginBottom: 8 }}>Flow breakdown</Text>
                    {Object.entries(FLOW_COLORS).map(([f, c]) => (
                      flowCounts[f] > 0 ? (
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, width: 56 }}>{f}</Text>
                          <View style={{ flex: 1, height: 6, backgroundColor: Colors.parchment, borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ height: 6, backgroundColor: c, borderRadius: 3, width: `${(flowCounts[f] / logs.length) * 100}%` }} />
                          </View>
                          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.plum, width: 20 }}>{flowCounts[f]}</Text>
                        </View>
                      ) : null
                    ))}
                  </View>

                  {topSymptoms.length > 0 && (
                    <View style={{ backgroundColor: Colors.parchmentDark, borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.plum, marginBottom: 8 }}>Top symptoms</Text>
                      {topSymptoms.map(([sym, cnt]: any) => (
                        <View key={sym} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum }}>{sym}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 60, height: 4, backgroundColor: Colors.parchment, borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: 4, backgroundColor: Colors.rose, borderRadius: 2, width: `${(cnt / logs.length) * 100}%` }} />
                            </View>
                            <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.rose }}>{cnt}×</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ backgroundColor: Colors.goldPale ?? '#FDF3DC', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.plum }}>💡 Pattern insight</Text>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, marginTop: 6, lineHeight: 18 }}>
                      {symptomsThisMonth > 0
                        ? `You logged ${symptomsThisMonth} symptoms this month. ${topSymptoms[0] ? `${topSymptoms[0][0]} appears most frequently.` : ''} Keep tracking to see what correlates with your cycle phases.`
                        : 'No symptoms logged this month — great! Keep tracking to build a complete picture.'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌿 Phase tips</Text>
              <Text style={styles.cardSub}>{phaseTip.title}</Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {phaseTip.tips.map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: Colors.teal, fontSize: 12, marginTop: 2 }}>✦</Text>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, flex: 1, lineHeight: 18 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Stats Tab ── */}
        {fluxActive && activeTab === 'stats' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Cycle Statistics</Text>
            <Text style={styles.cardSub}>Your personal data at a glance</Text>
            <View style={{ gap: 0, marginTop: 12 }}>
              {[
                { label: 'Total days tracked', value: logs.length, color: Colors.teal, emoji: '◎' },
                { label: 'Heavy flow days', value: flowCounts['heavy'] || 0, color: Colors.rose, emoji: '🌧' },
                { label: 'Medium flow days', value: flowCounts['medium'] || 0, color: Colors.gold, emoji: '🌊' },
                { label: 'Light flow days', value: flowCounts['light'] || 0, color: Colors.sage, emoji: '💧' },
                { label: 'Spotting days', value: flowCounts['spotting'] || 0, color: Colors.mist, emoji: '🩸' },
                { label: 'Symptoms this month', value: symptomsThisMonth, color: Colors.rose, emoji: '📍' },
              ].map(stat => (
                <View key={stat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark }}>
                  <Text style={{ fontSize: 18 }}>{stat.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>{stat.label}</Text>
                    <Text style={{ fontFamily: Fonts.serif, fontSize: 28, color: stat.color }}>{stat.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: Colors.sagePale ?? '#EBF4EC', borderRadius: 12, padding: 12, marginTop: 12 }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.sage }}>
                {logs.length === 0
                  ? '✦ Start logging today to build your cycle picture'
                  : `✦ ${logs.length} day${logs.length !== 1 ? 's' : ''} tracked. Every entry makes your patterns clearer.`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Paywall ── */}
        {!fluxActive && (
          <View style={styles.paywallCard}>

            {/* Best value badge */}
            <View style={{ backgroundColor: Colors.gold, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 14 }}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.plum }}>BEST VALUE — SAVE 17%</Text>
            </View>

            <Text style={styles.paywallHeadline}>
              Everything your body{'\n'}needs. One subscription.
            </Text>
            <Text style={styles.paywallSub}>
              Vela Full Access unlocks FluxLog and CoolDown together — cycle tracking, hot flash relief, pattern insights, and guided breathing protocols.
            </Text>

            {/* Feature list */}
            <View style={{ gap: 10, marginBottom: 20 }}>
              {[
                { emoji: '◎', text: 'FluxLog — cycle + symptom tracking' },
                { emoji: '📅', text: 'Visual calendar + pattern insights' },
                { emoji: '⚡', text: 'CoolDown — 8 hot flash protocols' },
                { emoji: '🌬', text: 'Emergency Cool in 90 seconds' },
                { emoji: '📊', text: 'Stats, trends and phase tips' },
              ].map(f => (
                <View key={f.text} style={styles.featureRow}>
                  <Text style={{ fontSize: 14, width: 22 }}>{f.emoji}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Price comparison */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' }}>FluxLog + CoolDown separately</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' }}>$9.98/mo</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: '#fff' }}>Vela Full Access</Text>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.gold }}>$8.99/mo</Text>
              </View>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>3,800+ women · Most wish they started sooner</Text>
            </View>

            {/* Primary CTA — bundle */}
            <TouchableOpacity delayPressIn={0} style={styles.trialBtn} onPress={handleTrial} activeOpacity={0.85}>
              <Text style={styles.trialBtnTitle}>Try free for 7 days</Text>
              <Text style={styles.trialBtnSub}>Full access · No card required · Cancel anytime</Text>
            </TouchableOpacity>

            {/* Secondary — flux only */}
            <TouchableOpacity delayPressIn={0} onPress={async () => { if (pkg) { setLoading(true); try { await Purchases.purchasePackage(pkg as PurchasesPackage); await unlockFlux(); } catch {} setLoading(false); } }} activeOpacity={0.7}
              style={{ alignItems: 'center', paddingVertical: 10, marginBottom: 4 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Just FluxLog — $4.99/mo</Text>
            </TouchableOpacity>

            <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 8 }}>
              $8.99/month after trial · Auto-renews · Cancel anytime in Apple ID settings
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: '#A8D8E8', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://macpplechic.github.io/vela/terms')}>Terms</Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: '#A8D8E8', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://macpplechic.github.io/vela/privacy')}>Privacy</Text>
            </View>
            <TouchableOpacity delayPressIn={0} style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
              <Text style={styles.restoreBtnText}>Already subscribed? Restore access</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parchment },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  logoText: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.plum },
  subText: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, letterSpacing: 0.5 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  pageTitle: { fontFamily: Fonts.serif, fontSize: 28, color: Colors.plum },
  pageSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginTop: 2 },
  card: { backgroundColor: Colors.cream, borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.plum, marginBottom: 2 },
  cardSub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginBottom: 4 },
  paywallCard: { backgroundColor: Colors.plum, borderRadius: 24, padding: 24, marginBottom: 14 },
  paywallHeadline: { fontFamily: Fonts.serif, fontSize: 22, color: '#fff', marginBottom: 12, lineHeight: 30 },
  paywallSub: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 },
  socialProof: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 18 },
  trialBtn: { backgroundColor: Colors.teal, borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  trialBtnTitle: { fontFamily: Fonts.sansMedium, fontSize: 17, color: Colors.cream, marginBottom: 3 },
  trialBtnSub: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreBtnText: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
