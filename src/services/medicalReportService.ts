import type { CycleInfo, DailyLog, PMOSSymptomEntry, Habit, HabitLog } from '@/types';
import type jsPDF from 'jspdf';

export type ReportLang = 'es' | 'en';

interface ReportData {
  lang: ReportLang;
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


const STR = {
  en: {
    subtitle: 'Holistic Health Report', purpose: 'For medical consultation purposes',
    ovulation: { confirmed: 'ovulation confirmed (BBT shift)', possible: 'possible (positive LH only)', not_detected: 'no ovulation detected', in_progress: 'in progress', no_data: 'no data' } as Record<string, string>,
    cyclePattern: 'Cycle Pattern & Ovulation', daysSince: 'Days since period', days: 'days', over90: '  (over 90 days)', recentCycles: 'Recent cycles', dAbbr: 'd', current: 'current',
    bleedingTitle: 'Bleeding Intensity & Pain', heavyAfterGap: 'Heavy period after 90 or more days without bleeding: worth discussing at the appointment.',
    heavyBleeding: 'Two or more very heavy days (or heavy with clots) in a recent period: worth discussing, and checking iron.',
    clots: 'clots', pain: 'pain', periodStarting: 'Period starting',
    flow: { light: 'light', medium: 'medium', heavy: 'heavy', very_heavy: 'very heavy' } as Record<string, string>,
    medsTitle: 'Medications & Adherence (last 30 days)', dosesTaken: 'of doses taken', since: 'since', instructions: "Doctor's instructions",
    sideTitle: 'Medication Side Effects (self-reported)',
    dxTitle: 'Diagnosis & Medical Events (as reported by the patient)', phenotype: 'Phenotype', diagnosedOn: 'Diagnosed on', criteria: 'Criteria marked', notes: 'Notes',
    labsTitle: 'Latest Labs & Blood Pressure', above: '  - above range', below: '  - below range', bp: 'Blood pressure',
    labsNote: "Reference flags use typical adult-female ranges; the laboratory's own range takes priority.",
    hirsTitle: 'Hirsutism & Wellbeing (self-assessed)', on: 'on', previous: 'previous', apnea: 'Sleep apnea signs', apneaVal: 'of 3 (snoring, daytime tiredness, observed apnea)',
    questions: 'Questions from the patient',
    patientInfo: 'Patient Information', name: 'Name', reportDate: 'Report Date',
    cycleOverview: 'Cycle Overview', phase: 'Current Phase', cycleDay: 'Cycle Day', day: 'Day', of: 'of', daysToPeriod: 'Days to Period', cycleLength: 'Cycle Length', lastPeriod: 'Last Period',
    phases: { Menstrual: 'Menstrual', Follicular: 'Follicular', Ovulation: 'Ovulation', Luteal: 'Luteal' } as Record<string, string>,
    logsTitle: (n: number) => `Daily Logs Summary (${n} entries, last 30 days)`, avgEnergy: 'Avg Energy', avgSleep: 'Avg Sleep', hours: 'hours', mood: 'Mood Dist.', topSymptoms: 'Top Symptoms:',
    hormTitle: (n: number) => `Hormonal Symptom Tracking (${n} entries, last 30 days)`,
    sym: { acne: 'Acne', fatigue: 'Fatigue', hirsutism: 'Hirsutism', hair_loss: 'Hair Loss', mood_swings: 'Mood Swings', bloating: 'Bloating' } as Record<string, string>,
    elevated: '⚠ Elevated', alert: '⚠ Clinical Alert:', sustained: 'Sustained elevated levels in',
    habitsTitle: 'Habits & Wellness Tracking', completion: 'completion',
    disclaimer: ['This report was auto-generated by CycleSync based on self-reported data. It is intended', 'to assist healthcare providers during consultations. It does not constitute medical advice.'],
    generatedOn: (d: string) => `Generated on ${d} — CycleSync Holistic Health`, page: (i: number, n: number) => `Page ${i} of ${n}`, file: 'CycleSync_Medical_Report',
  },
  es: {
    subtitle: 'Informe de Salud Integral', purpose: 'Para consulta médica',
    ovulation: { confirmed: 'ovulación confirmada (cambio de temperatura basal)', possible: 'posible (solo LH positiva)', not_detected: 'sin ovulación detectada', in_progress: 'en curso', no_data: 'sin datos' } as Record<string, string>,
    cyclePattern: 'Patrón del ciclo y ovulación', daysSince: 'Días desde la regla', days: 'días', over90: '  (más de 90 días)', recentCycles: 'Ciclos recientes', dAbbr: 'd', current: 'actual',
    bleedingTitle: 'Intensidad del sangrado y dolor', heavyAfterGap: 'Regla abundante tras 90 o más días sin sangrado: conviene comentarlo en la consulta.',
    heavyBleeding: 'Dos o más días de sangrado muy abundante (o abundante con coágulos) en una regla reciente: conviene comentarlo y revisar el hierro.',
    clots: 'coágulos', pain: 'dolor', periodStarting: 'Regla iniciada el',
    flow: { light: 'leve', medium: 'moderado', heavy: 'abundante', very_heavy: 'muy abundante' } as Record<string, string>,
    medsTitle: 'Medicamentos y adherencia (últimos 30 días)', dosesTaken: 'de las dosis tomadas', since: 'desde', instructions: 'Indicaciones del médico',
    sideTitle: 'Efectos secundarios de medicamentos (autoinformados)',
    dxTitle: 'Diagnóstico y eventos médicos (según lo informado por la paciente)', phenotype: 'Fenotipo', diagnosedOn: 'Diagnosticado el', criteria: 'Criterios marcados', notes: 'Notas',
    labsTitle: 'Últimos análisis y presión arterial', above: '  - por encima del rango', below: '  - por debajo del rango', bp: 'Presión arterial',
    labsNote: 'Las marcas de referencia usan rangos típicos de mujeres adultas; prevalece el rango del propio laboratorio.',
    hirsTitle: 'Hirsutismo y bienestar (autoevaluación)', on: 'el', previous: 'anterior', apnea: 'Signos de apnea del sueño', apneaVal: 'de 3 (ronquidos, cansancio diurno, apnea observada)',
    questions: 'Preguntas de la paciente',
    patientInfo: 'Datos de la paciente', name: 'Nombre', reportDate: 'Fecha del informe',
    cycleOverview: 'Resumen del ciclo', phase: 'Fase actual', cycleDay: 'Día del ciclo', day: 'Día', of: 'de', daysToPeriod: 'Días para la regla', cycleLength: 'Duración del ciclo', lastPeriod: 'Última regla',
    phases: { Menstrual: 'Menstrual', Follicular: 'Folicular', Ovulation: 'Ovulación', Luteal: 'Lútea' } as Record<string, string>,
    logsTitle: (n: number) => `Resumen de registros diarios (${n} registros, últimos 30 días)`, avgEnergy: 'Energía media', avgSleep: 'Sueño medio', hours: 'horas', mood: 'Estado de ánimo', topSymptoms: 'Síntomas principales:',
    hormTitle: (n: number) => `Seguimiento de síntomas hormonales (${n} registros, últimos 30 días)`,
    sym: { acne: 'Acné', fatigue: 'Fatiga', hirsutism: 'Hirsutismo', hair_loss: 'Caída del cabello', mood_swings: 'Cambios de ánimo', bloating: 'Hinchazón' } as Record<string, string>,
    elevated: '⚠ Elevado', alert: '⚠ Alerta clínica:', sustained: 'Niveles elevados sostenidos en',
    habitsTitle: 'Seguimiento de hábitos y bienestar', completion: 'de cumplimiento',
    disclaimer: ['Este informe fue generado automáticamente por CycleSync a partir de datos autoinformados. Su objetivo', 'es apoyar a los profesionales de la salud en la consulta. No constituye consejo médico.'],
    generatedOn: (d: string) => `Generado el ${d} — CycleSync Salud Integral`, page: (i: number, n: number) => `Página ${i} de ${n}`, file: 'CycleSync_Informe_Medico',
  },
};
type Strings = (typeof STR)['en'];

function drawHeader(doc: jsPDF, y: number, s: Strings): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CycleSync', 20, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(s.subtitle, 20, 26);

