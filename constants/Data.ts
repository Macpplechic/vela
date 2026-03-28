// ─── Types ────────────────────────────────────────────────────────────────────

export type PhaseKey = 'early' | 'late' | 'post';

export type Phase = {
  key: PhaseKey;
  label: string;
  glyph: string;
  desc: string;
  ritual: string;
  color: string;
  bg: string;
  targets: {
    protein: number;
    fiber: number;
    calcium: number;
    magnesium: number;
    omega3: number;
    phyto: number;
  };
};

export type Food = {
  id: string;
  name: string;
  category: string;
  protein: number;
  fiber: number;
  calcium: number;
  magnesium: number;
  omega3: number;
  phyto: number;
  cal: number;
  ai: number;
  phase: PhaseKey[];
};

export type Supplement = {
  id: string;
  name: string;
  icon: string;
  dose: string;
  timing: string;
  why: string;
  category: string;
  phase: PhaseKey[];
};

export type CommunityPost = {
  id: number;
  user: string;
  av: string;
  phase: PhaseKey;
  tag: string;
  text: string;
  likes: number;
  time: string;
};

export type BreathStep = { label: string; secs: number; color: string };
export type BreathExercise = {
  id: string;
  name: string;
  tag: string;
  duration: string;
  desc: string;
  steps: BreathStep[];
};

export type SomaticTechnique = {
  id: string;
  name: string;
  duration: string;
  desc: string;
};

// ─── Phases ───────────────────────────────────────────────────────────────────

export const PHASES: Record<PhaseKey, Phase> = {
  early: {
    key: 'early',
    label: 'Early Perimenopause',
    glyph: '◐',
    desc: 'Your cycles are still mostly regular but you may notice subtle shifts — mood changes, sleep disruption, or a new sensitivity to stress.',
    ritual: 'Start your morning with 2 minutes of stillness before checking your phone. Notice what your body needs today — not what your calendar demands.',
    color: '#B8934A',
    bg: '#F5EDD8',
    targets: { protein: 100, fiber: 25, calcium: 1000, magnesium: 320, omega3: 2, phyto: 50 },
  },
  late: {
    key: 'late',
    label: 'Late Perimenopause',
    glyph: '◑',
    desc: 'Cycles are becoming irregular and symptoms more pronounced. Your body is working hard through a significant hormonal transition.',
    ritual: 'Place your hand on your heart for 30 seconds before rising. Breathe slowly and set one gentle intention. You are adapting, not breaking.',
    color: '#C4645A',
    bg: '#FAEAE9',
    targets: { protein: 110, fiber: 28, calcium: 1200, magnesium: 350, omega3: 2.5, phyto: 60 },
  },
  post: {
    key: 'post',
    label: 'Post-Menopause',
    glyph: '●',
    desc: 'One full year without a period. A new chapter of clarity and stability — with different nutritional needs to protect long-term health.',
    ritual: 'Spend 5 minutes outside or near a window. Natural light helps regulate your circadian rhythm and supports mood and bone health.',
    color: '#6A9E72',
    bg: '#EBF3EC',
    targets: { protein: 120, fiber: 30, calcium: 1200, magnesium: 420, omega3: 3, phyto: 70 },
  },
};

// ─── Food Database ─────────────────────────────────────────────────────────────

