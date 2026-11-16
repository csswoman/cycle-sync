import type { CycleInfo, DailyLog, PMOSSymptomEntry, Habit, HabitLog } from '@/types';
import type jsPDF from 'jspdf';

interface ReportData {
  userName: string;
  generatedAt: string;
  cycleInfo: CycleInfo | null;
  cycleLength: number;
  lastPeriodStart: string | null;
  dailyLogs: DailyLog[];
  pmosEntries: PMOSSymptomEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  pmos?: PMOSReportExtra;
}

/** PMOS follow-up data added to the report (all optional). */
export interface PMOSReportExtra {
  cycleLengths: number[];
  daysSinceLastPeriod: number | null;
  ovulation: { start: string; length?: number; status: string }[];
  /** Bleeding intensity and pain per period (last 3), plus the heavy-bleeding flags. */
  bleeding?: { flags: string[]; periods: { start: string; days: { date: string; flow: string | null; clots: boolean; pain: number | null }[] }[] };
  medications: { name: string; dose: string | null; schedule: string; notes: string | null; adherencePct: number | null; since: string | null }[];
  labs: { label: string; value: string; date: string; flag: 'low' | 'high' | 'ok' | null }[];
  bloodPressure: { value: string; date: string; category: string } | null;
  hirsutism: { total: number; date: string; previous: { total: number; date: string } | null } | null;
  wellbeing: { date: string; phq2: number; gad2: number; sleepSigns: number } | null;
  questions: string[];
  /** Diagnosis card as the patient entered it, with ultrasounds and other events. */
  diagnosis?: { phenotype: string | null; diagnosedOn: string | null; criteria: string[]; notes: string | null; events: { date: string; kind: string; summary: string }[] };
  /** Side effects logged per medication (most recent first). */
  sideEffects?: { medication: string; entries: { date: string; effect: string; severity: string }[] }[];
}

const COLORS = {
  primary: [127, 25, 230] as [number, number, number],
  dark: [26, 17, 34] as [number, number, number],
  muted: [94, 78, 117] as [number, number, number],
  light: [243, 240, 247] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
};

function drawHeader(doc: jsPDF, y: number): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CycleSync', 20, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Holistic Health Report', 20, 26);

  doc.setFontSize(8);
  doc.text('For medical consultation purposes', 20, 34);

  return y + 50;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(...COLORS.primary);
  doc.rect(20, y, 3, 10, 'F');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 27, y + 8);
  return y + 16;
}

function drawKeyValue(doc: jsPDF, key: string, value: string, y: number, x = 20): number {
  if (y > 275) {
    doc.addPage();
    y = 20;
  }
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(key, x, y);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 50, y);
  return y + 7;
}

function drawParagraph(doc: jsPDF, text: string, y: number, x = 20, width = 170, bold = false): number {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  const lines = doc.splitTextToSize(text, width) as string[];
  for (const line of lines) {
    if (y > 278) { doc.addPage(); y = 20; }
    doc.text(line, x, y);
    y += 5;
  }
  return y + 1;
}

const OVULATION_TEXT: Record<string, string> = {
  confirmed: 'ovulation confirmed (BBT shift)',
  possible: 'possible (positive LH only)',
  not_detected: 'no ovulation detected',
  in_progress: 'in progress',
  no_data: 'no data',
};

