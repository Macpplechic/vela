/**
 * app/doctor.tsx
 * Doctor Appointment Prep
 * Navigate: router.push('/doctor')
 *
 * No competitor has this. Interactive wizard that:
 *  1. Pulls top symptoms, sleep, nutrition from user's data
 *  2. Asks what they want to discuss (HRT, bone, mood, etc.)
 *  3. Generates a printable 1-page talking-points sheet
 *  4. Shares via native share sheet
 */

import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';
import { PHASES } from '../constants/Data';

// ── Discussion topics ──────────────────────────────────────────────────────────

const TOPICS = [
  { id: 'hrt',         label: 'HRT options',          icon: '💊', desc: 'Estrogen, progesterone, testosterone therapy' },
  { id: 'symptoms',    label: 'My symptoms',           icon: '◎',  desc: 'Hot flashes, night sweats, brain fog' },
  { id: 'sleep',       label: 'Sleep problems',        icon: '🌙', desc: 'Insomnia, night sweats, poor quality' },
  { id: 'mood',        label: 'Mood & anxiety',        icon: '🧠', desc: 'Irritability, depression, anxiety' },
  { id: 'bone',        label: 'Bone health / DEXA',   icon: '🦴', desc: 'Osteoporosis risk, bone density scan' },
  { id: 'heart',       label: 'Heart health',          icon: '❤️', desc: 'Blood pressure, cholesterol, risk factors' },
  { id: 'weight',      label: 'Weight changes',        icon: '⚖️', desc: 'Belly fat, metabolism, body composition' },
  { id: 'libido',      label: 'Sexual health',         icon: '🌸', desc: 'Low libido, vaginal dryness, discomfort' },
  { id: 'labs',        label: 'Blood tests / labs',   icon: '🔬', desc: 'Hormone levels, thyroid, vitamin D' },
  { id: 'alternative', label: 'Non-HRT options',       icon: '🌿', desc: 'Supplements, CBT, lifestyle interventions' },
] as const;

type TopicId = typeof TOPICS[number]['id'];

// ── Urgency selector ───────────────────────────────────────────────────────────

const URGENCY_OPTIONS = [
  { id: 'routine',  label: 'Routine check-in',     icon: '📋' },
  { id: 'new',      label: 'New or worsening symptoms', icon: '⚠️' },
  { id: 'followup', label: 'Follow-up appointment', icon: '↩️' },
] as const;

// ── Generate HTML report ───────────────────────────────────────────────────────