  doc.setFontSize(8);
  doc.text(s.purpose, 20, 34);

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

function drawPMOSSections(doc: jsPDF, p: PMOSReportExtra, y: number, s: Strings): number {
  // Cycle pattern
  if (p.cycleLengths.length || p.daysSinceLastPeriod != null) {
    y = drawSectionTitle(doc, s.cyclePattern, y);
    if (p.daysSinceLastPeriod != null) y = drawKeyValue(doc, s.daysSince, `${p.daysSinceLastPeriod} ${s.days}${p.daysSinceLastPeriod > 90 ? s.over90 : ''}`, y);
    if (p.cycleLengths.length) y = drawKeyValue(doc, s.recentCycles, `${p.cycleLengths.join(', ')} ${s.days}`, y);
    for (const o of p.ovulation.filter((o) => o.status !== 'no_data')) {
      y = drawKeyValue(doc, o.start, `${o.length ? `${o.length} ${s.dAbbr} · ` : `${s.current} · `}${s.ovulation[o.status] ?? o.status}`, y);
    }
    y = drawDivider(doc, y + 2);
  }

  // Bleeding intensity and pain
  if (p.bleeding && p.bleeding.periods.length) {
    y = drawSectionTitle(doc, s.bleedingTitle, y);
    for (const f of p.bleeding.flags) {
      y = drawParagraph(doc, f === 'heavyAfterGap' ? s.heavyAfterGap : s.heavyBleeding, y, 20, 170, true);
    }
    for (const per of p.bleeding.periods) {
      const days = per.days.map((d) => `${d.date.slice(5)}: ${[d.flow ? (s.flow[d.flow] ?? d.flow) : '', d.clots ? s.clots : '', d.pain != null ? `${s.pain} ${d.pain}/10` : ''].filter(Boolean).join(', ')}`);
      y = drawParagraph(doc, `${s.periodStarting} ${per.start}`, y, 20, 170, true);
      y = drawParagraph(doc, days.join('  |  '), y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }
  // Medications
  if (p.medications.length) {
    y = drawSectionTitle(doc, s.medsTitle, y);
    for (const m of p.medications) {
      y = drawParagraph(doc, `${m.name}${m.dose ? ` — ${m.dose}` : ''}${m.adherencePct != null ? `   ·   ${m.adherencePct}% ${s.dosesTaken}` : ''}`, y, 20, 170, true);
      y = drawParagraph(doc, `${m.schedule}${m.since ? ` · ${s.since} ${m.since}` : ''}`, y, 24, 166);
      if (m.notes) y = drawParagraph(doc, `${s.instructions}: ${m.notes}`, y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }

  // Side effects
  if (p.sideEffects && p.sideEffects.length) {
    y = drawSectionTitle(doc, s.sideTitle, y);
    for (const m of p.sideEffects) {
      y = drawParagraph(doc, m.medication, y, 20, 170, true);
      y = drawParagraph(doc, m.entries.map((e) => `${e.date}: ${e.effect} (${e.severity})`).join('  |  '), y, 24, 166);
    }
    y = drawDivider(doc, y + 2);
  }
  // Diagnosis and events
  if (p.diagnosis) {
    y = drawSectionTitle(doc, s.dxTitle, y);
    if (p.diagnosis.phenotype) y = drawKeyValue(doc, s.phenotype, p.diagnosis.phenotype, y);
    if (p.diagnosis.diagnosedOn) y = drawKeyValue(doc, s.diagnosedOn, p.diagnosis.diagnosedOn, y);
    if (p.diagnosis.criteria.length) y = drawParagraph(doc, `${s.criteria}: ${p.diagnosis.criteria.join('; ')}`, y, 20, 170);
    if (p.diagnosis.notes) y = drawParagraph(doc, `${s.notes}: ${p.diagnosis.notes}`, y, 20, 170);
    for (const e of p.diagnosis.events) y = drawParagraph(doc, `${e.date} · ${e.kind}: ${e.summary}`, y, 24, 166);
    y = drawDivider(doc, y + 2);
  }

  // Labs and blood pressure
  if (p.labs.length || p.bloodPressure) {
    y = drawSectionTitle(doc, s.labsTitle, y);
    for (const l of p.labs) {
      if (y > 275) { doc.addPage(); y = 20; }
      y = drawKeyValue(doc, l.label, `${l.value}   (${l.date})${l.flag === 'high' ? s.above : l.flag === 'low' ? s.below : ''}`, y);
    }
    if (p.bloodPressure) y = drawKeyValue(doc, s.bp, `${p.bloodPressure.value} mmHg · ${p.bloodPressure.category}   (${p.bloodPressure.date})`, y);
    y = drawParagraph(doc, s.labsNote, y + 1);
    y = drawDivider(doc, y + 2);
  }

  // Hirsutism and wellbeing
  if (p.hirsutism || p.wellbeing) {
    y = drawSectionTitle(doc, s.hirsTitle, y);
    if (p.hirsutism) {
      const prev = p.hirsutism.previous ? `  (${s.previous} ${p.hirsutism.previous.total} ${s.on} ${p.hirsutism.previous.date})` : '';
      y = drawKeyValue(doc, 'mFG score', `${p.hirsutism.total}/36 ${s.on} ${p.hirsutism.date}${prev}`, y);
    }
    if (p.wellbeing) {
      y = drawKeyValue(doc, 'PHQ-2 / GAD-2', `${p.wellbeing.phq2}/6 · ${p.wellbeing.gad2}/6   (${p.wellbeing.date})`, y);
      y = drawKeyValue(doc, s.apnea, `${p.wellbeing.sleepSigns} ${s.apneaVal}`, y);
    }
    y = drawDivider(doc, y + 2);
  }

  // Questions
  if (p.questions.length) {
    y = drawSectionTitle(doc, s.questions, y);
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
  const s = STR[data.lang];
  const doc = new jsPDFClass('p', 'mm', 'a4');
  let y = 0;

  // Header
  y = drawHeader(doc, y, s);

  // Patient info
  y = drawSectionTitle(doc, s.patientInfo, y);
  y = drawKeyValue(doc, s.name, data.userName, y);
  y = drawKeyValue(doc, s.reportDate, data.generatedAt, y);
  y = drawDivider(doc, y + 2);

  // Cycle overview
  y = drawSectionTitle(doc, s.cycleOverview, y);
  if (data.cycleInfo) {
    y = drawKeyValue(doc, s.phase, s.phases[data.cycleInfo.phase] ?? data.cycleInfo.phase, y);
    y = drawKeyValue(doc, s.cycleDay, `${s.day} ${data.cycleInfo.cycleDay} ${s.of} ${data.cycleInfo.cycleLength}`, y);
    y = drawKeyValue(doc, s.daysToPeriod, `${data.cycleInfo.daysUntilNextPeriod} ${s.days}`, y);
  }
  y = drawKeyValue(doc, s.cycleLength, `${data.cycleLength} ${s.days}`, y);
  if (data.lastPeriodStart) {
    y = drawKeyValue(doc, s.lastPeriod, data.lastPeriodStart, y);
  }
  y = drawDivider(doc, y + 2);

  // Daily Logs Summary (last 30 days)
  if (data.dailyLogs.length > 0) {
    y = drawSectionTitle(doc, s.logsTitle(data.dailyLogs.length), y);

    const avgEnergy = data.dailyLogs.reduce((s, l) => s + (l.energy_level ?? 0), 0) / data.dailyLogs.length;
    const avgSleep = data.dailyLogs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / data.dailyLogs.length;

    y = drawKeyValue(doc, s.avgEnergy, `${avgEnergy.toFixed(1)} / 10`, y);
    y = drawKeyValue(doc, s.avgSleep, `${avgSleep.toFixed(1)} ${s.hours}`, y);

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
      y = drawKeyValue(doc, s.mood, moodStr, y);
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
      doc.text(s.topSymptoms, 20, y);
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

  // Hormonal symptoms (tracked by every profile)
  if (data.pmosEntries.length > 0) {
    y = drawSectionTitle(doc, s.hormTitle(data.pmosEntries.length), y);

    const symptomKeys = ['acne', 'fatigue', 'hirsutism', 'hair_loss', 'mood_swings', 'bloating'] as const;
    const labels = s.sym;

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
        doc.text(s.elevated, 165, y);
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
      doc.text(s.alert, 25, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${s.sustained}: ${alertSymptoms.map((k) => labels[k]).join(', ')}`,
        25,
        y + 8,
      );
      y += 18;
    }
    y = drawDivider(doc, y + 2);
  }

  // Habits summary
  if (data.habits.length > 0) {
    y = drawSectionTitle(doc, s.habitsTitle, y);

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
      doc.text(`${completedDays}/${totalDays} ${s.days} — ${rate}% ${s.completion}`, 80, y);

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

  if (data.pmos) y = drawPMOSSections(doc, data.pmos, y, s);

  // Footer disclaimer
  if (y > 250) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(20, y - 4, 170, 20, 2, 2, 'F');
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.text(s.disclaimer[0], 25, y + 2);
  doc.text(s.disclaimer[1], 25, y + 7);
  doc.text(s.generatedOn(data.generatedAt), 25, y + 12);

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text(s.page(i, pageCount), 185, 290, { align: 'right' });
  }

  doc.save(`${s.file}_${data.generatedAt.replace(/[/\s:]/g, '_')}.pdf`);
}
