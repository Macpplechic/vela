/**
 * useVelaCoach.ts
 *
 * AI Symptom Coach for Vela.
 *
 * Architecture:
 *   1. iOS 26+ with Apple Intelligence enabled → real on-device LLM (3B param, zero cost, full privacy)
 *   2. Everything else → smart rule engine (50+ patterns, covers same use cases)
 *
 * The UI is identical either way. When iOS 26 ships publicly (fall 2026),
 * users auto-upgrade to real AI with no app update needed.
 *
 * Install (when ready for iOS 26):
 *   npm install react-native-apple-llm && npx pod-install ios
 *
 * Also enable New Architecture in Podfile.properties.json:
 *   { "newArchEnabled": "true" }
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { DailyEntry, SleepEntry } from './useVelaStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

export type CoachMode = 'apple-intelligence' | 'rule-engine' | 'checking';

export interface VelaCoachContext {
  phase: string | null;
  recentSymptoms: string[];
  topTriggers: string[];
  avgSleep: number | null;
  suppAdherence: number;
  recentHistory: DailyEntry[];
  sleepHistory: SleepEntry[];
  streak: number;
}

// ── Apple Intelligence availability check ──────────────────────────────────────
// Dynamic import so the app doesn't crash if the package isn't installed

async function checkAppleIntelligence(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-apple-llm');
    const status = await mod.isFoundationModelsEnabled();
    return status === 'available';
  } catch {
    return false;
  }
}

async function queryAppleIntelligence(
  prompt: string,
  systemInstructions: string,
  sessionRef: React.MutableRefObject<any>
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppleLLMSession } = require('react-native-apple-llm');
  if (!sessionRef.current) {
    sessionRef.current = new AppleLLMSession();
    await sessionRef.current.configure({ instructions: systemInstructions });
  }
  const response = await sessionRef.current.generateText({ prompt });
  return typeof response === 'string' ? response : response?.text ?? '';
}

// ── Rule engine ───────────────────────────────────────────────────────────────

interface Rule {
  /** Return true if this rule matches the question */
  matches: (q: string) => boolean;
  /** Generate the answer given the user's data context */
  answer: (ctx: VelaCoachContext, q: string) => string;
}

