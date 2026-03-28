import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ReportData {
  phase: string;
  phaseLabel: string;
  symptoms: string[];
  topSymptoms: { symptom: string; count: number }[];
  history: {
    date: string;
    foods: { name: string; protein: number; cal: number }[];
    symptoms: string[];
    checkedSupps: string[];
    journal: string;
    totals: { protein: number; fiber: number; calcium: number; magnesium: number; omega3: number; cal: number };
  }[];
  sleepHistory: {
    date: string;
    quality: number | null;
    nightSweats: boolean;
    wakeCount: number;
  }[];
  mySupps: string[];
  suppAdherence: number;
  avgNutrients: { protein: number; fiber: number; calcium: number; magnesium: number; omega3: number; cal: number };
}

const Q_LABELS = ["","Poor","Fair","Good","Great","Deep"];
const Q_COLORS = ["","#C4645A","#C4645A","#B8934A","#6A9E72","#4A9B9B"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function last90Days(history: ReportData["history"]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  return history.filter(e => new Date(e.date) >= cutoff);
}

function last90Sleep(sleepHistory: ReportData["sleepHistory"]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  return sleepHistory.filter(e => new Date(e.date) >= cutoff);
}

export async function generateDoctorReport(data: ReportData): Promise<void> {
  const recent = last90Days(data.history);
  const recentSleep = last90Sleep(data.sleepHistory);
  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const avgSleepQ = recentSleep.filter(e => e.quality).length > 0
    ? (recentSleep.filter(e=>e.quality).reduce((a,e)=>a+(e.quality??0),0) / recentSleep.filter(e=>e.quality).length).toFixed(1)
    : "N/A";
  const nightSweatNights = recentSleep.filter(e => e.nightSweats).length;
  const avgWakes = recentSleep.length > 0
    ? (recentSleep.reduce((a,e)=>a+e.wakeCount,0)/recentSleep.length).toFixed(1)
    : "N/A";
  const daysWithFood = recent.filter(e => e.foods.length > 0).length;

  // Symptom frequency
  const symCounts: Record<string, number> = {};
  recent.forEach(e => e.symptoms.forEach(s => { symCounts[s] = (symCounts[s]??0)+1; }));
  const topSyms = Object.entries(symCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; color: #2C1F2A; background: #fff; padding: 40px; }
  .header { border-bottom: 3px solid #3D1F3A; padding-bottom: 24px; margin-bottom: 32px; }
  .logo { font-size: 36px; color: #3D1F3A; letter-spacing: 6px; margin-bottom: 4px; }
  .tagline { font-family: Arial, sans-serif; font-size: 11px; color: #A89BB0; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
  .report-title { font-size: 20px; color: #3D1F3A; margin-bottom: 4px; }
  .report-date { font-family: Arial, sans-serif; font-size: 12px; color: #A89BB0; }
  .section { margin-bottom: 32px; }
  .section-title { font-family: Arial, sans-serif; font-size: 10px; color: #B8934A; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #E2D9CC; padding-bottom: 6px; }
  .phase-card { background: #F5EDD8; border-left: 4px solid #B8934A; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
  .phase-name { font-size: 18px; color: #3D1F3A; margin-bottom: 4px; }
  .phase-sub { font-family: Arial, sans-serif; font-size: 12px; color: #A89BB0; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-box { background: #FAF7F2; border: 1px solid #E2D9CC; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-num { font-size: 24px; color: #3D1F3A; }
  .stat-label { font-family: Arial, sans-serif; font-size: 9px; color: #A89BB0; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .sym-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .sym-chip { background: #FAEAE9; border: 1px solid #C4645A; border-radius: 20px; padding: 4px 12px; font-family: Arial, sans-serif; font-size: 11px; color: #C4645A; }
  .sym-count { font-weight: bold; }
  .day-entry { border-bottom: 1px solid #E2D9CC; padding: 12px 0; }
  .day-date { font-family: Arial, sans-serif; font-size: 11px; color: #B8934A; font-weight: bold; margin-bottom: 6px; }
  .day-line { font-family: Arial, sans-serif; font-size: 11px; color: #A89BB0; margin-bottom: 3px; }
  .day-journal { font-style: italic; font-size: 11px; color: #A89BB0; margin-top: 4px; }
  .sleep-entry { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid #E2D9CC; font-family: Arial, sans-serif; font-size: 11px; }
  .q-badge { border-radius: 10px; padding: 2px 8px; font-size: 10px; font-weight: bold; }
  .supp-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .supp-chip { background: #F5EDD8; border: 1px solid #B8934A; border-radius: 20px; padding: 4px 12px; font-family: Arial, sans-serif; font-size: 11px; color: #3D1F3A; }
  .doctor-q { font-family: Arial, sans-serif; font-size: 12px; color: #3D1F3A; padding: 8px 0; border-bottom: 1px solid #E2D9CC; }
  .doctor-q::before { content: "→ "; color: #B8934A; font-weight: bold; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E2D9CC; font-family: Arial, sans-serif; font-size: 10px; color: #A89BB0; text-align: center; }
  .nutrient-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #E2D9CC; font-family: Arial, sans-serif; font-size: 12px; }
  .nutrient-bar-track { width: 120px; height: 6px; background: #E2D9CC; border-radius: 3px; overflow: hidden; }
  .nutrient-bar-fill { height: 100%; border-radius: 3px; background: #6A9E72; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">vela</div>
  <div class="tagline">Your shift. Your terms.</div>
  <div class="report-title">Health Report · Last 90 Days</div>
  <div class="report-date">Generated ${reportDate} · For healthcare provider use</div>
</div>

<!-- PHASE -->
<div class="section">
  <div class="section-title">Hormonal Phase</div>
  <div class="phase-card">
    <div class="phase-name">${data.phaseLabel}</div>
    <div class="phase-sub">Self-reported based on cycle history and symptom assessment</div>
  </div>
</div>

<!-- SUMMARY STATS -->
<div class="section">
  <div class="section-title">90-Day Overview</div>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-num">${recent.length}</div>
      <div class="stat-label">Days tracked</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${daysWithFood}</div>
      <div class="stat-label">Days food logged</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${recentSleep.length}</div>
      <div class="stat-label">Nights sleep logged</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${data.suppAdherence}%</div>
      <div class="stat-label">Supplement adherence</div>
    </div>
  </div>
</div>

<!-- SYMPTOMS -->
<div class="section">
  <div class="section-title">Most Frequent Symptoms (Last 90 Days)</div>
  <div class="sym-grid">
    ${topSyms.map(([sym, cnt]) => `<div class="sym-chip">${sym} <span class="sym-count">${cnt}×</span></div>`).join('')}
  </div>
  ${topSyms.length === 0 ? '<p style="font-family:Arial;font-size:12px;color:#A89BB0;">No symptoms logged in this period.</p>' : ''}
</div>

<!-- NUTRITION -->
<div class="section">
  <div class="section-title">Average Daily Nutrition (Days Food Was Logged)</div>
  ${[
    { label: 'Protein', val: Math.round(data.avgNutrients.protein), target: 110, unit: 'g' },
    { label: 'Fiber', val: Math.round(data.avgNutrients.fiber), target: 28, unit: 'g' },
    { label: 'Calcium', val: Math.round(data.avgNutrients.calcium), target: 1200, unit: 'mg' },
    { label: 'Magnesium', val: Math.round(data.avgNutrients.magnesium), target: 350, unit: 'mg' },
    { label: 'Omega-3', val: data.avgNutrients.omega3.toFixed(1), target: 2.5, unit: 'g' },
    { label: 'Calories', val: Math.round(data.avgNutrients.cal), target: 1800, unit: 'kcal' },
  ].map(n => {
    const pct = Math.min(100, Math.round((Number(n.val) / n.target) * 100));
    return `<div class="nutrient-row">
      <span>${n.label}</span>
      <span style="color:#A89BB0">${n.val}${n.unit}</span>
      <div class="nutrient-bar-track"><div class="nutrient-bar-fill" style="width:${pct}%;background:${pct>=80?'#6A9E72':'#B8934A'}"></div></div>
      <span style="color:#A89BB0;font-size:10px">${pct}% of target</span>
    </div>`;
  }).join('')}
</div>

<!-- SLEEP -->
<div class="section">
  <div class="section-title">Sleep Summary</div>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-num">${avgSleepQ}</div>
      <div class="stat-label">Avg quality /5</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${nightSweatNights}</div>
      <div class="stat-label">Night sweat nights</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${avgWakes}</div>
      <div class="stat-label">Avg wake-ups</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${recentSleep.length}</div>
      <div class="stat-label">Nights logged</div>
    </div>
  </div>
  ${recentSleep.slice(0,30).map(e => {
    const qColor = Q_COLORS[e.quality??0] || '#A89BB0';
    const qLabel = Q_LABELS[e.quality??0] || '—';
    return `<div class="sleep-entry">
      <span style="color:#3D1F3A;width:140px">${formatDate(e.date)}</span>
      <span class="q-badge" style="background:${qColor}20;color:${qColor};border:1px solid ${qColor}">${qLabel}</span>
      ${e.nightSweats ? '<span class="q-badge" style="background:#FAEAE9;color:#C4645A;border:1px solid #C4645A">Night sweats</span>' : ''}
      ${e.wakeCount > 0 ? `<span style="color:#A89BB0">Woke ${e.wakeCount}×</span>` : ''}
    </div>`;
  }).join('')}
</div>

<!-- SUPPLEMENTS -->
<div class="section page-break">
  <div class="section-title">Current Supplement Routine · ${data.suppAdherence}% Adherence</div>
  <div class="supp-grid">
    ${data.mySupps.map(s => `<div class="supp-chip">${s}</div>`).join('')}
  </div>
</div>

<!-- DAILY LOG -->
<div class="section">
  <div class="section-title">Daily Log (Last 90 Days)</div>
  ${recent.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map(e => `
    <div class="day-entry">
      <div class="day-date">${formatDate(e.date)}</div>
      ${e.foods.length > 0 ? `<div class="day-line">🍽 ${e.foods.length} foods logged · ${Math.round(e.totals.cal)} cal · ${Math.round(e.totals.protein)}g protein</div>` : ''}
      ${e.symptoms.length > 0 ? `<div class="day-line">◎ ${e.symptoms.slice(0,6).join(' · ')}${e.symptoms.length>6?` +${e.symptoms.length-6} more`:''}</div>` : ''}
      ${e.checkedSupps.length > 0 ? `<div class="day-line">✦ ${e.checkedSupps.length} supplements taken</div>` : ''}
      ${e.journal.trim() ? `<div class="day-journal">"${e.journal.trim().slice(0,120)}${e.journal.trim().length>120?'...':''}"</div>` : ''}
    </div>
  `).join('')}
</div>

<!-- DOCTOR QUESTIONS -->
<div class="section">
  <div class="section-title">Suggested Questions for Your Doctor</div>
  ${[
    'What are my options for managing symptoms — both hormonal and non-hormonal?',
    'Am I a candidate for HRT? If not, why specifically?',
    'What baseline tests do you recommend? (hormones, bone density, thyroid, lipids)',
    'How do you define menopause and how will we track my transition?',
    'What symptoms would warrant an urgent follow-up?',
    'How does my family history affect my risk profile here?',
    'What lifestyle changes will have the highest impact for my specific symptoms?',
    'Can you refer me to a menopause specialist if needed?',
  ].map(q => `<div class="doctor-q">${q}</div>`).join('')}
</div>

<div class="footer">
  Generated by Vela · vela.app · This report is for informational purposes only and does not constitute medical advice.
  Always consult your healthcare provider before making changes to your health routine.
</div>

</body>
</html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share your Vela health report',
      UTI: 'com.adobe.pdf',
    });
  } catch (e) {
    console.error('PDF generation failed:', e);
    throw e;
  }
}
