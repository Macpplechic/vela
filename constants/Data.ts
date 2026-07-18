import { SUPP_DB_FULL } from './SUPP_DB_generated';


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
    carbs: number;
    fat: number;
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
  carbs?: number;
  fat?: number;
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
    targets: { protein: 100, carbs: 180, fat: 60, fiber: 25, calcium: 1000, magnesium: 320, omega3: 2, phyto: 50 },
  },
  late: {
    key: 'late',
    label: 'Late Perimenopause',
    glyph: '◑',
    desc: 'Cycles are becoming irregular and symptoms more pronounced. Your body is working hard through a significant hormonal transition.',
    ritual: 'Place your hand on your heart for 30 seconds before rising. Breathe slowly and set one gentle intention. You are adapting, not breaking.',
    color: '#C4645A',
    bg: '#FAEAE9',
    targets: { protein: 110, carbs: 175, fat: 65, fiber: 28, calcium: 1200, magnesium: 350, omega3: 2.5, phyto: 60 },
  },
  post: {
    key: 'post',
    label: 'Post-Menopause',
    glyph: '●',
    desc: 'One full year without a period. A new chapter of clarity and stability — with different nutritional needs to protect long-term health.',
    ritual: 'Spend 5 minutes outside or near a window. Natural light helps regulate your circadian rhythm and supports mood and bone health.',
    color: '#6A9E72',
    bg: '#EBF3EC',
    targets: { protein: 120, carbs: 170, fat: 65, fiber: 30, calcium: 1200, magnesium: 420, omega3: 3, phyto: 70 },
  },
};

// ─── Food Database ─────────────────────────────────────────────────────────────



// ─── Supplement Library ────────────────────────────────────────────────────────

// replaced

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

// Extra posts added
const EXTRA_POSTS = [  // new
  { id:20, user:'Maya R.', av:'M', phase:'early' as PhaseKey, tag:'wins', text:'Tried the 4-7-8 breathing during a hot flash at work today. It actually worked. I did it in the bathroom and came back to my desk like nothing happened. 🙌', likes:34, time:'2h' },
  { id:21, user:'Diane C.', av:'D', phase:'late' as PhaseKey, tag:'questions', text:'Has anyone tried magnesium glycinate for sleep? My doctor mentioned it but I want to hear from real people who have actually used it through perimenopause.', likes:28, time:'3h' },
  { id:22, user:'Priya S.', av:'P', phase:'post' as PhaseKey, tag:'tips', text:'GAME CHANGER: I started logging my food in Vela and realized coffee was spiking my hot flashes every single time. Switched to matcha. Flashes down by half in one week.', likes:67, time:'5h' },
  { id:23, user:'Keisha M.', av:'K', phase:'early' as PhaseKey, tag:'health', text:'My doctor actually looked at my Vela report and said it was the most useful thing a patient has ever brought in. She could see my patterns immediately. Do the report ladies.', likes:89, time:'6h' },
  { id:24, user:'Sandra T.', av:'S', phase:'late' as PhaseKey, tag:'wins', text:'Day 14 streak!! I have never been consistent with anything health-related in my life. Something about Vela makes it feel manageable. Small steps.', likes:45, time:'8h' },
  { id:25, user:'Beth W.', av:'B', phase:'early' as PhaseKey, tag:'tips', text:'Flaxseed in overnight oats. Every. Single. Morning. My hormonal acne cleared up in 3 weeks. I know it sounds too simple but phytoestrogens are real and they work.', likes:52, time:'10h' },];

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

export const SUPP_LIBRARY = SUPP_DB_FULL;