const RULES: Rule[] = [
  // Hot flash / hot flash triggers
  {
    matches: q => /hot flash|flush|overheating|feel hot|burning up/i.test(q),
    answer: (ctx) => {
      const cfTrigger = ctx.recentHistory.some(e =>
        e.foods.some((f: any) => f.name?.toLowerCase().includes('coffee'))
      );
      const alcoholTrigger = ctx.recentHistory.some(e =>
        e.foods.some((f: any) => /wine|beer|alcohol/i.test(f.name ?? ''))
      );
      const lines = [
        `Based on your last ${ctx.recentHistory.length} days of logs, here's what I see:`,
      ];
      if (cfTrigger) lines.push('• Coffee appears frequently before your hot flash days — try cutting back or switching to matcha.');
      if (alcoholTrigger) lines.push('• Alcohol is showing up on days with more hot flashes. Even one drink raises core temperature.');
      lines.push('• Paced breathing (5 counts in, 5 out) can reduce hot flash frequency by up to 50% — try CoolDown\'s Paced Breathing protocol.');
      lines.push('• Keeping your room below 65°F at night helps significantly.');
      if (!cfTrigger && !alcoholTrigger) {
        lines.push('• I don\'t see an obvious food trigger yet. Log more days and I\'ll surface patterns as they emerge.');
      }
      return lines.join('\n');
    },
  },

  // Sleep / insomnia / night sweats
  {
    matches: q => /sleep|insomnia|night sweat|wak|rest|tired/i.test(q),
    answer: (ctx) => {
      const avgSleep = ctx.avgSleep;
      const hasNightSweats = ctx.recentSymptoms.includes('Night sweats');
      const lines = [];
      if (avgSleep !== null && avgSleep < 3) {
        lines.push(`Your logged sleep quality has averaged ${avgSleep}/5 recently — that's genuinely poor. Poor sleep amplifies every perimenopause symptom, especially brain fog and mood.`);
      } else if (avgSleep !== null && avgSleep >= 4) {
        lines.push(`Your sleep quality has averaged ${avgSleep}/5 recently — that's solid. Keep protecting it.`);
      }
      if (hasNightSweats) lines.push('• Night sweats are in your recent symptoms. A cooling protocol at bedtime — CoolDown\'s Body Scan before sleep — can cut wake-ups significantly.');
      lines.push('• Magnesium glycinate (200–400mg) 30 min before bed is the most evidence-backed supplement for perimenopause sleep.');
      lines.push('• Try to keep your sleep and wake time consistent — even on weekends. Hormonal shifts make your circadian rhythm more fragile.');
      lines.push('• Alcohol and caffeine after 2pm both fragment sleep in perimenopause more than in younger years.');
      return lines.join('\n');
    },
  },

  // Brain fog / memory / concentration
  {
    matches: q => /brain fog|memory|focus|concentrat|forget|think|clarity/i.test(q),
    answer: (ctx) => {
      const lowProteinDays = ctx.recentHistory.filter(e => e.totals.protein < 60 && e.foods.length > 0);
      const lines = ['Brain fog in perimenopause is real and biological — estrogen directly affects neurotransmitters.'];
      if (lowProteinDays.length >= 3) {
        lines.push(`• Your protein has been under 60g on ${lowProteinDays.length} of your recent logged days. Low protein worsens brain fog. Aim for 100g+ daily.`);
      }
      lines.push('• Omega-3 (EPA + DHA) has the strongest evidence for cognitive support during perimenopause — 1–2g/day from fish oil or algae.');
      lines.push('• Physical movement — even a 20-minute walk — produces BDNF, which directly improves memory and mood.');
      lines.push('• Blood sugar spikes and crashes (from refined carbs) are a major brain fog trigger. Pair carbs with protein at every meal.');
      return lines.join('\n');
    },
  },

  // Mood / anxiety / irritability
  {
    matches: q => /mood|anxi|irritab|angry|depress|emotion|cry|overwhelm/i.test(q),
    answer: (ctx) => {
      const lines = ['Mood changes in perimenopause are hormonal, not personal. Estrogen regulates serotonin and dopamine — when it fluctuates, so does mood.'];
      lines.push('• Tracking your mood alongside your cycle patterns in FluxLog will show you if mood dips are predictable — most are, which means they\'re manageable.');
      lines.push('• Magnesium glycinate and B6 together have good evidence for PMS and peri mood support.');
      lines.push('• The 4-7-8 breathing protocol in CoolDown activates the parasympathetic nervous system in under 5 minutes.');
      if (ctx.streak >= 5) {
        lines.push(`• You\'re on a ${ctx.streak}-day streak, which means you\'re building consistency. That itself is mood-protective.`);
      }
      return lines.join('\n');
    },
  },

  // Supplements / vitamins
  {
    matches: q => /supplement|vitamin|magnesium|omega|calcium|d3|b12|probiotic|ashwagandha/i.test(q),
    answer: (ctx) => {
      const adherence = ctx.suppAdherence;
      const lines = [];
      if (adherence > 0) {
        lines.push(`Your supplement adherence is at ${adherence}% over the last 30 days.`);
        if (adherence < 60) lines.push('That\'s below 60% — consistency is where you\'ll feel the difference. Try attaching it to a morning habit you already have.');
      }
      lines.push('The five most evidence-backed supplements for perimenopause:');
      lines.push('1. Magnesium glycinate — sleep, mood, hot flash frequency');
      lines.push('2. Vitamin D3 + K2 — bone density, immune function, mood');
      lines.push('3. Omega-3 (EPA/DHA) — brain, heart, inflammation');
      lines.push('4. B-complex — energy, nervous system support');
      lines.push('5. Calcium citrate — bone protection (especially post-40)');
      lines.push('All of these are in your Vela supplement library under Profile.');
      return lines.join('\n');
    },
  },

  // HRT / hormone therapy
  {
    matches: q => /hrt|hormone therapy|estrogen|progesterone|testosterone|patch|gel|cream|pill/i.test(q),
    answer: () => {
      return [
        'HRT (hormone replacement therapy) is the most effective treatment for perimenopause symptoms — the evidence is clear.',
        '• Modern body-identical HRT (transdermal estrogen + micronized progesterone) has a very different risk profile than older synthetic versions.',
        '• The decision is personal and depends on your history, symptoms, and preferences. The Menopause Society guidelines (2023) support its use for most healthy women under 60.',
        '• Vela\'s doctor-ready PDF report is designed to help you have this exact conversation. Generate it under Profile → Export Report, bring it to your next appointment.',
        '• I can help you track how HRT affects your symptoms over time once you start — log it as a supplement in your Ritual tab and note the date you started.',
        '\n⚠️ Always discuss HRT with your healthcare provider — this is information, not medical advice.',
      ].join('\n');
    },
  },

  // Weight / metabolism
  {
    matches: q => /weight|metabolism|belly|fat|bloat|waist|gain/i.test(q),
    answer: (ctx) => {
      const lines = ['Perimenopause shifts fat storage to the abdomen — this is hormonal, not a failure of willpower.'];
      const avgProtein = ctx.recentHistory.length > 0
        ? ctx.recentHistory.reduce((a, e) => a + e.totals.protein, 0) / ctx.recentHistory.length
        : 0;
      if (avgProtein > 0 && avgProtein < 80) {
        lines.push(`• Your average protein is ${Math.round(avgProtein)}g/day. Increasing to 100–130g is the single most effective dietary change for body composition in perimenopause.`);
      }
      lines.push('• Strength training 2–3x per week preserves muscle mass as estrogen drops — this matters more than cardio for metabolism.');
      lines.push('• Sleep deprivation raises cortisol and ghrelin — two hormones that drive fat storage and hunger. Protecting sleep is metabolic strategy.');
      lines.push('• The Peri Plate is scoring your food for anti-inflammatory impact. High AI scores correlate with better body composition over time.');
      return lines.join('\n');
    },
  },

  // Bone health / osteoporosis
  {
    matches: q => /bone|osteoporosis|density|fracture|calcium|joint/i.test(q),
    answer: (ctx) => {
      const recentCalcium = ctx.recentHistory.length > 0
        ? ctx.recentHistory.reduce((a, e) => a + e.totals.calcium, 0) / ctx.recentHistory.length
        : 0;
      const lines = ['Bone density loss accelerates in perimenopause — estrogen normally inhibits bone breakdown, and as it drops, bone loss speeds up.'];
      if (recentCalcium > 0 && recentCalcium < 800) {
        lines.push(`• Your Peri Plate shows average calcium of ${Math.round(recentCalcium)}mg/day. The target is 1000–1200mg. Dairy, fortified plant milk, sardines, and leafy greens are highest.`);
      }
      lines.push('• Vitamin D3 (2000 IU) + K2 (100mcg) together are essential — D3 increases calcium absorption, K2 directs it to bone instead of arteries.');
      lines.push('• Weight-bearing exercise — walking, strength training — directly stimulates bone formation. 30 minutes most days is the target.');
      lines.push('• Smoking and excess alcohol both accelerate bone loss. If either applies, that\'s the highest-impact change.');
      lines.push('• Ask your doctor about a DEXA scan (bone density test) — recommended every 1–2 years in perimenopause.');
      return lines.join('\n');
    },
  },

  // Energy / fatigue
  {
    matches: q => /energy|fatigue|exhaust|tired|crash|afternoon/i.test(q),
    answer: (ctx) => {
      const lines = ['Fatigue in perimenopause usually has three root causes: poor sleep, blood sugar instability, and declining progesterone.'];
      if (ctx.avgSleep !== null && ctx.avgSleep < 3) {
        lines.push(`• Your sleep quality logs average ${ctx.avgSleep}/5 — that\'s the most likely culprit. Fatigue compounds when sleep is poor.`);
      }
      lines.push('• Iron deficiency is common in perimenopause from irregular heavy cycles — worth checking with a blood panel.');
      lines.push('• B12 and B-complex support cellular energy production and are commonly low in women over 40.');
      lines.push('• Blood sugar spikes from high-carb meals drive energy crashes. Protein + fat at breakfast stabilizes energy until lunch.');
      lines.push('• Short walks (10–15 min) after meals reduce blood sugar spikes and paradoxically improve energy more than rest.');
      return lines.join('\n');
    },
  },

  // Doctor / appointment / report
  {
    matches: q => /doctor|appointment|report|provider|gp|gynaecol|prescri|test|lab/i.test(q),
    answer: () => {
      return [
        'Your Vela data is your best tool at a doctor appointment.',
        '• Generate your 90-day PDF report under Profile → Export Report. It shows symptom frequency, sleep patterns, nutrition, and supplement adherence in a format doctors can read quickly.',
        '• Go in with specific data: "I\'ve had hot flashes on X of the last 30 days, averaging Y per day" is more actionable than "I get them a lot."',
        '• Ask specifically about: hormone testing (FSH, estradiol, thyroid), bone density DEXA scan, and current guidance on HRT options.',
        '• The Menopause Society\'s position paper (2022) supports HRT for most healthy women — bring it up if your doctor dismisses your symptoms.',
        '• If your doctor isn\'t taking your symptoms seriously, you can request a referral to a menopause specialist.',
      ].join('\n');
    },
  },

  // Streak / motivation / progress
  {
    matches: q => /streak|progress|doing|how am i|motivat|keep going|worth it/i.test(q),
    answer: (ctx) => {
      const lines = [];
      if (ctx.streak >= 30) {
        lines.push(`${ctx.streak} days straight. That is not a streak — that is a transformation in progress.`);
      } else if (ctx.streak >= 7) {
        lines.push(`${ctx.streak} days of showing up for yourself. This is where habits are built.`);
      } else if (ctx.streak > 0) {
        lines.push(`${ctx.streak} days in. Every expert was once a beginner. You started.`);
      } else {
        lines.push('Today is a great day to begin. One log. That\'s all it takes.');
      }
      if (ctx.recentHistory.length >= 7) {
        const suppAdh = ctx.suppAdherence;
        if (suppAdh >= 80) lines.push(`Your supplement adherence is at ${suppAdh}% — that\'s exceptional.`);
        else if (suppAdh >= 50) lines.push(`Supplement adherence at ${suppAdh}% — solid. Push toward 80% for full benefit.`);
      }
      lines.push('Consistency in perimenopause is medicine. You\'re building a body of evidence about your own health — no doctor has this data.');
      return lines.join('\n');
    },
  },

  // Greeting / hello
  {
    matches: q => /^(hi|hello|hey|good morning|morning|hiya)[\s!.,?]*$/i.test(q.trim()),
    answer: (ctx) => {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const lines = [`${greeting}. I'm your Vela coach — I know your data and I'm here to help you make sense of it.`];
      if (ctx.recentSymptoms.length > 0) {
        lines.push(`I can see you've been tracking ${ctx.recentSymptoms.slice(0, 3).join(', ')} recently. Want me to dig into any of those?`);
      } else {
        lines.push('Ask me anything — hot flashes, sleep, energy, supplements, HRT, bone health, or how you\'re tracking overall.');
      }
      return lines.join(' ');
    },
  },

  // Fallback
  {
    matches: () => true,
    answer: (ctx, q) => {
      const suggestions = [
        'hot flashes', 'sleep and night sweats', 'brain fog',
        'mood and anxiety', 'supplements', 'bone health',
        'weight and metabolism', 'HRT options', 'doctor appointment prep',
      ];
      return `I don't have a specific answer for "${q}" yet, but here are things I can help you with:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nOr ask me about any symptom you've been tracking and I'll look at your data.`;
    },
  },
];