export const FOOD_DB: Food[] = [
  { id:'salmon',    name:'Wild Salmon',        category:'protein',   protein:20, fiber:0,  calcium:12,  magnesium:27,  omega3:2.2, phyto:0,  cal:208, ai:9,  phase:['early','late','post'] },
  { id:'sardines',  name:'Sardines',           category:'protein',   protein:25, fiber:0,  calcium:382, magnesium:39,  omega3:1.5, phyto:0,  cal:208, ai:8,  phase:['early','late','post'] },
  { id:'chicken',   name:'Chicken Breast',     category:'protein',   protein:31, fiber:0,  calcium:15,  magnesium:29,  omega3:0.1, phyto:0,  cal:165, ai:6,  phase:['early','late','post'] },
  { id:'eggs',      name:'Pasture-Raised Eggs',category:'protein',   protein:13, fiber:0,  calcium:56,  magnesium:12,  omega3:0.3, phyto:0,  cal:155, ai:7,  phase:['early','late','post'] },
  { id:'tempeh',    name:'Tempeh',             category:'protein',   protein:19, fiber:0,  calcium:111, magnesium:81,  omega3:0,   phyto:8,  cal:193, ai:8,  phase:['early','late','post'] },
  { id:'spinach',   name:'Spinach',            category:'vegetable', protein:3,  fiber:2,  calcium:99,  magnesium:79,  omega3:0.1, phyto:8,  cal:23,  ai:9,  phase:['early','late','post'] },
  { id:'broccoli',  name:'Broccoli',           category:'vegetable', protein:3,  fiber:3,  calcium:47,  magnesium:21,  omega3:0.1, phyto:7,  cal:34,  ai:8,  phase:['early','late','post'] },
  { id:'kale',      name:'Kale',               category:'vegetable', protein:4,  fiber:4,  calcium:150, magnesium:34,  omega3:0.2, phyto:6,  cal:33,  ai:9,  phase:['early','late','post'] },
  { id:'edamame',   name:'Edamame',            category:'legume',    protein:11, fiber:5,  calcium:60,  magnesium:64,  omega3:0.3, phyto:9,  cal:121, ai:9,  phase:['early','late','post'] },
  { id:'lentils',   name:'Lentils',            category:'legume',    protein:9,  fiber:8,  calcium:19,  magnesium:36,  omega3:0,   phyto:5,  cal:116, ai:7,  phase:['early','late','post'] },
  { id:'flaxseed',  name:'Ground Flaxseed',    category:'fat',       protein:5,  fiber:8,  calcium:71,  magnesium:110, omega3:2.4, phyto:10, cal:150, ai:10, phase:['early','late','post'] },
  { id:'walnuts',   name:'Walnuts',            category:'fat',       protein:4,  fiber:2,  calcium:28,  magnesium:45,  omega3:2.5, phyto:4,  cal:185, ai:9,  phase:['early','late','post'] },
  { id:'avocado',   name:'Avocado',            category:'fat',       protein:2,  fiber:7,  calcium:12,  magnesium:29,  omega3:0.1, phyto:3,  cal:160, ai:8,  phase:['early','late','post'] },
  { id:'blueberry', name:'Blueberries',        category:'fruit',     protein:1,  fiber:4,  calcium:6,   magnesium:6,   omega3:0,   phyto:9,  cal:57,  ai:10, phase:['early','late','post'] },
  { id:'sweetpot',  name:'Sweet Potato',       category:'vegetable', protein:2,  fiber:4,  calcium:30,  magnesium:25,  omega3:0,   phyto:6,  cal:86,  ai:8,  phase:['early','late','post'] },
  { id:'quinoa',    name:'Quinoa',             category:'grain',     protein:4,  fiber:3,  calcium:17,  magnesium:64,  omega3:0,   phyto:3,  cal:120, ai:6,  phase:['late','post'] },
  { id:'greektyog', name:'Greek Yogurt',       category:'dairy',     protein:10, fiber:0,  calcium:111, magnesium:11,  omega3:0,   phyto:0,  cal:59,  ai:6,  phase:['late','post'] },
  { id:'tofu',      name:'Firm Tofu',          category:'protein',   protein:8,  fiber:0,  calcium:350, magnesium:30,  omega3:0,   phyto:10, cal:76,  ai:8,  phase:['early','late','post'] },
];

// ─── Supplement Library ────────────────────────────────────────────────────────

