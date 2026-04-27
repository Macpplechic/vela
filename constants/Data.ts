import { SUPP_DB_FULL } from './SUPP_DB_generated';

import { FOOD_DB_FULL } from './FOOD_DB_generated';

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

export const FOOD_DB = FOOD_DB_FULL;

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
  { id:"sardines", name:"Sardines (3oz)", category:"protein", protein:21, fiber:0, calcium:325, magnesium:33, omega3:1.4, phyto:0, cal:177, ai:9, phase:["early","late","post"] },
  { id:"mackerel", name:"Mackerel (3oz)", category:"protein", protein:20, fiber:0, calcium:13, magnesium:76, omega3:2.5, phyto:0, cal:223, ai:9, phase:["early","late","post"] },
  { id:"tuna_fresh", name:"Tuna Steak (3oz)", category:"protein", protein:25, fiber:0, calcium:18, magnesium:54, omega3:0.9, phyto:0, cal:156, ai:8, phase:["early","late","post"] },
  { id:"halibut", name:"Halibut (3oz)", category:"protein", protein:23, fiber:0, calcium:51, magnesium:91, omega3:0.5, phyto:0, cal:119, ai:6, phase:["early","late","post"] },
  { id:"trout", name:"Rainbow Trout (3oz)", category:"protein", protein:20, fiber:0, calcium:73, magnesium:26, omega3:1.0, phyto:0, cal:144, ai:7, phase:["early","late","post"] },
  { id:"oysters", name:"Oysters (3oz)", category:"protein", protein:9, fiber:0, calcium:38, magnesium:37, omega3:0.6, phyto:0, cal:69, ai:6, phase:["early","late","post"] },
  { id:"mussels", name:"Mussels (3oz)", category:"protein", protein:18, fiber:0, calcium:28, magnesium:31, omega3:0.7, phyto:0, cal:146, ai:6, phase:["early","late","post"] },
  { id:"herring", name:"Herring (3oz)", category:"protein", protein:16, fiber:0, calcium:51, magnesium:35, omega3:1.7, phyto:0, cal:173, ai:8, phase:["early","late","post"] },
  { id:"shrimp", name:"Shrimp (3oz)", category:"protein", protein:18, fiber:0, calcium:52, magnesium:28, omega3:0.3, phyto:0, cal:84, ai:5, phase:["early","late","post"] },
  { id:"cod", name:"Cod (3oz)", category:"protein", protein:19, fiber:0, calcium:12, magnesium:36, omega3:0.1, phyto:0, cal:89, ai:5, phase:["early","late","post"] },
  { id:"turkey_breast", name:"Turkey Breast (3oz)", category:"protein", protein:26, fiber:0, calcium:16, magnesium:24, omega3:0.1, phyto:0, cal:135, ai:4, phase:["early","late","post"] },
  { id:"beef_sirloin", name:"Beef Sirloin (3oz)", category:"protein", protein:26, fiber:0, calcium:8, magnesium:24, omega3:0.1, phyto:0, cal:207, ai:2, phase:["early","late","post"] },
  { id:"bison", name:"Bison (3oz)", category:"protein", protein:24, fiber:0, calcium:7, magnesium:26, omega3:0.1, phyto:0, cal:152, ai:4, phase:["early","late","post"] },
  { id:"pork_loin", name:"Pork Loin (3oz)", category:"protein", protein:25, fiber:0, calcium:19, magnesium:24, omega3:0.1, phyto:0, cal:178, ai:3, phase:["early","late","post"] },
  { id:"lamb", name:"Lamb (3oz)", category:"protein", protein:23, fiber:0, calcium:17, magnesium:21, omega3:0.2, phyto:0, cal:250, ai:3, phase:["early","late","post"] },
  { id:"greek_yogurt", name:"Greek Yogurt, plain (6oz)", category:"dairy", protein:17, fiber:0, calcium:200, magnesium:19, omega3:0.1, phyto:0, cal:100, ai:5, phase:["early","late","post"] },
  { id:"kefir", name:"Kefir (1 cup)", category:"dairy", protein:11, fiber:0, calcium:300, magnesium:30, omega3:0.2, phyto:0, cal:160, ai:6, phase:["early","late","post"] },
  { id:"cottage_cheese", name:"Cottage Cheese (0.5 cup)", category:"dairy", protein:14, fiber:0, calcium:80, magnesium:11, omega3:0.1, phyto:0, cal:110, ai:3, phase:["early","late","post"] },
  { id:"cheese_parmesan", name:"Parmesan (1oz)", category:"dairy", protein:10, fiber:0, calcium:331, magnesium:12, omega3:0.1, phyto:0, cal:111, ai:2, phase:["early","late","post"] },
  { id:"cheese_feta", name:"Feta Cheese (1oz)", category:"dairy", protein:4, fiber:0, calcium:140, magnesium:5, omega3:0.1, phyto:0, cal:75, ai:3, phase:["early","late","post"] },
  { id:"ricotta", name:"Ricotta (0.5 cup)", category:"dairy", protein:14, fiber:0, calcium:257, magnesium:18, omega3:0.2, phyto:0, cal:216, ai:3, phase:["early","late","post"] },
  { id:"egg_whites", name:"Egg Whites (3 large)", category:"protein", protein:11, fiber:0, calcium:7, magnesium:9, omega3:0, phyto:0, cal:51, ai:3, phase:["early","late","post"] },
  { id:"tempeh", name:"Tempeh (3oz)", category:"protein", protein:16, fiber:3, calcium:92, magnesium:58, omega3:0.2, phyto:30, cal:160, ai:8, phase:["early","late","post"] },
  { id:"tofu_silken", name:"Silken Tofu (3oz)", category:"protein", protein:5, fiber:0.1, calcium:30, magnesium:15, omega3:0.2, phyto:25, cal:45, ai:6, phase:["early","late","post"] },
  { id:"lentils", name:"Lentils (0.5 cup cooked)", category:"protein", protein:9, fiber:8, calcium:19, magnesium:36, omega3:0.1, phyto:2, cal:115, ai:7, phase:["early","late","post"] },
  { id:"black_beans", name:"Black Beans (0.5 cup)", category:"protein", protein:8, fiber:7, calcium:23, magnesium:60, omega3:0.1, phyto:2, cal:114, ai:7, phase:["early","late","post"] },
  { id:"chickpeas", name:"Chickpeas (0.5 cup)", category:"protein", protein:7, fiber:6, calcium:40, magnesium:39, omega3:0.1, phyto:1, cal:134, ai:6, phase:["early","late","post"] },
  { id:"kidney_beans", name:"Kidney Beans (0.5 cup)", category:"protein", protein:8, fiber:6, calcium:25, magnesium:37, omega3:0.1, phyto:1, cal:112, ai:6, phase:["early","late","post"] },
  { id:"pinto_beans", name:"Pinto Beans (0.5 cup)", category:"protein", protein:8, fiber:7, calcium:39, magnesium:43, omega3:0.1, phyto:1, cal:122, ai:6, phase:["early","late","post"] },
  { id:"natto", name:"Natto (3oz)", category:"protein", protein:16, fiber:4.4, calcium:191, magnesium:100, omega3:0.7, phyto:40, cal:186, ai:8, phase:["early","late","post"] },
  { id:"miso", name:"Miso Paste (1 tbsp)", category:"protein", protein:2, fiber:0.9, calcium:9, magnesium:7, omega3:0, phyto:10, cal:34, ai:7, phase:["early","late","post"] },
  { id:"pumpkin_seeds", name:"Pumpkin Seeds (1oz)", category:"seeds", protein:7, fiber:1.1, calcium:14, magnesium:156, omega3:0.1, phyto:0, cal:151, ai:8, phase:["early","late","post"] },
  { id:"sunflower_seeds", name:"Sunflower Seeds (1oz)", category:"seeds", protein:5, fiber:2.4, calcium:20, magnesium:91, omega3:0.1, phyto:0, cal:165, ai:7, phase:["early","late","post"] },
  { id:"sesame_seeds", name:"Sesame Seeds (1 tbsp)", category:"seeds", protein:2, fiber:1, calcium:88, magnesium:32, omega3:0.1, phyto:8, cal:52, ai:6, phase:["early","late","post"] },
  { id:"tahini", name:"Tahini (2 tbsp)", category:"seeds", protein:5, fiber:2, calcium:128, magnesium:29, omega3:0.1, phyto:5, cal:178, ai:7, phase:["early","late","post"] },
  { id:"brazil_nuts", name:"Brazil Nuts (2 nuts)", category:"nuts", protein:2, fiber:0.5, calcium:23, magnesium:41, omega3:0, phyto:0, cal:66, ai:6, phase:["early","late","post"] },
  { id:"cashews", name:"Cashews (1oz)", category:"nuts", protein:5, fiber:1, calcium:10, magnesium:83, omega3:0, phyto:0, cal:157, ai:5, phase:["early","late","post"] },
  { id:"pecans", name:"Pecans (1oz)", category:"nuts", protein:3, fiber:2.7, calcium:20, magnesium:34, omega3:0.3, phyto:0, cal:196, ai:6, phase:["early","late","post"] },
  { id:"almond_butter", name:"Almond Butter (2 tbsp)", category:"nuts", protein:7, fiber:3, calcium:111, magnesium:49, omega3:0, phyto:0, cal:196, ai:7, phase:["early","late","post"] },
  { id:"arugula", name:"Arugula (2 cups)", category:"vegetables", protein:1, fiber:0.7, calcium:64, magnesium:19, omega3:0.1, phyto:1, cal:10, ai:8, phase:["early","late","post"] },
  { id:"swiss_chard", name:"Swiss Chard (2 cups)", category:"vegetables", protein:1, fiber:1.3, calcium:37, magnesium:57, omega3:0, phyto:1, cal:14, ai:9, phase:["early","late","post"] },
  { id:"collard_greens", name:"Collard Greens (1 cup cooked)", category:"vegetables", protein:4, fiber:5, calcium:268, magnesium:38, omega3:0.1, phyto:2, cal:49, ai:9, phase:["early","late","post"] },
  { id:"watercress", name:"Watercress (2 cups)", category:"vegetables", protein:2, fiber:0.4, calcium:82, magnesium:14, omega3:0.1, phyto:1, cal:8, ai:9, phase:["early","late","post"] },
  { id:"bok_choy", name:"Bok Choy (1 cup cooked)", category:"vegetables", protein:2, fiber:2, calcium:158, magnesium:19, omega3:0.1, phyto:2, cal:20, ai:8, phase:["early","late","post"] },
  { id:"beet_greens", name:"Beet Greens (1 cup cooked)", category:"vegetables", protein:2, fiber:2, calcium:164, magnesium:98, omega3:0, phyto:1, cal:39, ai:8, phase:["early","late","post"] },
  { id:"cauliflower", name:"Cauliflower (1 cup)", category:"vegetables", protein:2, fiber:2, calcium:22, magnesium:15, omega3:0, phyto:1, cal:25, ai:8, phase:["early","late","post"] },
  { id:"brussels_sprouts", name:"Brussels Sprouts (1 cup)", category:"vegetables", protein:3, fiber:3.3, calcium:37, magnesium:20, omega3:0.1, phyto:2, cal:38, ai:9, phase:["early","late","post"] },
  { id:"red_cabbage", name:"Red Cabbage (1 cup)", category:"vegetables", protein:1, fiber:2, calcium:40, magnesium:14, omega3:0.1, phyto:2, cal:28, ai:8, phase:["early","late","post"] },
  { id:"cabbage", name:"Cabbage (1 cup)", category:"vegetables", protein:1, fiber:1.8, calcium:40, magnesium:11, omega3:0.1, phyto:1, cal:22, ai:7, phase:["early","late","post"] },
  { id:"beets", name:"Beets (1 cup cooked)", category:"vegetables", protein:2, fiber:3.4, calcium:23, magnesium:31, omega3:0, phyto:0, cal:75, ai:8, phase:["early","late","post"] },
  { id:"bell_pepper_red", name:"Red Bell Pepper (1 medium)", category:"vegetables", protein:1, fiber:2.5, calcium:10, magnesium:13, omega3:0, phyto:0, cal:37, ai:8, phase:["early","late","post"] },
  { id:"asparagus", name:"Asparagus (6 spears)", category:"vegetables", protein:2, fiber:1.8, calcium:27, magnesium:13, omega3:0.1, phyto:0, cal:20, ai:8, phase:["early","late","post"] },
  { id:"mushrooms_shiitake", name:"Shiitake Mushrooms (1 cup)", category:"vegetables", protein:2, fiber:2, calcium:4, magnesium:20, omega3:0, phyto:0, cal:81, ai:7, phase:["early","late","post"] },
  { id:"garlic", name:"Garlic (3 cloves)", category:"vegetables", protein:1, fiber:0.5, calcium:16, magnesium:5, omega3:0, phyto:1, cal:13, ai:9, phase:["early","late","post"] },
  { id:"artichoke", name:"Artichoke (1 medium)", category:"vegetables", protein:4, fiber:6.9, calcium:56, magnesium:77, omega3:0.1, phyto:0, cal:60, ai:8, phase:["early","late","post"] },
  { id:"zucchini", name:"Zucchini (1 cup)", category:"vegetables", protein:1, fiber:1.4, calcium:19, magnesium:21, omega3:0.1, phyto:0, cal:21, ai:6, phase:["early","late","post"] },
  { id:"eggplant", name:"Eggplant (1 cup cooked)", category:"vegetables", protein:1, fiber:2.5, calcium:12, magnesium:11, omega3:0, phyto:0, cal:35, ai:6, phase:["early","late","post"] },
  { id:"tomato_cherry", name:"Cherry Tomatoes (1 cup)", category:"vegetables", protein:1, fiber:1.8, calcium:18, magnesium:14, omega3:0, phyto:0, cal:27, ai:7, phase:["early","late","post"] },
  { id:"cucumber", name:"Cucumber (1 cup)", category:"vegetables", protein:1, fiber:0.7, calcium:19, magnesium:13, omega3:0, phyto:0, cal:16, ai:5, phase:["early","late","post"] },
  { id:"blueberries", name:"Blueberries (1 cup)", category:"fruits", protein:1, fiber:3.6, calcium:9, magnesium:9, omega3:0.1, phyto:1, cal:84, ai:10, phase:["early","late","post"] },
  { id:"raspberries", name:"Raspberries (1 cup)", category:"fruits", protein:1, fiber:8, calcium:31, magnesium:27, omega3:0.1, phyto:2, cal:64, ai:9, phase:["early","late","post"] },
  { id:"blackberries", name:"Blackberries (1 cup)", category:"fruits", protein:2, fiber:7.6, calcium:42, magnesium:29, omega3:0.1, phyto:2, cal:62, ai:9, phase:["early","late","post"] },
  { id:"pomegranate", name:"Pomegranate Seeds (0.5 cup)", category:"fruits", protein:1, fiber:3.5, calcium:9, magnesium:10, omega3:0, phyto:4, cal:72, ai:9, phase:["early","late","post"] },
  { id:"cherries", name:"Cherries (1 cup)", category:"fruits", protein:2, fiber:3, calcium:18, magnesium:15, omega3:0, phyto:1, cal:87, ai:8, phase:["early","late","post"] },
  { id:"kiwi", name:"Kiwi (2 medium)", category:"fruits", protein:1, fiber:4.2, calcium:52, magnesium:26, omega3:0.1, phyto:3, cal:84, ai:8, phase:["early","late","post"] },
  { id:"papaya", name:"Papaya (1 cup)", category:"fruits", protein:1, fiber:2.5, calcium:29, magnesium:30, omega3:0, phyto:1, cal:55, ai:7, phase:["early","late","post"] },
  { id:"mango", name:"Mango (1 cup)", category:"fruits", protein:1, fiber:2.6, calcium:18, magnesium:16, omega3:0, phyto:0, cal:99, ai:6, phase:["early","late","post"] },
  { id:"orange", name:"Orange (1 medium)", category:"fruits", protein:1, fiber:3.1, calcium:60, magnesium:13, omega3:0, phyto:1, cal:62, ai:7, phase:["early","late","post"] },
  { id:"pear", name:"Pear (1 medium)", category:"fruits", protein:1, fiber:5.5, calcium:16, magnesium:12, omega3:0, phyto:0, cal:101, ai:6, phase:["early","late","post"] },
  { id:"grapefruit", name:"Grapefruit (0.5 fruit)", category:"fruits", protein:1, fiber:2, calcium:27, magnesium:11, omega3:0, phyto:1, cal:52, ai:7, phase:["early","late","post"] },
  { id:"figs", name:"Figs (2 medium)", category:"fruits", protein:1, fiber:2.9, calcium:35, magnesium:17, omega3:0, phyto:3, cal:74, ai:6, phase:["early","late","post"] },
  { id:"dates", name:"Dates, Medjool (3)", category:"fruits", protein:2, fiber:5.3, calcium:48, magnesium:43, omega3:0, phyto:0, cal:201, ai:4, phase:["early","late","post"] },
  { id:"pineapple", name:"Pineapple (1 cup)", category:"fruits", protein:1, fiber:2.3, calcium:21, magnesium:20, omega3:0, phyto:0, cal:82, ai:6, phase:["early","late","post"] },
  { id:"quinoa", name:"Quinoa (0.5 cup cooked)", category:"grains", protein:4, fiber:2.6, calcium:16, magnesium:59, omega3:0.1, phyto:0, cal:111, ai:7, phase:["early","late","post"] },
  { id:"farro", name:"Farro (0.5 cup cooked)", category:"grains", protein:3, fiber:3.5, calcium:15, magnesium:30, omega3:0, phyto:0, cal:100, ai:5, phase:["early","late","post"] },
  { id:"buckwheat", name:"Buckwheat (0.5 cup cooked)", category:"grains", protein:3, fiber:2.3, calcium:6, magnesium:51, omega3:0, phyto:0, cal:77, ai:6, phase:["early","late","post"] },
  { id:"sourdough", name:"Sourdough Bread (1 slice)", category:"grains", protein:4, fiber:1, calcium:19, magnesium:10, omega3:0, phyto:0, cal:90, ai:4, phase:["early","late","post"] },
  { id:"whole_wheat_bread", name:"Whole Wheat Bread (1 slice)", category:"grains", protein:4, fiber:2, calcium:30, magnesium:24, omega3:0.1, phyto:0, cal:81, ai:4, phase:["early","late","post"] },
  { id:"whole_wheat_pasta", name:"Whole Wheat Pasta (0.5 cup cooked)", category:"grains", protein:4, fiber:3, calcium:11, magnesium:21, omega3:0, phyto:0, cal:87, ai:4, phase:["early","late","post"] },
  { id:"barley", name:"Barley (0.5 cup cooked)", category:"grains", protein:2, fiber:3, calcium:9, magnesium:17, omega3:0, phyto:0, cal:97, ai:5, phase:["early","late","post"] },
  { id:"millet", name:"Millet (0.5 cup cooked)", category:"grains", protein:3, fiber:1.6, calcium:3, magnesium:38, omega3:0, phyto:0, cal:104, ai:5, phase:["early","late","post"] },
  { id:"olive_oil", name:"Olive Oil (1 tbsp)", category:"fats", protein:0, fiber:0, calcium:0, magnesium:0, omega3:0.1, phyto:0, cal:119, ai:8, phase:["early","late","post"] },
  { id:"avocado_oil", name:"Avocado Oil (1 tbsp)", category:"fats", protein:0, fiber:0, calcium:0, magnesium:0, omega3:0.1, phyto:0, cal:124, ai:7, phase:["early","late","post"] },
  { id:"flaxseed_oil", name:"Flaxseed Oil (1 tbsp)", category:"fats", protein:0, fiber:0, calcium:0, magnesium:0, omega3:7.3, phyto:3, cal:120, ai:9, phase:["early","late","post"] },
  { id:"matcha", name:"Matcha (1 tsp in water)", category:"drinks", protein:1, fiber:0, calcium:4, magnesium:2, omega3:0, phyto:2, cal:5, ai:10, phase:["early","late","post"] },
  { id:"bone_broth", name:"Bone Broth (1 cup)", category:"drinks", protein:10, fiber:0, calcium:150, magnesium:15, omega3:0, phyto:0, cal:50, ai:7, phase:["early","late","post"] },
  { id:"soy_milk", name:"Soy Milk (1 cup)", category:"drinks", protein:7, fiber:0.5, calcium:300, magnesium:47, omega3:0.4, phyto:25, cal:80, ai:6, phase:["early","late","post"] },
  { id:"oat_milk", name:"Oat Milk (1 cup)", category:"drinks", protein:3, fiber:2, calcium:350, magnesium:27, omega3:0, phyto:0, cal:120, ai:5, phase:["early","late","post"] },
  { id:"kombucha", name:"Kombucha (8oz)", category:"drinks", protein:0, fiber:0, calcium:8, magnesium:5, omega3:0, phyto:0, cal:30, ai:6, phase:["early","late","post"] },
  { id:"tart_cherry_juice", name:"Tart Cherry Juice (4oz)", category:"drinks", protein:1, fiber:0, calcium:13, magnesium:14, omega3:0, phyto:1, cal:67, ai:8, phase:["early","late","post"] },
  { id:"green_tea", name:"Green Tea (1 cup)", category:"drinks", protein:0, fiber:0, calcium:2, magnesium:3, omega3:0, phyto:2, cal:2, ai:9, phase:["early","late","post"] },
  { id:"dark_chocolate_85", name:"Dark Chocolate 85% (1oz)", category:"treats", protein:2, fiber:3.1, calcium:20, magnesium:64, omega3:0, phyto:0, cal:170, ai:8, phase:["early","late","post"] },
  { id:"dark_chocolate_70", name:"Dark Chocolate 70% (1oz)", category:"treats", protein:2, fiber:2.2, calcium:15, magnesium:45, omega3:0, phyto:0, cal:170, ai:7, phase:["early","late","post"] },
  { id:"turmeric", name:"Turmeric (1 tsp)", category:"spices", protein:0, fiber:0.5, calcium:4, magnesium:4, omega3:0, phyto:0, cal:8, ai:10, phase:["early","late","post"] },
  { id:"ginger_fresh", name:"Fresh Ginger (1 tsp grated)", category:"spices", protein:0, fiber:0.1, calcium:2, magnesium:3, omega3:0, phyto:0, cal:2, ai:9, phase:["early","late","post"] },
  { id:"cinnamon", name:"Cinnamon (1 tsp)", category:"spices", protein:0, fiber:1.4, calcium:26, magnesium:2, omega3:0, phyto:0, cal:6, ai:8, phase:["early","late","post"] },
];
];
];

