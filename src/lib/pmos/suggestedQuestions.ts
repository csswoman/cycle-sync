/**
 * Questions for the doctor built from what the user has logged. Each one states the fact from her
 * own data and asks; none of them interprets or diagnoses.
 */
import type { PMOSOverviewData } from '@/hooks/usePMOSOverview';
import { periodGap, ovulationHistory } from './cycleStatus';
import { screeningPlan, type ScreeningKey } from './screening';
import { derivedSeries, homaIr, freeAndrogenIndex, FAI_HIGH, type LabMarker } from './metrics';
import { cycleHealthFlags } from '@/lib/cycle/cycleAnalysis';
import { parseLocalDate } from '@/lib/medications/schedule';
import { FG_THRESHOLD } from './wellbeing';
import type { Insight } from './insights';
export interface SuggestedQuestion { id: string; es: string; en: string }
const SCREEN_Q: Record<ScreeningKey, { es: string; en: string }> = {
  glucose: { es: 'No tengo un control de glucosa reciente en mi registro. ¿Cuándo me toca hacerlo y cuál me conviene (glucosa en ayunas, HbA1c o curva)?', en: 'I have no recent glucose check in my log. When should I have one and which is best (fasting glucose, HbA1c or tolerance test)?' },
  lipids: { es: 'No tengo un perfil de lípidos reciente. ¿Cada cuánto debo hacerlo?', en: 'I have no recent lipid profile. How often should I have one?' },
  blood_pressure: { es: 'No tengo una presión arterial reciente en mi registro. ¿Cada cuánto debo controlarla?', en: 'I have no recent blood pressure reading. How often should I check it?' },
  vitamin_b12: { es: 'Tomo metformina y no tengo vitamina B12 reciente. ¿Conviene revisarla?', en: 'I take metformin and have no recent vitamin B12. Should I check it?' },
};
const MAX = 6;
/** Highest priority first; at most 6. */
export function suggestQuestions(data: PMOSOverviewData, insights: Insight[]): SuggestedQuestion[] {
  const out: SuggestedQuestion[] = [];
  const add = (q: SuggestedQuestion) => { if (!out.some((o) => o.id === q.id)) out.push(q); };
  const flags = cycleHealthFlags(data.periodRuns, parseLocalDate(data.today), data.signs, data.pregnancies);
  if (flags.includes('heavyAfterGap')) {
    add({ id: 'heavy-after-gap', es: 'Tuve una regla abundante después de más de 90 días sin sangrado. ¿Necesito una ecografía o revisar el endometrio?', en: 'I had a heavy period after more than 90 days without bleeding. Do I need an ultrasound or an endometrial check?' });
  } else if (flags.includes('heavyBleeding')) {
    add({ id: 'heavy-bleeding', es: 'Tuve días de sangrado muy abundante o con coágulos. ¿Debo revisar hierro o hacerme otros estudios?', en: 'I had very heavy bleeding days or clots. Should I check my iron or have other tests?' });
  }
  const gap = periodGap(data.periodStarts, data.today, data.pregnancies);
  if (gap && gap.level !== 'ok') {
    const d = gap.days;
    add({ id: 'period-gap',
      es: `Llevo ${d} días sin regla. ¿Necesito algún estudio, o algo para proteger el endometrio si pasa mucho tiempo sin sangrar?`,
      en: `It has been ${d} days since my last period. Do I need any tests, or something to protect my uterine lining if long gaps continue?` });
  }
  const plan = screeningPlan({
    labs: data.labs, fastingGlucoseDates: data.fastingGlucose.map((g) => g.date), bloodPressureDates: data.bloodPressureDates,
    onMetformin: data.medications.some((m) => m.active && /metformin/i.test(m.name)),
  }, data.today);
  for (const p of plan) if (p.status !== 'ok') add({ id: `screen-${p.key}`, ...SCREEN_Q[p.key] });
  const labs = data.labs as { date: string; marker: LabMarker; value: number }[];
  const homa = derivedSeries(labs, 'fasting_glucose', 'fasting_insulin', homaIr).at(-1);
  if (homa && homa.value > 2.5) {
    add({ id: 'homa', es: `Mi HOMA-IR calculado es ${homa.value} (${homa.date}). ¿Qué significa para mi tratamiento y mi alimentación?`, en: `My calculated HOMA-IR is ${homa.value} (${homa.date}). What does it mean for my treatment and diet?` });
  }
  const fai = derivedSeries(labs, 'testosterone', 'shbg', freeAndrogenIndex).at(-1);
  if (fai && fai.value >= FAI_HIGH) {
    add({ id: 'fai', es: `Mi índice de andrógenos libres calculado es ${fai.value}. ¿Qué opciones tengo para el acné o el vello?`, en: `My calculated free androgen index is ${fai.value}. What options do I have for acne or hair growth?` });
  }
  const fg = [...data.hirsutism].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (fg && fg.total >= FG_THRESHOLD) {
    add({ id: 'fg', es: `Mi puntaje de Ferriman-Gallwey fue ${fg.total} (${fg.date}). ¿Qué opciones tengo para el vello además de lo que tomo?`, en: `My Ferriman-Gallwey score was ${fg.total} (${fg.date}). What options do I have for hair growth besides what I take?` });
  }
  for (const i of insights) {
    if (i.id.startsWith('side-effects-') && i.tone === 'attention') {
      add({ id: i.id, es: 'Tuve molestias fuertes con un medicamento (están en mi registro de efectos). ¿Conviene ajustar la dosis o cambiar de presentación?', en: 'I had strong side effects with a medication (they are in my side-effects log). Should the dose or form be adjusted?' });
    } else if (i.id.startsWith('checkpoint-')) {
      add({ id: i.id, es: 'Llevo varios meses con mi tratamiento y comparé mis síntomas de antes y ahora. ¿Los cambios que veo son los esperados?', en: 'I have been on my treatment for several months and compared my symptoms before and now. Are the changes I see what you expected?' });
    } else if (i.id.startsWith('adh-') && i.tone === 'attention') {
      add({ id: i.id, es: 'Me cuesta tomar todas las dosis. ¿Hay otra pauta u horario que me sirva mejor?', en: 'I find it hard to take every dose. Is there another schedule or form that would suit me better?' });
    }
  }
  if (!data.hormonal) {
    const hist = ovulationHistory(data.periodStarts, data.signs, data.today, 6).filter((c) => c.end);
    if (hist.length >= 3 && hist.every((c) => c.status === 'not_detected')) {
      add({ id: 'no-ovulation', es: 'Mi temperatura no muestra ovulación en mis últimos ciclos. ¿Cómo puedo confirmar si estoy ovulando?', en: 'My temperature chart shows no ovulation in my last cycles. How can I confirm whether I am ovulating?' });
    }
  }
  return out.slice(0, MAX);
}