export const SUPP_LIBRARY: Supplement[] = [
  { id:'omega3',      name:'Omega-3 Fish Oil',      icon:'🐟', dose:'2–3g EPA+DHA',        timing:'With meals',        why:'Reduces inflammation, supports brain and heart health, helps regulate mood.',                         category:'essential',   phase:['early','late','post'] },
  { id:'vitd',        name:'Vitamin D3 + K2',       icon:'☀️', dose:'2000–5000 IU D3',      timing:'With fatty meal',   why:'Critical for bone density, hormone production, immune function, and mood.',                          category:'essential',   phase:['early','late','post'] },
  { id:'mag',         name:'Magnesium Glycinate',   icon:'🌙', dose:'300–400mg',            timing:'Before bed',        why:'Supports deep sleep, reduces cortisol, eases muscle tension and anxiety.',                           category:'essential',   phase:['early','late','post'] },
  { id:'creatine',    name:'Creatine Monohydrate',  icon:'💪', dose:'3–5g daily',           timing:'Any time',          why:'Preserves muscle mass, supports cognitive function and cellular energy.',                            category:'essential',   phase:['early','late','post'] },
  { id:'collagen',    name:'Collagen Peptides',     icon:'✨', dose:'10–20g daily',         timing:'Morning or post-workout', why:'Supports skin elasticity, joint cushioning, and gut lining integrity.',                    category:'essential',   phase:['early','late','post'] },
  { id:'probiotic',   name:'Probiotic (Multi-strain)',icon:'🦠',dose:'10–50 billion CFU',  timing:'Morning, fasted',   why:'Supports gut microbiome, estrogen metabolism, digestion, and immune resilience.',                   category:'essential',   phase:['early','late','post'] },
  { id:'ashwagandha', name:'Ashwagandha KSM-66',    icon:'🌿', dose:'300–600mg extract',   timing:'Evening',           why:'Lowers cortisol, supports thyroid function, reduces anxiety and improves sleep quality.',            category:'calm',        phase:['early','late','post'] },
  { id:'ltheanine',   name:'L-Theanine',            icon:'🍵', dose:'100–200mg',           timing:'As needed or evening', why:'Promotes calm alertness, reduces stress response without sedation.',                            category:'calm',        phase:['early','late','post'] },
  { id:'melatonin',   name:'Melatonin (low-dose)',  icon:'🌛', dose:'0.5–1mg',             timing:'30 min before bed', why:'Regulates sleep-wake cycles — low doses are more effective than high.',                             category:'calm',        phase:['late','post'] },
  { id:'berberine',   name:'Berberine',             icon:'🔥', dose:'500mg 2–3× daily',    timing:'Before meals',      why:'Supports blood sugar balance, gut health, and metabolic function.',                                  category:'metabolism',  phase:['late','post'] },
  { id:'vitc',        name:'Vitamin C',             icon:'🍊', dose:'500–1000mg daily',    timing:'With meals',        why:'Antioxidant, supports collagen synthesis, adrenal health, and immune function.',                     category:'energy',      phase:['early','late','post'] },
  { id:'zinc',        name:'Zinc Bisglycinate',     icon:'⚡', dose:'15–30mg daily',       timing:'With meals',        why:'Supports hormone production, immune function, skin repair, and thyroid health.',                     category:'energy',      phase:['early','late','post'] },
  { id:'biotin',      name:'Biotin',                icon:'💇', dose:'2500–5000mcg daily',  timing:'Morning',           why:'Supports hair thickness, nail strength, and keratin production.',                                   category:'glow',        phase:['early','late','post'] },
  { id:'silica',      name:'Silica (Bamboo extract)',icon:'🌾',dose:'300–500mg daily',     timing:'Morning',           why:'Strengthens collagen matrix, supports skin firmness and hair structure.',                            category:'glow',        phase:['late','post'] },
  { id:'maca',        name:'Maca Root',             icon:'🌱', dose:'1500–3000mg daily',   timing:'Morning',           why:'Adaptogen that may ease hot flashes, support libido, and reduce fatigue.',                           category:'energy',      phase:['early','late'] },
];

// ─── Symptoms ──────────────────────────────────────────────────────────────────

export const SYMPTOMS: string[] = [
  'Hot flashes','Night sweats','Brain fog','Insomnia','Fatigue',
  'Mood swings','Anxiety','Irritability','Low libido','Joint pain',
  'Dry skin','Hair thinning','Heart palpitations','Weight gain','Bloating',
  'Headaches','Vaginal dryness','Memory lapses','Depression','Low energy',
  'Digestive issues','Breast tenderness','Irregular cycles','Heavy bleeding','Spotting',
  'Dizziness','Dry eyes','Muscle weakness','Cold intolerance','Urinary urgency',
];

// ─── Community Posts ───────────────────────────────────────────────────────────

export const COMMUNITY_POSTS: CommunityPost[] = [
  { id:1,  user:'Sarah M.',    av:'SM', phase:'early', tag:'wins',      text:"Flaxseed every morning for 3 weeks — hot flashes down by half. I was skeptical but here we are. ✦",                                                    likes:47, time:'2h' },
  { id:2,  user:'Dr. Reyes',   av:'DR', phase:'post',  tag:'tips',      text:"Reminder: bone density loss accelerates most in the first 5 years post-menopause. Strength training 2-3x per week is non-negotiable. Your bones will thank you.",  likes:89, time:'4h' },
  { id:3,  user:'Priya K.',    av:'PK', phase:'early', tag:'questions', text:"Has anyone tried continuous progesterone instead of cycling? My GP mentioned it but I want real experiences, not just the clinical version.",            likes:23, time:'5h' },
  { id:4,  user:'Michelle T.', av:'MT', phase:'late',  tag:'health',    text:"PSA: your symptoms are real. My first doctor told me I was 'just anxious'. Third opinion finally got me on HRT and I feel human again. Advocate for yourself.", likes:134,time:'8h' },
  { id:5,  user:'Lisa W.',     av:'LW', phase:'post',  tag:'wins',      text:"One year HRT anniversary today. Sleep is back. Brain works again. I exercise without dread. I genuinely love this chapter. 55 is not what I feared.",     likes:201,time:'12h'},
  { id:6,  user:'Anita R.',    av:'AR', phase:'early', tag:'tips',      text:"Magnesium glycinate before bed changed my sleep within a week. 300mg, nothing fancy. If you have not tried it, start there.",                            likes:67, time:'1d' },
  { id:7,  user:'Cath J.',     av:'CJ', phase:'late',  tag:'questions', text:"Does anyone else find that caffeine hits completely differently now? One coffee and I am wired for hours. Switching to matcha slowly.",                     likes:41, time:'1d' },
  { id:8,  user:'Yemi A.',     av:'YA', phase:'post',  tag:'health',    text:"Genitourinary syndrome is real and under-discussed. Local estrogen is safe and effective. Please talk to your gynaecologist - you do not have to just live with it.", likes:98, time:'2d' },
];