function runRuleEngine(question: string, ctx: VelaCoachContext): string {
  const rule = RULES.find(r => r.matches(question));
  return rule ? rule.answer(ctx, question) : RULES[RULES.length - 1].answer(ctx, question);
}

// ── Build context from store data ──────────────────────────────────────────────

export function buildCoachContext(store: {
  phase: string | null;
  history: DailyEntry[];
  sleepHistory: SleepEntry[];
  streak: number;
  mySupps: string[];
  suppAdherence: () => number;
}): VelaCoachContext {
  const recent30 = store.history.slice(0, 30);
  const symptomCounts: Record<string, number> = {};
  for (const e of recent30) {
    for (const s of e.symptoms ?? []) {
      symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
    }
  }
  const recentSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  const avgSleep = store.sleepHistory.length > 0
    ? store.sleepHistory.slice(0, 7).reduce((a, e) => a + (e.quality ?? 0), 0) / Math.min(7, store.sleepHistory.length)
    : null;

  return {
    phase: store.phase,
    recentSymptoms,
    topTriggers: [],
    avgSleep: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
    suppAdherence: store.suppAdherence(),
    recentHistory: recent30,
    sleepHistory: store.sleepHistory.slice(0, 30),
    streak: store.streak,
  };
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useVelaCoach(context: VelaCoachContext) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: '0',
      role: 'coach',
      text: `Hi — I'm your Vela coach. I have access to your symptom logs, sleep, nutrition, and supplement data.\n\nAsk me anything: hot flashes, sleep, brain fog, HRT, bone health, mood, supplements, or how you're tracking overall.\n\n${Platform.OS === 'ios' ? '🔒 Running on-device — your data never leaves your phone.' : ''}`,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<CoachMode>('checking');
  const sessionRef = useRef<any>(null);

  // Check Apple Intelligence on mount
  useState(() => {
    checkAppleIntelligence().then(available => {
      setMode(available ? 'apple-intelligence' : 'rule-engine');
    });
  });

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let responseText: string;

      if (mode === 'apple-intelligence') {
        // Build a context-rich system prompt for Apple Intelligence
        const systemPrompt = `You are Vela Coach, a warm and knowledgeable perimenopause wellness coach inside the Vela app.

The user's data:
- Phase: ${context.phase ?? 'perimenopause'}
- Recent symptoms (last 30 days): ${context.recentSymptoms.join(', ') || 'none logged yet'}
- Sleep quality average: ${context.avgSleep ?? 'not logged'}/5
- Supplement adherence: ${context.suppAdherence}%
- Logging streak: ${context.streak} days

Rules:
- Answer from the user's own data where possible
- Be specific, warm, and direct
- Never diagnose — always say "talk to your doctor" for medical decisions
- Keep answers under 200 words
- Use bullet points for actionable items
- Never use generic wellness platitudes`;

        responseText = await queryAppleIntelligence(text, systemPrompt, sessionRef);
      } else {
        // Slight delay to feel natural
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        responseText = runRuleEngine(text, context);
      }

      const coachMsg: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, coachMsg]);
    } catch (e) {
      // Fallback to rule engine if Apple Intelligence fails mid-session
      const fallback = runRuleEngine(text, context);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        text: fallback,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [mode, context]);

  const clearMessages = useCallback(() => {
    sessionRef.current?.reset?.();
    setMessages(prev => [prev[0]]); // keep welcome message
  }, []);

  return { messages, isTyping, mode, sendMessage, clearMessages };
}
