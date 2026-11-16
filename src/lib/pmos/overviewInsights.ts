import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { buildInsights, type Insight } from './insights';
import { medicationStart } from '@/lib/medications/schedule';
/** Runs every insight over the data loaded by `usePMOSOverview`. */
export function insightsFromOverview(data: PMOSOverviewData, hideNumbers: boolean): Insight[] {
  return buildInsights({
    today: data.today,
    periodStarts: data.periodStarts,
    medications: data.medications.map((m) => ({ ...m, start: medicationStart(m) })),
    medLogs: data.medLogs,
    symptomTotals: data.symptomTotals,
    fastingGlucose: data.fastingGlucose,
    dailyLogs: data.dailyLogs,
    workoutDates: data.workoutDates,
    healthData: data.healthData,
    acne: data.acne,
    hirsutism: data.hirsutism,
    waist: data.waist,
    signs: data.signs,
    hormonal: data.hormonal,
    hideNumbers,
    sideEffects: data.sideEffects,
    doseChanges: data.doseChanges,
  });
}