// ─── Breathwork ────────────────────────────────────────────────────────────────

export const BREATHWORK: BreathExercise[] = [
  {
    id:'478',
    name:'4-7-8 Breath',
    tag:'Sleep & calm',
    duration:'4 min',
    desc:'Activates the parasympathetic nervous system. Excellent before bed or during a hot flash.',
    steps:[
      { label:'Inhale', secs:4, color:'#4A9B9B' },
      { label:'Hold',   secs:7, color:'#5B6BAD' },
      { label:'Exhale', secs:8, color:'#6A9E72' },
    ],
  },
  {
    id:'box',
    name:'Box Breathing',
    tag:'Cortisol reset',
    duration:'5 min',
    desc:'Used by Navy SEALs to regulate stress response. Resets cortisol and clears mental fog.',
    steps:[
      { label:'Inhale', secs:4, color:'#4A9B9B' },
      { label:'Hold',   secs:4, color:'#5B6BAD' },
      { label:'Exhale', secs:4, color:'#6A9E72' },
      { label:'Hold',   secs:4, color:'#B8934A' },
    ],
  },
  {
    id:'coherent',
    name:'Coherent Breathing',
    tag:'Hormone balance',
    duration:'10 min',
    desc:'5-second inhale, 5-second exhale. Creates heart rate variability linked to hormonal regulation.',
    steps:[
      { label:'Inhale', secs:5, color:'#4A9B9B' },
      { label:'Exhale', secs:5, color:'#6A9E72' },
    ],
  },
  {
    id:'physiological',
    name:'Physiological Sigh',
    tag:'Instant calm',
    duration:'1 min',
    desc:'Double inhale through the nose, long exhale through the mouth. Fastest way to reduce acute stress.',
    steps:[
      { label:'Inhale',  secs:2, color:'#4A9B9B' },
      { label:'Inhale+', secs:1, color:'#5B6BAD' },
      { label:'Exhale',  secs:6, color:'#6A9E72' },
    ],
  },
];

// ─── Somatic Techniques ────────────────────────────────────────────────────────

export const SOMATIC: SomaticTechnique[] = [
  { id:'shake',   name:'Neurogenic Tremoring',        duration:'5 min',  desc:'Stand with feet wide, knees slightly bent. Allow your legs to begin shaking naturally. This discharges stress hormones stored in muscle tissue — it is safe and effective.' },
  { id:'tapping', name:'EFT Tapping',                 duration:'7 min',  desc:'Tap gently on 8 meridian points while naming what you are feeling. Combines elements of acupressure and cognitive therapy to reduce cortisol rapidly.' },
  { id:'scan',    name:'Body Scan Release',           duration:'10 min', desc:'Lie down and bring attention slowly through your body from feet to head. At each area, notice tension and intentionally soften. Activates the rest-and-digest system.' },
  { id:'cold',    name:'Cold Water Face Plunge',      duration:'1 min',  desc:'Fill a bowl with cold water and ice. Submerge your face for 30 seconds. Activates the diving reflex and lowers heart rate within 30–60 seconds.' },
  { id:'pelvic',  name:'Pelvic Floor Release',        duration:'8 min',  desc:'Lie on your back, knees bent. Slowly tilt your pelvis and release 10 times. Then hold a gentle inward breath and release fully. Releases deep pelvic tension linked to anxiety.' },
];

// ─── Doctor Questions ──────────────────────────────────────────────────────────

export const DOCTOR_QUESTIONS: string[] = [
  'What are my options for managing symptoms — both hormonal and non-hormonal?',
  'Am I a candidate for HRT? If not, why specifically?',
  'What baseline tests do you recommend? (hormones, bone density, thyroid, lipids)',
  'How do you define menopause and how will we track my transition?',
  'What symptoms would warrant an urgent follow-up?',
  'How does my family history affect my risk profile here?',
  'What lifestyle changes will have the highest impact for my specific symptoms?',
  'Can you refer me to a menopause specialist if needed?',
];