function generateHTML({
  topSymptoms,
  avgSleep,
  streak,
  phase,
  suppAdherence,
  avgProtein,
  avgCalcium,
  selectedTopics,
  urgency,
  daysLogged,
  hotFlashDays,
}: {
  topSymptoms: { symptom: string; count: number }[];
  avgSleep: number | null;
  streak: number;
  phase: string;
  suppAdherence: number;
  avgProtein: number;
  avgCalcium: number;
  selectedTopics: TopicId[];
  urgency: string;
  daysLogged: number;
  hotFlashDays: number;
}): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const phaseLabels: Record<string, string> = { early: 'Early perimenopause', mid: 'Mid perimenopause', late: 'Late perimenopause', post: 'Post-menopause' };

  const topicPoints: Record<TopicId, string[]> = {
    hrt: [
      'I would like to discuss hormone replacement therapy options.',
      'Specifically interested in: body-identical HRT (transdermal estrogen + micronized progesterone)',
      'I understand modern HRT has a different risk profile than older synthetic versions — can we discuss what is appropriate for me?',
      'Questions: What form (patch/gel/pill)? What monitoring do I need?',
    ],
    symptoms: topSymptoms.slice(0, 5).map(s => `${s.symptom}: ${s.count} days in the last 30 (${Math.round((s.count / 30) * 100)}% of days)`),
    sleep: [
      `Average sleep quality: ${avgSleep !== null ? `${avgSleep}/5` : 'not yet tracked'}`,
      'Experiencing: ' + (topSymptoms.some(s => s.symptom === 'Night sweats') ? 'night sweats disrupting sleep' : 'difficulty staying asleep'),
      'Would like to discuss: sleep hygiene options, magnesium, or HRT impact on sleep',
    ],
    mood: [
      topSymptoms.some(s => s.symptom === 'Mood swing') ? 'Mood swings logged on multiple days recently' : 'Experiencing mood changes',
      topSymptoms.some(s => s.symptom === 'Anxiety') ? 'Anxiety is in my top tracked symptoms' : '',
      'Would like to discuss: whether this is hormonal vs clinical depression, and options',
    ].filter(Boolean),
    bone: [
      'I have not had a DEXA scan / My last DEXA scan was over 2 years ago',
      'I am aware bone loss accelerates in perimenopause — I would like to discuss my risk',
      `Calcium intake averages ${avgCalcium > 0 ? `${avgCalcium}mg/day` : 'not yet tracked'} (target 1,200mg)`,
      'Taking / considering: Vitamin D3 + K2 supplementation',
    ],
    heart: [
      'Aware that cardiovascular risk increases as estrogen declines',
      'Would like to discuss: blood pressure monitoring, cholesterol panel, and cardiac risk factors',
      'Family history to discuss: [fill in before appointment]',
    ],
    weight: [
      'Noticing changes in body composition / weight distribution',
      'Would like to understand: how hormonal changes affect metabolism and fat distribution',
      'Questions: protein targets, strength training guidance, metabolic support',
    ],
    libido: [
      'Experiencing changes in libido and/or vaginal dryness',
      'Would like to discuss: local estrogen options, lubricants, and any HRT impact on sexual health',
      'Understand this is common and treatable — want to address it directly',
    ],
    labs: [
      'Would like to request: FSH, LH, estradiol, progesterone levels',
      'Also requesting: thyroid panel (TSH, free T3/T4), vitamin D, iron/ferritin, B12',
      'If possible: fasting glucose, HbA1c, full lipid panel',
    ],
    alternative: [
      'Interested in non-HRT options to discuss alongside or instead of hormones',
      'Already trying: paced breathing, magnesium, omega-3',
      'Would like to discuss: CBT for hot flashes (evidence-based), phytoestrogens, black cohosh evidence',
    ],
  };

  const topicsHTML = selectedTopics.map(t => {
    const topic = TOPICS.find(x => x.id === t)!;
    const points = topicPoints[t] ?? [];
    return `
      <div class="topic">
        <h3>${topic.icon} ${topic.label}</h3>
        <ul>
          ${points.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 32px; color: #3D1F3A; }
  .header { border-bottom: 2px solid #3D1F3A; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 26px; margin: 0 0 4px; color: #3D1F3A; }
  .header p { font-size: 13px; color: #888; margin: 0; font-family: Helvetica, sans-serif; }
  .badge { display: inline-block; background: #3D1F3A; color: #F5EDD8; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-family: Helvetica, sans-serif; margin-top: 8px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: #FAF7F2; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-num { font-size: 24px; color: #3D1F3A; display: block; }
  .stat-label { font-size: 10px; color: #A89BB0; font-family: Helvetica, sans-serif; text-transform: uppercase; letter-spacing: 1px; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 13px; font-family: Helvetica, sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #A89BB0; margin: 0 0 10px; border-bottom: 0.5px solid #E2D9CC; padding-bottom: 6px; }
  .topic { margin-bottom: 18px; }
  .topic h3 { font-size: 16px; margin: 0 0 6px; }
  ul { margin: 0; padding-left: 18px; }
  li { font-size: 13px; font-family: Helvetica, sans-serif; line-height: 1.8; color: #3D1F3A; }
  .symptom-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 0.5px solid #E2D9CC; font-family: Helvetica, sans-serif; font-size: 13px; }
  .bar { height: 4px; background: #E2D9CC; border-radius: 2px; margin-top: 3px; }
  .bar-fill { height: 4px; background: #C4645A; border-radius: 2px; }
  .disclaimer { margin-top: 32px; padding: 12px; background: #F5F0E8; border-radius: 8px; font-size: 11px; font-family: Helvetica, sans-serif; color: #A89BB0; line-height: 1.6; }
  .vela-logo { font-size: 11px; color: #B8934A; font-family: Helvetica, sans-serif; margin-top: 24px; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>Doctor Appointment Prep</h1>
    <p>${today}</p>
    <span class="badge">${phaseLabels[phase] ?? 'Perimenopause'} · ${urgency}</span>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="stat-num">${daysLogged}</span>
      <span class="stat-label">Days tracked</span>
    </div>
    <div class="stat">
      <span class="stat-num">${hotFlashDays}</span>
      <span class="stat-label">Hot flash days (30d)</span>
    </div>
    <div class="stat">
      <span class="stat-num">${avgSleep !== null ? `${avgSleep}/5` : '—'}</span>
      <span class="stat-label">Avg sleep quality</span>
    </div>
    <div class="stat">
      <span class="stat-num">${suppAdherence}%</span>
      <span class="stat-label">Supplement adherence</span>
    </div>
  </div>

  <div class="section">
    <h2>Top symptoms (last 30 days)</h2>
    ${topSymptoms.slice(0, 6).map(s => `
      <div class="symptom-row">
        <span>${s.symptom}</span>
        <span style="color:#C4645A">${s.count} days (${Math.round((s.count / 30) * 100)}%)</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${Math.round((s.count / 30) * 100)}%"></div></div>
    `).join('')}
    ${topSymptoms.length === 0 ? '<p style="color:#A89BB0;font-family:Helvetica,sans-serif;font-size:13px">No symptoms logged yet — start logging in Vela to populate this section.</p>' : ''}
  </div>

  <div class="section">
    <h2>Topics I want to discuss</h2>
    ${topicsHTML || '<p style="color:#A89BB0;font-size:13px;font-family:Helvetica,sans-serif">No topics selected.</p>'}
  </div>

  <div class="disclaimer">
    This report was generated by Vela Wellness from my personal health tracking data. It is for informational purposes only and does not constitute medical advice. All data is from self-reported tracking — not clinical measurements.
  </div>

  <div class="vela-logo">Generated by Vela Wellness · velaforwomen.com</div>
</body>
</html>`;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function DoctorScreen() {
  const { history, sleepHistory, phase, streak, mySupps, suppAdherence } = useVelaStore();
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([]);
  const [urgency, setUrgency] = useState<string>('routine');
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'topics' | 'preview'>('topics');

  const pd = PHASES[phase ?? 'late'];

  // Build data summary
  const topSymptoms = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const recent = history.filter(h => new Date(h.date) >= cutoff);
    const counts: Record<string, number> = {};
    recent.forEach(h => (h.symptoms ?? []).forEach((s: string) => { counts[s] = (counts[s] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([symptom, count]) => ({ symptom, count }));
  }, [history]);

  const avgSleep = useMemo(() => {
    const recent = sleepHistory.slice(0, 30);
    if (recent.length === 0) return null;
    return Math.round(recent.reduce((a, s: any) => a + (s.quality ?? 0), 0) / recent.length * 10) / 10;
  }, [sleepHistory]);

  const avgProtein = useMemo(() => {
    const recent = history.filter(h => h.foods?.length > 0).slice(0, 30);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((a, h) => a + (h.totals?.protein ?? 0), 0) / recent.length);
  }, [history]);

  const avgCalcium = useMemo(() => {
    const recent = history.filter(h => h.foods?.length > 0).slice(0, 30);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((a, h) => a + (h.totals?.calcium ?? 0), 0) / recent.length);
  }, [history]);

  const hotFlashDays = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return history.filter(h => new Date(h.date) >= cutoff && h.symptoms?.includes('Hot flash')).length;
  }, [history]);

  const toggleTopic = (id: TopicId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Select at least one topic', 'Choose what you want to discuss with your doctor.');
      return;
    }
    setGenerating(true);
    try {
      const html = generateHTML({
        topSymptoms,
        avgSleep,
        streak,
        phase: phase ?? 'late',
        suppAdherence: suppAdherence(),
        avgProtein,
        avgCalcium,
        selectedTopics,
        urgency,
        daysLogged: history.length,
        hotFlashDays,
      });
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share your doctor prep sheet',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Could not generate', 'Please try again.');
    }
    setGenerating(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Doctor Prep</Text>
          <Text style={styles.titleSub}>Your personalized talking-points sheet</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Your data summary */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Your data at a glance</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Days tracked', value: String(history.length), color: Colors.teal },
              { label: 'Hot flash days (30d)', value: String(hotFlashDays), color: Colors.rose },
              { label: 'Avg sleep', value: avgSleep !== null ? `${avgSleep}/5` : '—', color: Colors.indigo },
              { label: 'Supp adherence', value: `${suppAdherence()}%`, color: Colors.sage },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          {topSymptoms.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Top symptoms (last 30 days)</Text>
              {topSymptoms.slice(0, 4).map(s => (
                <View key={s.symptom} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum }}>{s.symptom}</Text>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.rose }}>{s.count} days</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Urgency */}
        <Text style={styles.sectionLabel}>Appointment type</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {URGENCY_OPTIONS.map(u => (
            <TouchableOpacity key={u.id} onPress={() => setUrgency(u.label)}
              style={[styles.urgencyChip, urgency === u.label && { backgroundColor: Colors.plum, borderColor: Colors.plum }]}
              activeOpacity={0.7}>
              <Text style={{ fontSize: 16, marginBottom: 3 }}>{u.icon}</Text>
              <Text style={[styles.urgencyText, urgency === u.label && { color: Colors.parchment }]}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topic selection */}
        <Text style={styles.sectionLabel}>What do you want to discuss?</Text>
        <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: Colors.mist, marginBottom: 14, lineHeight: 20 }}>
          Select all that apply — Vela will generate specific talking points and questions for each topic from your data.
        </Text>

        {TOPICS.map(t => {
          const selected = selectedTopics.includes(t.id);
          return (
            <TouchableOpacity key={t.id} onPress={() => toggleTopic(t.id)}
              style={[styles.topicRow, selected && { backgroundColor: Colors.plum, borderColor: Colors.plum }]}
              activeOpacity={0.75}>
              <Text style={{ fontSize: 22 }}>{t.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topicLabel, selected && { color: Colors.parchment }]}>{t.label}</Text>
                <Text style={[styles.topicDesc, selected && { color: 'rgba(245,239,230,0.65)' }]}>{t.desc}</Text>
              </View>
              <View style={[styles.checkbox, selected && { backgroundColor: Colors.gold, borderColor: Colors.gold }]}>
                {selected && <Text style={{ color: Colors.plum, fontSize: 12, fontWeight: '600' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Info */}
        <View style={[styles.card, { backgroundColor: Colors.indigoPale, borderColor: Colors.indigo + '30', marginTop: 8 }]}>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum, lineHeight: 19 }}>
            ✦ Vela generates a PDF with your symptom data, selected talking points, and specific questions for each topic.{'\n\n'}
            Bring it to your appointment so you don't forget what you wanted to ask — doctors respond better to specific data than "I just feel off."
          </Text>
        </View>

      </ScrollView>

      {/* Sticky generate button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.generateBtn, selectedTopics.length === 0 && { opacity: 0.5 }]}
          onPress={handleGenerate}
          disabled={generating || selectedTopics.length === 0}
          activeOpacity={0.85}>
          {generating
            ? <ActivityIndicator color={Colors.parchment} />
            : <Text style={styles.generateBtnText}>
                Generate prep sheet{selectedTopics.length > 0 ? ` · ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}` : ''} →
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.parchment },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum },
  back:          { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:         { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:      { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  card:          { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 18, marginBottom: 16 },
  sectionLabel:  { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  statCard:      { flex: 1, minWidth: '45%', backgroundColor: Colors.parchment, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.parchmentDark },
  statNum:       { fontFamily: Fonts.serif, fontSize: 22, marginBottom: 3 },
  statLabel:     { fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, textAlign: 'center' },
  urgencyChip:   { flex: 1, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: Colors.cream },
  urgencyText:   { fontFamily: Fonts.sans, fontSize: 10, color: Colors.mist, textAlign: 'center', marginTop: 2 },
  topicRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 14, marginBottom: 8 },
  topicLabel:    { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.plum, marginBottom: 2 },
  topicDesc:     { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist },
  checkbox:      { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.parchmentDark, alignItems: 'center', justifyContent: 'center' },
  stickyBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: Colors.parchment, borderTopWidth: 0.5, borderTopColor: Colors.parchmentDark },
  generateBtn:   { backgroundColor: Colors.plum, borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  generateBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment },
});