function drawPMOSSections(doc: jsPDF, p: PMOSReportExtra, y: number): number {
  // Cycle pattern
  if (p.cycleLengths.length || p.daysSinceLastPeriod != null) {
    y = drawSectionTitle(doc, 'Cycle Pattern & Ovulation', y);
    if (p.daysSinceLastPeriod != null) y = drawKeyValue(doc, 'Days since period', `${p.daysSinceLastPeriod} days${p.daysSinceLastPeriod > 90 ? '  (over 90 days)' : ''}`, y);
    if (p.cycleLengths.length) y = drawKeyValue(doc, 'Recent cycles', `${p.cycleLengths.join(', ')} days`, y);
    for (const o of p.ovulation.filter((o) => o.status !== 'no_data')) {
      y = drawKeyValue(doc, o.start, `${o.length ? `${o.length} d · ` : 'current · '}${OVULATION_TEXT[o.status] ?? o.status}`, y);
    }
    y = drawDivider(doc, y + 2);
  }

  // Bleeding intensity and pain
  if (p.bleeding && p.bleeding.periods.length) {
    y = drawSectionTitle(doc, 'Bleeding Intensity & Pain', y);
    for (const f of p.bleeding.flags) {
      y = drawParagraph(doc, f === 'heavyAfterGap'
        ? 'Heavy period after 90 or more days without bleeding: worth discussing at the appointment.'
        : 'Two or more very heavy days (or heavy with clots) in a recent period: worth discussing, and checking iron.', y, 20, 170, true);
    }
    for (const per of p.bleeding.periods) {
      const days = per.days.map((d) => `${d.date.slice(5)}: ${[d.flow ? d.flow.replace('_', ' ') : '', d.clots ? 'clots' : '', d.pain != null ? `pain ${d.pain}/10` : ''].filter(Boolean).join(', ')}`);
      y = drawParagraph(doc, `Period starting ${per.start}`, y, 20, 170, true);
      y = drawParagraph(doc, days.join('  |  '), y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }
  // Medications
  if (p.medications.length) {
    y = drawSectionTitle(doc, 'Medications & Adherence (last 30 days)', y);
    for (const m of p.medications) {
      y = drawParagraph(doc, `${m.name}${m.dose ? ` — ${m.dose}` : ''}${m.adherencePct != null ? `   ·   ${m.adherencePct}% of doses taken` : ''}`, y, 20, 170, true);
      y = drawParagraph(doc, `${m.schedule}${m.since ? ` · since ${m.since}` : ''}`, y, 24, 166);
      if (m.notes) y = drawParagraph(doc, `Doctor's instructions: ${m.notes}`, y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }

  // Side effects
  if (p.sideEffects && p.sideEffects.length) {
    y = drawSectionTitle(doc, 'Medication Side Effects (self-reported)', y);
    for (const m of p.sideEffects) {
      y = drawParagraph(doc, m.medication, y, 20, 170, true);
      y = drawParagraph(doc, m.entries.map((e) => `${e.date}: ${e.effect} (${e.severity})`).join('  |  '), y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }
  // Diagnosis and events
  if (p.diagnosis) {
    y = drawSectionTitle(doc, 'Diagnosis & Medical Events (as reported by the patient)', y);
    if (p.diagnosis.phenotype) y = drawKeyValue(doc, 'Phenotype', p.diagnosis.phenotype, y);
    if (p.diagnosis.diagnosedOn) y = drawKeyValue(doc, 'Diagnosed on', p.diagnosis.diagnosedOn, y);
    if (p.diagnosis.criteria.length) y = drawParagraph(doc, `Criteria marked: ${p.diagnosis.criteria.join('; ')}`, y, 20, 170);
    if (p.diagnosis.notes) y = drawParagraph(doc, `Notes: ${p.diagnosis.notes}`, y, 20, 170);
    for (const e of p.diagnosis.events) y = drawParagraph(doc, `${e.date} · ${e.kind}: ${e.summary}`, y, 24, 166);
    y = drawDivider(doc, y + 2);
  }

  // Labs and blood pressure
  if (p.labs.length || p.bloodPressure) {
    y = drawSectionTitle(doc, 'Latest Labs & Blood Pressure', y);
    for (const l of p.labs) {
      if (y > 275) { doc.addPage(); y = 20; }
      y = drawKeyValue(doc, l.label, `${l.value}   (${l.date})${l.flag === 'high' ? '  - above range' : l.flag === 'low' ? '  - below range' : ''}`, y);
    }
    if (p.bloodPressure) y = drawKeyValue(doc, 'Blood pressure', `${p.bloodPressure.value} mmHg · ${p.bloodPressure.category}   (${p.bloodPressure.date})`, y);
    y = drawParagraph(doc, 'Reference flags use typical adult-female ranges; the laboratory\'s own range takes priority.', y + 1);
    y = drawDivider(doc, y + 2);
  }

  // Hirsutism and wellbeing
  if (p.hirsutism || p.wellbeing) {
    y = drawSectionTitle(doc, 'Hirsutism & Wellbeing (self-assessed)', y);
    if (p.hirsutism) {
      const prev = p.hirsutism.previous ? `  (previous ${p.hirsutism.previous.total} on ${p.hirsutism.previous.date})` : '';
      y = drawKeyValue(doc, 'mFG score', `${p.hirsutism.total}/36 on ${p.hirsutism.date}${prev}`, y);
    }
    if (p.wellbeing) {
      y = drawKeyValue(doc, 'PHQ-2 / GAD-2', `${p.wellbeing.phq2}/6 · ${p.wellbeing.gad2}/6   (${p.wellbeing.date})`, y);
      y = drawKeyValue(doc, 'Sleep apnea signs', `${p.wellbeing.sleepSigns} of 3 (snoring, daytime tiredness, observed apnea)`, y);
    }
    y = drawDivider(doc, y + 2);
  }

  // Questions
  if (p.questions.length) {
    y = drawSectionTitle(doc, 'Questions from the patient', y);
    p.questions.forEach((q, i) => { y = drawParagraph(doc, `${i + 1}. ${q}`, y); });
    y = drawDivider(doc, y + 2);
  }
  return y;
}

function drawDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  return y + 6;
}

type JsPDFConstructor = new (...args: ConstructorParameters<typeof jsPDF>) => jsPDF;

export function generateMedicalReport(data: ReportData, jsPDFClass: JsPDFConstructor): void {
  const doc = new jsPDFClass('p', 'mm', 'a4');
  let y = 0;

  // Header
  y = drawHeader(doc, y);

  // Patient info
  y = drawSectionTitle(doc, 'Patient Information', y);
  y = drawKeyValue(doc, 'Name', data.userName, y);
  y = drawKeyValue(doc, 'Report Date', data.generatedAt, y);
  y = drawDivider(doc, y + 2);

  // Cycle overview
  y = drawSectionTitle(doc, 'Cycle Overview', y);
  if (data.cycleInfo) {
    y = drawKeyValue(doc, 'Current Phase', data.cycleInfo.phase, y);
    y = drawKeyValue(doc, 'Cycle Day', `Day ${data.cycleInfo.cycleDay} of ${data.cycleInfo.cycleLength}`, y);
    y = drawKeyValue(doc, 'Days to Period', `${data.cycleInfo.daysUntilNextPeriod} days`, y);
  }
  y = drawKeyValue(doc, 'Cycle Length', `${data.cycleLength} days`, y);
  if (data.lastPeriodStart) {
    y = drawKeyValue(doc, 'Last Period', data.lastPeriodStart, y);
  }
  y = drawDivider(doc, y + 2);

  // Daily Logs Summary (last 30 days)
  if (data.dailyLogs.length > 0) {
    y = drawSectionTitle(doc, `Daily Logs Summary (${data.dailyLogs.length} entries, last 30 days)`, y);

    const avgEnergy = data.dailyLogs.reduce((s, l) => s + (l.energy_level ?? 0), 0) / data.dailyLogs.length;
    const avgSleep = data.dailyLogs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / data.dailyLogs.length;

    y = drawKeyValue(doc, 'Avg Energy', `${avgEnergy.toFixed(1)} / 10`, y);
    y = drawKeyValue(doc, 'Avg Sleep', `${avgSleep.toFixed(1)} hours`, y);

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    data.dailyLogs.forEach((l) => {
      if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    });
    const moodStr = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => `${mood} (${count})`)
      .join(', ');
    if (moodStr) {
      y = drawKeyValue(doc, 'Mood Dist.', moodStr, y);
    }

    // Symptom frequency
    const symptomCounts: Record<string, number> = {};
    data.dailyLogs.forEach((l) => {
      (l.symptoms ?? []).forEach((s) => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topSymptoms.length > 0) {
      y += 4;
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(9);
      doc.text('Top Symptoms:', 20, y);
      y += 6;

      topSymptoms.forEach(([symptom, count]) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const barWidth = Math.min((count / data.dailyLogs.length) * 100, 80);
        doc.setFillColor(...COLORS.light);
        doc.roundedRect(30, y - 3, 80, 5, 1, 1, 'F');
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(30, y - 3, barWidth, 5, 1, 1, 'F');
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(8);
        doc.text(`${symptom} (${count}x)`, 115, y);
        y += 7;
      });
    }
    y = drawDivider(doc, y + 2);
  }

  // PMOS Symptoms
  if (data.pmosEntries.length > 0) {
    y = drawSectionTitle(doc, `PMOS Symptom Tracking (${data.pmosEntries.length} entries, last 30 days)`, y);

    const symptomKeys = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;
    const labels: Record<string, string> = {
      acne: 'Acne',
      fatigue: 'Fatigue',
      hirsutism: 'Hirsutism',
      hair_loss: 'Hair Loss',
      mood_swings: 'Mood Swings',
      bloating: 'Bloating',
    };

    symptomKeys.forEach((key) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const avg = data.pmosEntries.reduce((s, e) => s + (e[key] ?? 0), 0) / data.pmosEntries.length;
      const barWidth = (avg / 3) * 80;
      const color = avg >= 2 ? COLORS.red : avg >= 1 ? COLORS.primary : COLORS.green;

      doc.setFillColor(...COLORS.light);
      doc.roundedRect(60, y - 3, 80, 5, 1, 1, 'F');
      doc.setFillColor(...color);
      doc.roundedRect(60, y - 3, barWidth, 5, 1, 1, 'F');

      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(9);
      doc.text(labels[key], 20, y);
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(8);
      doc.text(`${avg.toFixed(1)} / 3`, 145, y);

      if (avg >= 2) {
        doc.setTextColor(...COLORS.red);
        doc.text('⚠ Elevated', 165, y);
      }
      y += 8;
    });

    // Alert section
    const alertSymptoms = symptomKeys.filter((key) => {
      const recent = data.pmosEntries.slice(-7);
      if (recent.length < 7) return false;
      const avg = recent.reduce((s, e) => s + (e[key] ?? 0), 0) / recent.length;
      return avg >= 2;
    });

    if (alertSymptoms.length > 0) {
      y += 4;
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(20, y - 4, 170, 14, 2, 2, 'F');
      doc.setTextColor(...COLORS.red);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ Clinical Alert:', 25, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Sustained elevated levels in: ${alertSymptoms.map((k) => labels[k]).join(', ')}`,
        25,
        y + 8,
      );
      y += 18;
    }
    y = drawDivider(doc, y + 2);
  }

  // Habits summary
  if (data.habits.length > 0) {
    y = drawSectionTitle(doc, 'Habits & Wellness Tracking', y);

    data.habits.forEach((habit) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const logs = data.habitLogs.filter((l) => l.habit_id === habit.id);
      const completedDays = logs.filter((l) => l.completed).length;
      const totalDays = 7;
      const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(habit.name, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      doc.text(`${completedDays}/${totalDays} days — ${rate}% completion`, 80, y);

      const barWidth = (rate / 100) * 60;
      doc.setFillColor(...COLORS.light);
      doc.roundedRect(140, y - 3, 50, 5, 1, 1, 'F');
      const barColor = rate >= 80 ? COLORS.green : rate >= 50 ? COLORS.primary : COLORS.red;
      doc.setFillColor(...barColor);
      doc.roundedRect(140, y - 3, Math.min(barWidth, 50), 5, 1, 1, 'F');
      y += 8;
    });
    y = drawDivider(doc, y + 2);
  }

  if (data.pmos) y = drawPMOSSections(doc, data.pmos, y);

  // Footer disclaimer
  if (y > 250) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(20, y - 4, 170, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.text(
    'This report was auto-generated by CycleSync based on self-reported data. It is intended',
    25,
    y + 2,
  );
  doc.text(
    'to assist healthcare providers during consultations. It does not constitute medical advice.',
    25,
    y + 7,
  );
  doc.text(
    `Generated on ${data.generatedAt} — CycleSync Holistic Health`,
    25,
    y + 12,
  );

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text(`Page ${i} of ${pageCount}`, 185, 290, { align: 'right' });
  }

  doc.save(`CycleSync_Medical_Report_${data.generatedAt.replace(/[/\s:]/g, '_')}.pdf`);
}
