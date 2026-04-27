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
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
  return history.filter(e => new Date(e.date) >= cutoff);
}

function last90Sleep(sleepHistory: ReportData["sleepHistory"]) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
  return sleepHistory.filter(e => new Date(e.date) >= cutoff);
}

function bar(pct: number, color: string): string {
  const w = Math.min(100, pct);
  const bg = pct >= 80 ? '#6A9E72' : pct >= 50 ? '#B8934A' : '#C4645A';
  return `<div style="display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:10px;background:#EDE4D8;border-radius:5px;overflow:hidden;">
      <div style="width:${w}%;height:100%;background:${bg};border-radius:5px;"></div>
    </div>
    <span style="font-size:12px;color:${bg};font-weight:bold;width:38px;text-align:right;">${pct}%</span>
  </div>`;
}

function symptomTimeline(recent: ReportData["history"]): string {
  const weeks: Record<string, Set<string>> = {};
  recent.forEach(e => {
    const d = new Date(e.date + "T12:00:00");
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = new Set();
    e.symptoms.forEach(s => weeks[key].add(s));
  });
  const sorted = Object.entries(weeks).sort((a,b) => a[0].localeCompare(b[0])).slice(-12);
  if (sorted.length === 0) return '<p style="color:#A89BB0;font-size:14px;">No symptom data logged yet.</p>';
  return `<div style="display:flex;gap:6px;align-items:flex-end;height:80px;">
    ${sorted.map(([week, syms]) => {
      const h = Math.min(80, syms.size * 12 + 8);
      const d = new Date(week + "T12:00:00");
      const label = d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:100%;background:#3D1F3A;border-radius:4px 4px 0 0;height:${h}px;position:relative;" title="${syms.size} symptoms">
          <span style="position:absolute;bottom:2px;width:100%;text-align:center;font-size:9px;color:#D4B8CC;">${syms.size}</span>
        </div>
        <span style="font-size:8px;color:#A89BB0;white-space:nowrap;">${label}</span>
      </div>`;
    }).join('')}
  </div>
  <p style="font-size:10px;color:#A89BB0;margin-top:6px;">Weekly symptom frequency — bar height = number of distinct symptoms that week</p>`;
}

export async function generateDoctorReport(data: ReportData): Promise<void> {
  const recent = last90Days(data.history);
  const recentSleep = last90Sleep(data.sleepHistory);
  const reportDate = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });

  const daysTracked = recent.length;
  const daysWithFood = recent.filter(e => e.foods.length > 0).length;
  const totalSymptomDays = recent.filter(e => e.symptoms.length > 0).length;

  const avgSleepQ = recentSleep.filter(e => e.quality).length > 0
    ? (recentSleep.filter(e=>e.quality).reduce((a,e)=>a+(e.quality??0),0)/recentSleep.filter(e=>e.quality).length).toFixed(1)
    : "—";
  const nightSweatNights = recentSleep.filter(e => e.nightSweats).length;
  const avgWakes = recentSleep.length > 0
    ? (recentSleep.reduce((a,e)=>a+e.wakeCount,0)/recentSleep.length).toFixed(1)
    : "—";

  const symCounts: Record<string,number> = {};
  recent.forEach(e => e.symptoms.forEach(s => { symCounts[s] = (symCounts[s]??0)+1; }));
  const topSyms = Object.entries(symCounts).sort((a,b)=>b[1]-a[1]).slice(0,12);

  const nutrients = [
    { label:'Protein',    val:Math.round(data.avgNutrients.protein),   target:110,  unit:'g',   note:'Muscle, mood & hormones' },
    { label:'Fiber',      val:Math.round(data.avgNutrients.fiber),      target:28,   unit:'g',   note:'Estrogen metabolism' },
    { label:'Calcium',    val:Math.round(data.avgNutrients.calcium),    target:1200, unit:'mg',  note:'Bone density (critical in peri)' },
    { label:'Magnesium',  val:Math.round(data.avgNutrients.magnesium),  target:350,  unit:'mg',  note:'Sleep, mood & muscle function' },
    { label:'Omega-3',    val:parseFloat(data.avgNutrients.omega3.toFixed(1)), target:2.5, unit:'g', note:'Inflammation & hot flash frequency' },
    { label:'Calories',   val:Math.round(data.avgNutrients.cal),        target:1800, unit:'kcal',note:'Total energy intake' },
  ];

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Georgia&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2C1F2A; background: #fff; font-size: 14px; line-height: 1.6; }

  /* ── Cover Page ── */
  .cover { background: #3D1F3A; min-height: 100vh; padding: 60px 50px; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
  .cover-logo { font-size: 64px; color: #D4A843; letter-spacing: 10px; margin-bottom: 6px; }
  .cover-tagline { font-family: Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); letter-spacing: 4px; text-transform: uppercase; margin-bottom: 60px; }
  .cover-title { font-size: 32px; color: #fff; margin-bottom: 12px; line-height: 1.3; }
  .cover-subtitle { font-family: Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.6); margin-bottom: 50px; }
  .cover-meta { font-family: Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.4); }
  .cover-meta strong { color: rgba(255,255,255,0.8); }
  .cover-disclaimer { font-family: Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 60px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
  .cover-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin: 40px 0; }
  .cover-stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 20px; text-align: center; }
  .cover-stat-num { font-size: 42px; color: #D4A843; }
  .cover-stat-label { font-family: Arial, sans-serif; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }

  /* ── Report Pages ── */
  .page { padding: 50px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #3D1F3A; padding-bottom: 16px; }
  .page-logo { font-size: 22px; color: #3D1F3A; letter-spacing: 4px; }
  .page-date { font-family: Arial, sans-serif; font-size: 11px; color: #A89BB0; }

  .section { margin-bottom: 44px; }
  .section-label { font-family: Arial, sans-serif; font-size: 10px; color: #B8934A; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
  .section-label::after { content:''; flex:1; height:1px; background:#EDE4D8; }
  .section-title { font-size: 22px; color: #3D1F3A; margin-bottom: 6px; }
  .section-sub { font-family: Arial, sans-serif; font-size: 13px; color: #A89BB0; margin-bottom: 20px; }

  /* ── Phase card ── */
  .phase-card { background: linear-gradient(135deg, #F5EDD8, #FBF6EE); border: 1.5px solid #D4A843; border-radius: 14px; padding: 24px 28px; }
  .phase-name { font-size: 28px; color: #3D1F3A; margin-bottom: 6px; }
  .phase-desc { font-family: Arial, sans-serif; font-size: 14px; color: #7A6570; line-height: 1.7; }

  /* ── Stats grid ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
  .stat-box { background: #FAF7F2; border: 1.5px solid #EDE4D8; border-radius: 12px; padding: 18px 14px; text-align: center; }
  .stat-num { font-size: 32px; color: #3D1F3A; line-height: 1; }
  .stat-denom { font-size: 14px; color: #A89BB0; }
  .stat-label { font-family: Arial, sans-serif; font-size: 10px; color: #A89BB0; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }

  /* ── Symptoms ── */
  .sym-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .sym-chip { display: flex; align-items: center; gap: 6px; background: #FAEAE9; border: 1px solid #D9948E; border-radius: 20px; padding: 6px 14px; font-family: Arial, sans-serif; font-size: 13px; color: #8B3A35; }
  .sym-count { font-weight: bold; background: #C4645A; color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 11px; }

  /* ── Nutrition ── */
  .nutrient-table { width: 100%; border-collapse: collapse; }
  .nutrient-table th { font-family: Arial, sans-serif; font-size: 10px; color: #A89BB0; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 8px 12px; border-bottom: 2px solid #EDE4D8; }
  .nutrient-table td { padding: 14px 12px; border-bottom: 1px solid #EDE4D8; vertical-align: middle; font-size: 14px; }
  .nutrient-name { font-weight: bold; color: #3D1F3A; }
  .nutrient-note { font-family: Arial, sans-serif; font-size: 11px; color: #A89BB0; margin-top: 2px; }
  .nutrient-val { font-family: Arial, sans-serif; font-size: 16px; color: #3D1F3A; font-weight: bold; }

  /* ── Sleep ── */
  .sleep-row { display: flex; gap: 14px; align-items: center; padding: 11px 0; border-bottom: 1px solid #EDE4D8; font-family: Arial, sans-serif; font-size: 13px; }
  .q-badge { border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: bold; }
  .night-sweat { background: #FAEAE9; color: #C4645A; border: 1px solid #D9948E; border-radius: 20px; padding: 3px 10px; font-size: 11px; }

  /* ── Supps ── */
  .supp-grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .supp-chip { background: #F5EDD8; border: 1.5px solid #D4A843; border-radius: 20px; padding: 8px 18px; font-family: Arial, sans-serif; font-size: 13px; color: #3D1F3A; }

  /* ── Daily log ── */
  .day-entry { padding: 16px 0; border-bottom: 1px solid #EDE4D8; }
  .day-date { font-family: Arial, sans-serif; font-size: 12px; color: #B8934A; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .day-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 4px; font-family: Arial, sans-serif; font-size: 13px; color: #7A6570; }
  .day-icon { color: #B8934A; font-size: 14px; margin-top: 1px; flex-shrink: 0; }
  .day-journal { font-style: italic; font-size: 13px; color: #A89BB0; margin-top: 8px; padding-left: 22px; border-left: 2px solid #EDE4D8; }

  /* ── Doctor Qs ── */
  .doctor-q { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #EDE4D8; font-family: Arial, sans-serif; font-size: 14px; color: #3D1F3A; align-items: flex-start; }
  .doctor-q-num { background: #3D1F3A; color: #D4A843; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 1px; }

  /* ── Footer ── */
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #EDE4D8; font-family: Arial, sans-serif; font-size: 11px; color: #C4B8BC; text-align: center; line-height: 1.7; }
  .footer strong { color: #A89BB0; }

  .page-break { page-break-before: always; }
  .callout { background: #F5EDD8; border-left: 4px solid #D4A843; border-radius: 0 10px 10px 0; padding: 14px 20px; margin: 16px 0; font-family: Arial, sans-serif; font-size: 13px; color: #5A4048; line-height: 1.6; }
  .callout strong { color: #3D1F3A; }
</style>
</head>
<body>

<!-- ════════════════════════════════════════
     COVER PAGE
════════════════════════════════════════ -->
<div class="cover">
  <div>
    <div class="cover-logo">vela</div>
    <div class="cover-tagline">your shift. your terms.</div>
    <div class="cover-title">Perimenopause Health Report<br>Last 90 Days</div>
    <div class="cover-subtitle">Prepared for healthcare provider review · ${reportDate}</div>

    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-num">${daysTracked}</div>
        <div class="cover-stat-label">Days tracked</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${totalSymptomDays}</div>
        <div class="cover-stat-label">Days with symptoms</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${data.suppAdherence}%</div>
        <div class="cover-stat-label">Supplement adherence</div>
      </div>
    </div>

    <div style="font-family:Arial,sans-serif; font-size:14px; color:rgba(255,255,255,0.6); line-height:1.8;">
      <strong style="color:rgba(255,255,255,0.85);">Hormonal Phase:</strong> ${data.phaseLabel}<br>
      <strong style="color:rgba(255,255,255,0.85);">Report covers:</strong> ${daysTracked} days of daily logging<br>
      <strong style="color:rgba(255,255,255,0.85);">Sections:</strong> Symptoms · Nutrition · Sleep · Supplements · Daily Log · Doctor Questions
    </div>
  </div>

  <div class="cover-disclaimer">
    This report was generated by the Vela app and reflects self-reported data. It is intended to supplement — not replace — clinical assessment. All data was logged by the patient and has not been medically reviewed. Please interpret findings in the context of a full clinical evaluation.
  </div>
</div>

<!-- ════════════════════════════════════════
     PAGE 2 — PHASE + OVERVIEW + SYMPTOMS
════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">vela</div>
    <div class="page-date">Health Report · ${reportDate}</div>
  </div>

  <!-- Phase -->
  <div class="section">
    <div class="section-label">Hormonal Phase</div>
    <div class="phase-card">
      <div class="phase-name">${data.phaseLabel}</div>
      <div class="phase-desc">
        Self-reported based on cycle history and symptom assessment within the Vela app.
        ${data.phase === 'early' ? 'Early perimenopause is characterized by irregular cycles, fluctuating estrogen, and the onset of vasomotor symptoms.' :
          data.phase === 'late' ? 'Late perimenopause often involves longer cycle gaps (60+ days), more pronounced hot flashes, and significant hormonal volatility.' :
          'Post-menopause begins after 12 consecutive months without a menstrual period.'}
      </div>
    </div>
  </div>

  <!-- 90-Day Summary -->
  <div class="section">
    <div class="section-label">90-Day Summary</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-num">${daysTracked}</div>
        <div class="stat-label">Days tracked</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${daysWithFood}</div>
        <div class="stat-label">Days food logged</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${recentSleep.length}</div>
        <div class="stat-label">Sleep nights logged</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${totalSymptomDays}</div>
        <div class="stat-label">Symptom days</div>
      </div>
    </div>
  </div>

  <!-- Symptoms -->
  <div class="section">
    <div class="section-label">Most Frequent Symptoms — Last 90 Days</div>
    ${topSyms.length > 0 ? `
    <div class="sym-grid">
      ${topSyms.map(([sym, cnt]) => `<div class="sym-chip">${sym}<span class="sym-count">${cnt}×</span></div>`).join('')}
    </div>
    <div class="callout">
      <strong>Most reported symptom:</strong> ${topSyms[0]?.[0] ?? '—'} occurred ${topSyms[0]?.[1] ?? 0} times over 90 days
      ${topSyms.length > 1 ? ` · <strong>Second:</strong> ${topSyms[1][0]} (${topSyms[1][1]}×)` : ''}.
      ${totalSymptomDays > 60 ? ' High symptom frequency — consider discussing symptom management options.' :
        totalSymptomDays > 30 ? ' Moderate symptom frequency — patterns may be emerging.' :
        ' Lower symptom frequency logged — may reflect early transition or inconsistent logging.'}
    </div>
    ` : '<p style="font-family:Arial;font-size:14px;color:#A89BB0;">No symptoms logged in this period.</p>'}
  </div>

  <!-- Symptom timeline -->
  <div class="section">
    <div class="section-label">Weekly Symptom Frequency — Last 12 Weeks</div>
    ${symptomTimeline(recent)}
  </div>
</div>

<!-- ════════════════════════════════════════
     PAGE 3 — NUTRITION
════════════════════════════════════════ -->
<div class="page page-break">
  <div class="page-header">
    <div class="page-logo">vela</div>
    <div class="page-date">Health Report · ${reportDate} · Nutrition</div>
  </div>

  <div class="section">
    <div class="section-label">Average Daily Nutrition · ${daysWithFood} Days Logged</div>
    <div class="section-sub">Values represent daily averages on days when food was logged. Targets are evidence-based recommendations for perimenopausal women.</div>

    <table class="nutrient-table">
      <tr>
        <th>Nutrient</th>
        <th>Daily Average</th>
        <th style="width:200px">vs. Target</th>
        <th>Target</th>
        <th>Clinical Relevance</th>
      </tr>
      ${nutrients.map(n => {
        const pct = Math.min(100, Math.round((Number(n.val)/n.target)*100));
        const color = pct>=80?'#6A9E72':pct>=50?'#B8934A':'#C4645A';
        return `<tr>
          <td><div class="nutrient-name">${n.label}</div></td>
          <td><span class="nutrient-val" style="color:${color}">${n.val}${n.unit}</span></td>
          <td>${bar(pct, color)}</td>
          <td style="font-family:Arial;font-size:12px;color:#A89BB0;">${n.target}${n.unit}</td>
          <td style="font-family:Arial;font-size:12px;color:#A89BB0;">${n.note}</td>
        </tr>`;
      }).join('')}
    </table>

    ${data.avgNutrients.calcium < 800 ? `<div class="callout"><strong>⚠ Calcium Alert:</strong> Average calcium intake is below the perimenopausal target of 1,200mg/day. Low calcium during perimenopause accelerates bone density loss. Consider dietary sources (sardines, Greek yogurt, kefir) or supplementation.</div>` :
      data.avgNutrients.omega3 < 1.0 ? `<div class="callout"><strong>Note — Omega-3:</strong> Low omega-3 intake may contribute to higher hot flash frequency and inflammation. Wild salmon, mackerel, and ground flaxseed are optimal sources.</div>` :
      data.avgNutrients.protein < 80 ? `<div class="callout"><strong>Note — Protein:</strong> Adequate protein is essential for maintaining muscle mass, which declines rapidly in perimenopause. Target 110g+/day through animal or complete plant sources.</div>` :
      `<div class="callout"><strong>✦ Good nutritional foundation.</strong> Continue focusing on calcium-rich and omega-3 foods to optimize hormonal support.</div>`}
  </div>
</div>

<!-- ════════════════════════════════════════
     PAGE 4 — SLEEP
════════════════════════════════════════ -->
<div class="page page-break">
  <div class="page-header">
    <div class="page-logo">vela</div>
    <div class="page-date">Health Report · ${reportDate} · Sleep</div>
  </div>

  <div class="section">
    <div class="section-label">Sleep Overview · ${recentSleep.length} Nights Logged</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-num">${avgSleepQ}<span class="stat-denom">/5</span></div>
        <div class="stat-label">Avg quality</div>
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
        <div class="stat-num">${recentSleep.length > 0 ? Math.round((nightSweatNights/recentSleep.length)*100) : 0}%</div>
        <div class="stat-label">Nights with sweats</div>
      </div>
    </div>

    ${nightSweatNights > recentSleep.length * 0.4 ?
      `<div class="callout"><strong>⚠ High Night Sweat Frequency:</strong> Night sweats occurred on ${Math.round((nightSweatNights/recentSleep.length)*100)}% of logged nights. This significantly impacts sleep quality and may warrant discussion of targeted interventions including HRT, progesterone, or non-hormonal options.</div>` :
      `<div class="callout">Sleep data reflects ${recentSleep.length} logged nights over the 90-day period. ${parseFloat(avgSleepQ) < 3 ? 'Average sleep quality is below optimal — consider evaluating night sweat triggers and sleep hygiene.' : 'Sleep quality appears adequate based on self-report.'}</div>`}
  </div>

  <div class="section">
    <div class="section-label">Nightly Sleep Log — Most Recent 30 Nights</div>
    ${recentSleep.slice(0,30).map(e => {
      const qColor = Q_COLORS[e.quality??0] || '#A89BB0';
      const qLabel = Q_LABELS[e.quality??0] || '—';
      return `<div class="sleep-row">
        <span style="color:#3D1F3A;min-width:160px;font-size:13px;">${formatDate(e.date)}</span>
        ${e.quality ? `<span class="q-badge" style="background:${qColor}18;color:${qColor};border:1px solid ${qColor}">${qLabel}</span>` : ''}
        ${e.nightSweats ? '<span class="night-sweat">Night sweats</span>' : ''}
        ${e.wakeCount > 0 ? `<span style="color:#A89BB0;font-size:12px;">Woke ${e.wakeCount}×</span>` : ''}
      </div>`;
    }).join('')}
  </div>
</div>

<!-- ════════════════════════════════════════
     PAGE 5 — SUPPLEMENTS + DOCTOR QS
════════════════════════════════════════ -->
<div class="page page-break">
  <div class="page-header">
    <div class="page-logo">vela</div>
    <div class="page-date">Health Report · ${reportDate} · Supplements & Questions</div>
  </div>

  <div class="section">
    <div class="section-label">Current Supplement Routine · ${data.suppAdherence}% Adherence</div>
    <div class="section-sub">Self-reported supplements tracked daily within the Vela app over 90 days.</div>
    ${data.mySupps.length > 0 ?
      `<div class="supp-grid">${data.mySupps.map(s => `<div class="supp-chip">✦ ${s}</div>`).join('')}</div>
       <div class="callout" style="margin-top:16px;">
         <strong>Adherence rate: ${data.suppAdherence}%</strong> — 
         ${data.suppAdherence >= 80 ? 'Excellent consistency. Supplement effects are more likely to be measurable at this adherence level.' :
           data.suppAdherence >= 60 ? 'Moderate consistency. Increasing adherence may improve clinical outcomes.' :
           'Low consistency — supplement effects may be limited. Discuss barriers to adherence.'}
       </div>` :
      `<p style="font-family:Arial;font-size:14px;color:#A89BB0;">No supplements tracked during this period.</p>`}
  </div>

  <div class="section">
    <div class="section-label">Suggested Questions for This Appointment</div>
    <div class="section-sub">Prepared by the patient using the Vela perimenopause tracking app.</div>
    ${[
      'What are my options for managing these symptoms — both hormonal and non-hormonal?',
      'Based on my symptom frequency, am I a candidate for HRT? If not, why specifically?',
      'What baseline tests do you recommend? (FSH, estradiol, thyroid, lipids, bone density)',
      'How will we track my transition and define when I reach menopause?',
      'What symptoms would warrant an urgent follow-up vs. routine monitoring?',
      'How does my family history affect my risk profile for HRT or other interventions?',
      'What lifestyle changes will have the highest impact on my specific symptoms?',
      'Can you refer me to a menopause specialist or certified menopause practitioner?',
    ].map((q,i) => `<div class="doctor-q">
      <div class="doctor-q-num">${i+1}</div>
      <div>${q}</div>
    </div>`).join('')}
  </div>
</div>

<!-- ════════════════════════════════════════
     PAGE 6 — DAILY LOG
════════════════════════════════════════ -->
<div class="page page-break">
  <div class="page-header">
    <div class="page-logo">vela</div>
    <div class="page-date">Health Report · ${reportDate} · Daily Log</div>
  </div>

  <div class="section">
    <div class="section-label">Daily Log — Last 60 Days</div>
    <div class="section-sub">Chronological record of logged food, symptoms, supplements and journal entries.</div>
    ${recent.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map(e => `
      <div class="day-entry">
        <div class="day-date">${formatDate(e.date)}</div>
        ${e.foods.length > 0 ? `<div class="day-row"><span class="day-icon">🍽</span><span>${e.foods.length} food${e.foods.length!==1?'s':''} · ${Math.round(e.totals.cal)} kcal · ${Math.round(e.totals.protein)}g protein · ${Math.round(e.totals.fiber)}g fiber</span></div>` : ''}
        ${e.symptoms.length > 0 ? `<div class="day-row"><span class="day-icon">◎</span><span>${e.symptoms.slice(0,8).join(' · ')}${e.symptoms.length>8?` +${e.symptoms.length-8} more`:''}</span></div>` : ''}
        ${e.checkedSupps.length > 0 ? `<div class="day-row"><span class="day-icon">✦</span><span>${e.checkedSupps.length} supplement${e.checkedSupps.length!==1?'s':''} taken</span></div>` : ''}
        ${e.journal.trim() ? `<div class="day-journal">"${e.journal.trim().slice(0,150)}${e.journal.trim().length>150?'...':''}"</div>` : ''}
      </div>`).join('')}
  </div>
</div>

<!-- Footer on last page -->
<div class="page">
  <div class="footer">
    <strong>vela</strong> · Perimenopause tracking & support<br>
    macpplechic.github.io/vela · Generated ${reportDate}<br><br>
    This report is for informational purposes only and does not constitute medical advice.<br>
    All data is self-reported by the patient. Always consult your healthcare provider before making changes to your health routine.<br>
    © 2026 Vela App LLC
  </div>
</div>

</body>
</html>`;

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