// ─── Somatic Techniques ────────────────────────────────────────────────────────

export const SOMATIC: SomaticTechnique[] = [
  { id:'shake',   name:'Neurogenic Tremoring',        duration:'5 min',  desc:'Stand with feet wide, knees slightly bent. Allow your legs to begin shaking naturally. This discharges stress hormones stored in muscle tissue — it is safe and effective.' },
  { id:'tapping', name:'EFT Tapping',                 duration:'7 min',  desc:'Tap gently on 8 meridian points while naming what you are feeling. Combines elements of acupressure and cognitive therapy to reduce cortisol rapidly.' },
  { id:'scan',    name:'Body Scan Release',           duration:'10 min', desc:'Lie down and bring attention slowly through your body from feet to head. At each area, notice tension and intentionally soften. Activates the rest-and-digest system.' },
  { id:'cold',    name:'Cold Water Face Plunge',      duration:'1 min',  desc:'Fill a bowl with cold water and ice. Submerge your face for 30 seconds. Activates the diving reflex and lowers heart rate within 30–60 seconds.' },
  { id:'pelvic',  name:'Pelvic Floor Release',        duration:'8 min',  desc:'Lie on your back, knees bent. Slowly tilt your pelvis and release 10 times. Then hold a gentle inward breath and release fully. Releases deep pelvic tension linked to anxiety.' },

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


export const SUPP_LIBRARY = SUPP_DB_FULL;
