/**
 * app/cbt.tsx
 * 6-Week CBT Program for Hot Flash Relief
 * Navigate: router.push('/cbt')
 *
 * Based on published research: Hunter & Mann (2010), Stefanopoulou & Hunter (2014)
 * CBT reduces hot flash problem rating by 50%+ in clinical trials.
 *
 * Structure: 6 weeks × 5 daily exercises
 * Storage: @vela_cbt_progress
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../constants/Colors';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CBTProgress {
  startDate: string;           // YYYY-MM-DD when user started
  completedDays: string[];     // YYYY-MM-DD of completed days
  weekUnlocked: number;        // 1–6
}

const KEY = '@vela_cbt_progress';
const today = () => new Date().toISOString().split('T')[0];

// ── 6-Week Program ─────────────────────────────────────────────────────────────

const WEEKS = [
  {
    week: 1,
    title: 'Understanding your hot flashes',
    theme: 'Awareness & baseline',
    color: Colors.teal,
    intro: 'This week is about observation, not change. You\'ll build awareness of your hot flash patterns without judgment — when they happen, what triggers them, and how you respond.',
    days: [
      {
        day: 1,
        title: 'The hot flash diary',
        duration: '10 min',
        exercise: 'For the next 24 hours, notice every hot flash without trying to stop it. Note: time of day, what you were doing, intensity (1–10), how long it lasted. This is research, not suffering.',
        reflection: 'What did you notice? Were there patterns?',
        insight: 'Research shows that simply observing hot flashes without catastrophising reduces their perceived intensity. You are becoming a scientist of your own body.',
      },
      {
        day: 2,
        title: 'Your personal triggers',
        duration: '8 min',
        exercise: 'Look back at yesterday\'s observations. Circle any triggers that appeared: coffee, alcohol, stress, heat, spicy food, tight clothing. For each trigger, ask: Is this worth modifying? Start with the easiest one.',
        reflection: 'Which trigger are you most willing to experiment with this week?',
        insight: 'Identifying triggers gives you agency. You can\'t control estrogen — but you can control coffee timing.',
      },
      {
        day: 3,
        title: 'What your thoughts do',
        duration: '10 min',
        exercise: 'When your next hot flash starts, notice the first thought that comes. Common ones: "This is unbearable." "Everyone can see me." "It will never end." Write the thought down without editing. Just observe it.',
        reflection: 'What is the thought you have most often during a hot flash?',
        insight: 'The thought "this is unbearable" is not a fact — it\'s a prediction. CBT works by separating the physical sensation from the story about it.',
      },
      {
        day: 4,
        title: 'The peak and the pass',
        duration: '5 min',
        exercise: 'Visualize your hot flash as a wave. It rises, peaks, and always falls. The next time one starts, silently say: "Here comes the wave. I am safe on the shore. It will peak and pass." Time it. It will be shorter than you expect.',
        reflection: 'Did thinking "it will pass" change your experience?',
        insight: 'The average hot flash lasts 1–5 minutes. When we catastrophise, we extend the suffering beyond the sensation itself.',
      },
      {
        day: 5,
        title: 'Week 1 reflection',
        duration: '15 min',
        exercise: 'Write or think through: (1) What patterns did I notice this week? (2) Which triggers did I spot? (3) What thought do I have most during a flash? (4) Did the "wave" visualization help? You\'ve done the hardest part — starting.',
        reflection: 'What is one thing you know about your hot flashes now that you didn\'t a week ago?',
        insight: 'Awareness is the foundation of every CBT technique. Without observation, there is nothing to work with. You now have data.',
      },
    ],
  },
  {
    week: 2,
    title: 'Paced breathing mastery',
    theme: 'Your most powerful tool',
    color: Colors.teal,
    intro: 'Paced breathing — 5 counts in, 5 counts out — reduces hot flash frequency by up to 50% in clinical trials. This week you\'ll build the habit until it\'s automatic.',
    days: [
      {
        day: 1,
        title: 'Learning the rhythm',
        duration: '8 min',
        exercise: 'Set a timer for 5 minutes. Breathe in through your nose for 5 counts, out through your mouth for 5 counts. Focus only on the count. If you lose count, start again at 1. This is your daily medicine.',
        reflection: 'How did your body feel after 5 minutes?',
        insight: 'Paced breathing at 6 breaths/minute activates the parasympathetic nervous system and reduces core temperature — the physiological trigger for hot flashes.',
      },
      {
        day: 2,
        title: 'Breath on demand',
        duration: '5 min + practice',
        exercise: 'Today, practice starting paced breathing as fast as possible — within the first 3 seconds of noticing warmth rising. Speed matters. Set 3 alarms today as "practice drills" to test how quickly you can shift into paced breathing.',
        reflection: 'How fast can you shift into the breathing pattern?',
        insight: 'The goal is for paced breathing to become automatic — like a reflex. The faster you engage it, the more you interrupt the flash at its start.',
      },
      {
        day: 3,
        title: 'Breathing in public',
        duration: '10 min',
        exercise: 'One of the biggest fears is having a hot flash in public. Practice paced breathing right now in a "public" position — sitting at a table, on a call, standing. It should be invisible. Your mouth barely moves. No one can see you doing it.',
        reflection: 'Was the breathing noticeable to others? How did it feel to practice invisibly?',
        insight: 'Hot flash embarrassment often comes from feeling exposed. Knowing you have an invisible tool changes the experience completely.',
      },
      {
        day: 4,
        title: 'Adding a word',
        duration: '8 min',
        exercise: 'Add a single word to your exhale — a word that means calm to you. "Cool." "Safe." "Through." "Passing." As you breathe out, silently say that word. Practice for 5 minutes now. Use the same word every time — it becomes a cue.',
        reflection: 'What word did you choose? Why?',
        insight: 'Pairing breathing with a cue word creates a conditioned response. Over time, the word alone can trigger a calming effect — useful when you can\'t close your eyes.',
      },
      {
        day: 5,
        title: 'Week 2 integration',
        duration: '10 min',
        exercise: 'Do a full 10-minute paced breathing session today — the longest yet. Count the breaths. Notice how your body feels at minute 1, minute 5, minute 10. Then ask: Am I using this during actual hot flashes? If not, what gets in the way?',
        reflection: 'What is your biggest obstacle to using paced breathing consistently?',
        insight: 'The gap between knowing a technique and using it under pressure is normal. Next week we work on closing that gap.',
      },
    ],
  },
  {
    week: 3,
    title: 'Challenging hot thought patterns',
    theme: 'What your mind adds',
    color: Colors.plumLight,
    intro: 'Hot flashes are physical — but suffering is partly mental. This week you\'ll identify the thoughts that amplify hot flash distress and learn to challenge them directly.',
    days: [
      {
        day: 1,
        title: 'The catastrophe thought',
        duration: '12 min',
        exercise: 'Write down your most catastrophic hot flash thought — the worst-case story. Now answer these 4 questions: (1) What is the actual evidence for this thought? (2) What would I tell a friend who had this thought? (3) What is a more balanced version? (4) What will I actually think when this moment has passed?',
        reflection: 'What did you discover about your catastrophe thought?',
        insight: 'Catastrophising amplifies anxiety, which raises cortisol, which worsens hot flashes. Breaking the thought cycle is not denial — it\'s accurate thinking.',
      },
      {
        day: 2,
        title: 'The embarrassment story',
        duration: '10 min',
        exercise: 'Many women fear others noticing their hot flashes. Test this belief today: Ask one trusted person if they have ever noticed your hot flashes. Most people are far less observant than we fear. Even if they have noticed — what is the actual consequence?',
        reflection: 'What did you discover?',
        insight: 'The imagined social threat of hot flashes is almost always larger than the real one. Testing the belief directly deflates it.',
      },
      {
        day: 3,
        title: 'Reclaiming your body',
        duration: '10 min',
        exercise: 'Write a letter to your body — not about the hot flashes, but about everything it does right. Acknowledging the hard work of a body going through hormonal transition is not weakness. It is accurate. What has your body done well this week?',
        reflection: 'How does your relationship with your body feel after writing this?',
        insight: 'Women who approach perimenopause with self-compassion rather than self-criticism report significantly lower hot flash distress — not fewer flashes, less suffering about them.',
      },
      {
        day: 4,
        title: 'The control question',
        duration: '8 min',
        exercise: 'Draw a circle. Inside: things you can control (triggers, response, thoughts, breathing, sleep). Outside: things you cannot (estrogen levels, timing, genetics, others\' responses). Spend 90% of your energy inside the circle.',
        reflection: 'Are you spending energy outside the circle?',
        insight: 'CBT research consistently shows that perceived control over symptoms — even when that control is partial — significantly reduces distress.',
      },
      {
        day: 5,
        title: 'Week 3 practice',
        duration: '15 min',
        exercise: 'Review your most challenging thought from this week. Apply the 4-question challenge. Then: next time a hot flash starts, your job is to (1) start paced breathing immediately, (2) notice your first thought, (3) replace it with your more balanced version. Practice this sequence now in your imagination.',
        reflection: 'Does the sequence feel natural yet?',
        insight: 'Mental rehearsal activates the same neural pathways as the real event. You are literally preparing your brain.',
      },
    ],
  },
  {
    week: 4,
    title: 'Sleep and night sweats',
    theme: 'Protecting your rest',
    color: Colors.indigo,
    intro: 'Night sweats disrupt sleep, and poor sleep amplifies every perimenopause symptom. This week focuses specifically on the night — before, during, and after disruption.',
    days: [
      {
        day: 1,
        title: 'Your pre-sleep protocol',
        duration: '10 min',
        exercise: 'Design your personal 20-minute wind-down: (1) Room below 65°F. (2) Loose, breathable clothing. (3) Keep a cold damp cloth and glass of water bedside. (4) 5 minutes of paced breathing before sleep. Write your protocol and stick it on your nightstand.',
        reflection: 'Which part of this protocol will be hardest to maintain?',
        insight: 'The brain associates pre-sleep rituals with sleep onset. Consistent rituals shorten sleep latency and reduce middle-of-night arousal.',
      },
      {
        day: 2,
        title: 'The 3am protocol',
        duration: '8 min',
        exercise: 'Write a 3am plan for when night sweats wake you. Keep it on your phone. Include: (1) Touch the cold cloth to your wrists and neck. (2) Sip cold water. (3) Start paced breathing. (4) Say your cue word. (5) Do NOT look at your phone — the light prolongs wakefulness.',
        reflection: 'How prepared do you feel for the next night disruption?',
        insight: 'Having a plan removes the panic response that transforms a 10-minute disruption into an hour of wakefulness.',
      },
      {
        day: 3,
        title: 'Sleep and anxiety',
        duration: '12 min',
        exercise: 'Many women lie awake anxious about the hot flashes they\'re going to have. Write down your three biggest worries about sleep right now. For each one, apply the challenge from Week 3: What is the evidence? What is the balanced thought?',
        reflection: 'Which sleep worry has the least evidence behind it?',
        insight: 'Anticipatory anxiety about sleep is often more disruptive than the hot flashes themselves. Addressing the worry directly is as important as addressing the sweat.',
      },
      {
        day: 4,
        title: 'Sleep restriction (advanced)',
        duration: '10 min',
        exercise: 'If you\'re spending 9+ hours in bed but sleeping only 5–6, try this: Temporarily restrict your sleep window to 6.5 hours (e.g. 12:30am–7am). This builds sleep pressure and improves sleep efficiency. It feels counterintuitive but has the strongest evidence base for insomnia.',
        reflection: 'Are you spending more time in bed than you\'re sleeping?',
        insight: 'Sleep restriction therapy is the most evidence-based treatment for insomnia — outperforming sleep medication in long-term studies.',
      },
      {
        day: 5,
        title: 'Week 4 sleep audit',
        duration: '15 min',
        exercise: 'Look at your last 7 days of Vela sleep logs. What is your average? What\'s the pattern? On which nights did you sleep better — and what was different about those nights? Build your personalized sleep formula from the data.',
        reflection: 'What does your best sleep night have in common?',
        insight: 'Sleep in perimenopause is highly individual. Your data is more valuable than any general guideline.',
      },
    ],
  },
  {
    week: 5,
    title: 'Mood, identity & meaning',
    theme: 'The bigger picture',
    color: Colors.rose,
    intro: 'Perimenopause is not just physical. For many women it triggers a reassessment of identity, relationships, and what matters. This week addresses that layer.',
    days: [
      {
        day: 1,
        title: 'What perimenopause has taken',
        duration: '15 min',
        exercise: 'Write honestly about what you feel perimenopause has taken from you — predictability, energy, the body you knew, certainty. Do not minimise. Let yourself acknowledge what is genuinely hard.',
        reflection: 'What is the hardest loss?',
        insight: 'Grief about perimenopause is legitimate and under-discussed. Acknowledging loss is the first step to adapting to change rather than fighting it.',
      },
      {
        day: 2,
        title: 'What perimenopause has given',
        duration: '15 min',
        exercise: 'Now write what perimenopause has clarified or given you — a sharper sense of what matters, reduced tolerance for things that don\'t, permission to put yourself first. This is not toxic positivity — it\'s the other side of the same truth.',
        reflection: 'What has this transition clarified for you?',
        insight: 'Research on post-traumatic growth finds that difficulty and growth can coexist. Many women describe perimenopause as ultimately clarifying.',
      },
      {
        day: 3,
        title: 'Values check',
        duration: '12 min',
        exercise: 'Write down your top 5 values — what matters most to you right now. Then ask: Are my current daily choices aligned with these values? Where is the biggest gap? One small alignment action per value.',
        reflection: 'What is the one values-aligned action you will take this week?',
        insight: 'Symptoms feel most overwhelming when life feels directionless. Reconnecting with values provides a compass.',
      },
      {
        day: 4,
        title: 'The relationship conversation',
        duration: '15 min',
        exercise: 'Think about the person closest to you. Have they seen your Vela data? Do they understand what\'s happening in your body? Write what you would want them to know — then consider sharing it. You don\'t have to navigate this alone.',
        reflection: 'What is the one thing you wish someone close to you understood?',
        insight: 'Social support is one of the strongest predictors of perimenopause wellbeing. Isolation amplifies symptoms; connection buffers them.',
      },
      {
        day: 5,
        title: 'Week 5 integration',
        duration: '15 min',
        exercise: 'Write a paragraph to yourself — from your future self, 6 months from now, having completed this program. What does she know that you don\'t yet? What has she figured out? What advice does she have for right now?',
        reflection: 'What does your future self most want you to know?',
        insight: 'Future self-writing activates different cognitive processing and often surfaces wisdom that present-tense thinking cannot access.',
      },
    ],
  },
  {
    week: 6,
    title: 'Building your long-term plan',
    theme: 'Sustainable wellbeing',
    color: Colors.sage,
    intro: 'The final week. You have built awareness, breathing mastery, thought skills, sleep tools, and perspective. Now you build the plan that sustains all of it.',
    days: [
      {
        day: 1,
        title: 'Your personal toolkit',
        duration: '15 min',
        exercise: 'List every technique from the last 5 weeks that helped you. Rate each one 1–5 for effectiveness. Circle your top 3. These are your core tools — the ones that go on your phone, your nightstand, and your daily practice.',
        reflection: 'What are your top 3 tools?',
        insight: 'Individual response to CBT techniques varies significantly. Your personal top-3 are more valuable than any general recommendation.',
      },
      {
        day: 2,
        title: 'Your maintenance plan',
        duration: '12 min',
        exercise: 'Write a one-page plan: (1) Daily practice (5 min paced breathing minimum). (2) Weekly check-in (review Vela logs, notice patterns). (3) Monthly reflection (re-read Week 3 thought challenges). (4) What to do when things get hard again.',
        reflection: 'What is the minimum daily practice you will commit to?',
        insight: 'The research shows that brief daily practice maintains CBT gains better than intensive occasional sessions. 5 minutes daily beats 35 minutes weekly.',
      },
      {
        day: 3,
        title: 'Anticipating setbacks',
        duration: '10 min',
        exercise: 'Identify 3 situations that will challenge your practice — travel, high-stress periods, illness. For each, write your plan. Setbacks are not failure — they are expected. Having a setback plan doubles your likelihood of recovery.',
        reflection: 'Which situation is most likely to derail you?',
        insight: 'Relapse prevention planning is a core CBT component. People who plan for setbacks maintain gains significantly longer than those who don\'t.',
      },
      {
        day: 4,
        title: 'Measuring your progress',
        duration: '15 min',
        exercise: 'Go back to your Week 1 hot flash diary entries. Compare with this week. Ask: (1) Are hot flashes less disruptive? (2) Do they end faster? (3) Does my response feel different? (4) Has my relationship with them changed? Progress is often in distress, not frequency.',
        reflection: 'What has changed most — the flashes themselves, or your relationship to them?',
        insight: 'CBT for hot flashes typically reduces hot flash problem rating by 50% — not always frequency, but consistently the suffering attached to them.',
      },
      {
        day: 5,
        title: 'Graduation',
        duration: '20 min',
        exercise: 'You have done 6 weeks of evidence-based work on one of the hardest transitions in a woman\'s life. Write yourself a graduation statement: what you have learned, what you are proud of, and one commitment to your future self. Then share it with someone who matters.',
        reflection: 'What are you most proud of from these 6 weeks?',
        insight: 'You now have the same tools used in published clinical trials that reduced hot flash distress by 50%+ in menopausal women. These tools are yours permanently.',
      },
    ],
  },
];

// ── Main screen ────────────────────────────────────────────────────────────────

export default function CBTScreen() {
  const [progress, setProgress] = useState<CBTProgress | null>(null);
  const [activeDay, setActiveDay] = useState<{ week: number; day: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setProgress(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const saveProgress = async (p: CBTProgress) => {
    setProgress(p);
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  };

  const startProgram = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const p: CBTProgress = { startDate: today(), completedDays: [], weekUnlocked: 1 };
    await saveProgress(p);
  };

  const completeDay = async (week: number, day: number) => {
    if (!progress) return;
    const key = `w${week}d${day}`;
    if (progress.completedDays.includes(key)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const completed = [...progress.completedDays, key];
    // Unlock next week when 4+ days of current week done
    const weekCompleted = WEEKS[week - 1].days.filter(d =>
      completed.includes(`w${week}d${d.day}`)
    ).length;
    const newWeek = weekCompleted >= 4 && week < 6 ? Math.max(progress.weekUnlocked, week + 1) : progress.weekUnlocked;
    await saveProgress({ ...progress, completedDays: completed, weekUnlocked: newWeek });
    setActiveDay(null);
  };

  const isDayComplete = (week: number, day: number) =>
    progress?.completedDays.includes(`w${week}d${day}`) ?? false;

  const weekProgress = (week: number) =>
    WEEKS[week - 1].days.filter(d => isDayComplete(week, d.day)).length;

  const totalComplete = progress ? WEEKS.reduce((a, w) =>
    a + w.days.filter(d => isDayComplete(w.week, d.day)).length, 0) : 0;

  const activeExercise = activeDay
    ? WEEKS[activeDay.week - 1]?.days.find(d => d.day === activeDay.day)
    : null;
  const activeWeekData = activeDay ? WEEKS[activeDay.week - 1] : null;

  if (loading) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header]}><Text style={styles.back} onPress={() => router.back()}>←</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CBT for Hot Flashes</Text>
          <Text style={styles.titleSub}>6-week evidence-based program</Text>
        </View>
        {progress && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{totalComplete}/30</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Not started */}
        {!progress && (
          <>
            <View style={[styles.card, { backgroundColor: Colors.plum }]}>
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Clinical evidence
              </Text>
              <Text style={{ fontFamily: Fonts.serif, fontSize: 22, color: Colors.parchment, lineHeight: 30, marginBottom: 12 }}>
                CBT reduces hot flash distress by up to 50%
              </Text>
              <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(245,239,230,0.75)', lineHeight: 20 }}>
                Based on research by Hunter & Mann (2010) and Stefanopoulou & Hunter (2014) — the same techniques used in NHS menopause clinics. 6 weeks. 5 days per week. 5–15 minutes per day.
              </Text>
            </View>

            {WEEKS.map(w => (
              <View key={w.week} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.weekNum, { backgroundColor: w.color + '20', borderColor: w.color + '40' }]}>
                    <Text style={[styles.weekNumText, { color: w.color }]}>{w.week}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.plum }}>{w.title}</Text>
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>{w.theme}</Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.startBtn} onPress={startProgram} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>Begin 6-week program →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Program in progress */}
        {progress && WEEKS.map(w => {
          const unlocked = w.week <= progress.weekUnlocked;
          const done = weekProgress(w.week);
          const pct = Math.round((done / 5) * 100);

          return (
            <View key={w.week} style={[styles.card, !unlocked && { opacity: 0.45 }]}>
              {/* Week header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={[styles.weekNum, { backgroundColor: w.color + '20', borderColor: w.color + '40' }]}>
                  <Text style={[styles.weekNumText, { color: w.color }]}>{w.week}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.plum }}>{w.title}</Text>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist }}>{w.theme}</Text>
                </View>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: done === 5 ? Colors.sage : Colors.mist }}>
                  {done === 5 ? '✦ done' : `${done}/5`}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: Colors.parchmentDark, borderRadius: 2, marginBottom: 12 }}>
                <View style={{ height: 3, width: `${pct}%` as any, backgroundColor: w.color, borderRadius: 2 }} />
              </View>

              {/* Days */}
              {unlocked && (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {w.days.map(d => {
                    const complete = isDayComplete(w.week, d.day);
                    return (
                      <TouchableOpacity key={d.day}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveDay({ week: w.week, day: d.day }); }}
                        style={[styles.dayChip, complete && { backgroundColor: w.color, borderColor: w.color }]}
                        activeOpacity={0.7}>
                        <Text style={[styles.dayChipText, complete && { color: Colors.cream }]}>
                          {complete ? '✓' : `Day ${d.day}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {!unlocked && (
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist }}>
                  🔒 Complete 4 days of Week {w.week - 1} to unlock
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Day exercise modal */}
      <Modal visible={!!activeDay && !!activeExercise} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setActiveDay(null)}>
        {activeExercise && activeWeekData && (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Week {activeDay?.week} · Day {activeDay?.day}
                </Text>
                <Text style={{ fontFamily: Fonts.serif, fontSize: 20, color: Colors.plum, marginTop: 2 }}>{activeExercise.title}</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist, marginTop: 2 }}>{activeExercise.duration}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveDay(null)} style={{ padding: 8 }}>
                <Text style={{ fontSize: 24, color: Colors.mist }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
              {/* Exercise */}
              <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: activeWeekData.color, borderRadius: 0, borderTopRightRadius: 16, borderBottomRightRadius: 16 }]}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Exercise</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 15, color: Colors.plum, lineHeight: 26 }}>{activeExercise.exercise}</Text>
              </View>

              {/* Reflection */}
              <View style={styles.card}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Reflect</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 14, color: Colors.plum, lineHeight: 22, fontStyle: 'italic' }}>
                  {activeExercise.reflection}
                </Text>
              </View>

              {/* Science insight */}
              <View style={[styles.card, { backgroundColor: Colors.plum }]}>
                <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>The science</Text>
                <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(245,239,230,0.85)', lineHeight: 21 }}>{activeExercise.insight}</Text>
              </View>
            </ScrollView>

            {/* Complete button */}
            <View style={{ padding: 20, paddingBottom: 36, borderTopWidth: 0.5, borderTopColor: Colors.parchmentDark, backgroundColor: Colors.cream }}>
              {isDayComplete(activeDay!.week, activeDay!.day) ? (
                <View style={[styles.completeBtn, { backgroundColor: Colors.sage }]}>
                  <Text style={styles.completeBtnText}>✦ Completed</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.completeBtn} onPress={() => completeDay(activeDay!.week, activeDay!.day)} activeOpacity={0.85}>
                  <Text style={styles.completeBtnText}>Mark complete →</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.parchment },
  header:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum },
  back:              { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:             { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:          { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  progressBadge:     { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  progressBadgeText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.plum },
  card:              { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 18, padding: 18, marginBottom: 12 },
  weekNum:           { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekNumText:       { fontFamily: Fonts.sansMedium, fontSize: 16 },
  dayChip:           { borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.parchment },
  dayChipText:       { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist },
  startBtn:          { backgroundColor: Colors.plum, borderRadius: 20, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  startBtnText:      { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment },
  modalHeader:       { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 0.5, borderBottomColor: Colors.parchmentDark },
  completeBtn:       { backgroundColor: Colors.plum, borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  completeBtnText:   { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.parchment },
});
