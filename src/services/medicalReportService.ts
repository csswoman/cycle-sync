import type { CycleInfo, DailyLog, PCOSSymptomEntry, Habit, HabitLog } from '@/types';
import type jsPDF from 'jspdf';

interface ReportData {
  userName: string;
  generatedAt: string;
  cycleInfo: CycleInfo | null;
  cycleLength: number;
  lastPeriodStart: string | null;
  dailyLogs: DailyLog[];
  pcosEntries: PCOSSymptomEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
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

  // PCOS Symptoms
  if (data.pcosEntries.length > 0) {
    y = drawSectionTitle(doc, `PCOS Symptom Tracking (${data.pcosEntries.length} entries, last 30 days)`, y);

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
      const avg = data.pcosEntries.reduce((s, e) => s + (e[key] ?? 0), 0) / data.pcosEntries.length;
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
      const recent = data.pcosEntries.slice(-7);
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
