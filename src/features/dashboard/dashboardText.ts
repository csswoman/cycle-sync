import { CyclePhase } from '@/types';
import type { Language } from '@/i18n/translations';

type PhaseKey = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

interface PhaseCopy {
  name: string;
  focus: string;
  hormones: string;
  movement: { title: string; desc: string };
  food: { title: string; desc: string };
}

export interface DashboardText {
  greeting: (name?: string) => string;
  subtitle: string;
  dayOf: (day: number, total: number) => string;
  phaseWord: string;
  nextPeriod: string;
  inDays: (n: number) => string;
  today: string;
  late: (n: number) => string;
  anyDay: string;
  expectedBetween: (from: string, to: string) => string;
  lateTitle: string;
  lateBody: string;
  overdueDay: (day: number) => string;
  ovulationUnsure: string;
  noPeriod90: string;
  logPeriodCta: string;
  ovulation: string;
  ovulationIn: (n: number) => string;
  ovulationToday: string;
  ovulationPassed: string;
  fertileWindow: string;
  fertileNow: string;
  fertileTip: string;
  hormonalNote: string;
  irregularNote: string;
  approx: string;
  confidence: string;
  confidenceLevels: { low: string; medium: string; high: string };
  noDataTitle: string;
  noDataBody: string;
  noDataCta: string;
  todayTitle: string;
  doneLabel: string;
  logTitle: string;
  logDone: string;
  logPending: string;
  logCta: string;
  medsTitle: string;
  medsProgress: (taken: number, total: number) => string;
  medsNone: string;
  medsCta: string;
  habitsTitle: string;
  habitsProgress: (pct: number) => string;
  habitsCta: string;
  recommendTitle: string;
  recommendSubtitle: string;
  workoutCta: string;
  foodCta: string;
  lowActivityNote: string;
  pmosNote: string;
  disclaimer: string;
  phases: Record<PhaseKey, PhaseCopy>;
}

const en: DashboardText = {
  greeting: (name) => (name ? `Hi, ${name}!` : 'Your day'),
  subtitle: 'What matters today, based on your cycle.',
  dayOf: (d, t) => `Day ${d} of ~${t}`,
  phaseWord: 'phase',
  nextPeriod: 'Next period',
  inDays: (n) => `in ${n} ${n === 1 ? 'day' : 'days'}`,
  today: 'today',
  late: (n) => `${n} ${n === 1 ? 'day' : 'days'} late`,
  anyDay: 'any day now',
  expectedBetween: (from, to) => `Expected between ${from} and ${to}`,
  lateTitle: 'Your period is late',
  lateBody: 'With PMOS this usually means ovulation came later than usual or did not happen this cycle. The count keeps going until you log your next period.',
  overdueDay: (d) => `Day ${d} · waiting for your period`,
  ovulationUnsure: 'may be delayed this cycle',
  noPeriod90: 'It has been more than 90 days since your last logged period. Guidelines recommend checking gaps this long with your doctor.',
  logPeriodCta: 'Log period',
  ovulation: 'Ovulation',
  ovulationIn: (n) => `in ~${n} ${n === 1 ? 'day' : 'days'}`,
  ovulationToday: 'around today',
  ovulationPassed: 'already passed this cycle',
  fertileWindow: 'Fertile window',
  fertileNow: 'You are in your estimated fertile window.',
  fertileTip: 'Your chances are highest on the two days before ovulation and on ovulation day.',
  hormonalNote: 'You use hormonal contraception, so ovulation dates are only a reference.',
  irregularNote: 'Your cycles vary a lot, so these dates have a wide margin. With PMOS ovulation can come late or be skipped; body signs (cervical mucus, basal temperature) say more than the calendar, and LH strips can give false positives.',
  approx: 'Approximate estimates, not a contraceptive method or medical advice.',
  confidence: 'Confidence',
  confidenceLevels: { low: 'Low', medium: 'Medium', high: 'High' },
  noDataTitle: 'Add your periods to get predictions',
  noDataBody: 'With a few past months we can estimate your cycle length, next period and ovulation.',
  noDataCta: 'Add period history',
  todayTitle: 'Today',
  doneLabel: 'Done',
  logTitle: 'Daily log',
  logDone: 'Logged today',
  logPending: 'Mood, energy, sleep and symptoms',
  logCta: 'Log now',
  medsTitle: 'Medication',
  medsProgress: (t, n) => `${t} of ${n} doses taken`,
  medsNone: 'No medication added yet',
  medsCta: 'Open',
  habitsTitle: 'Habits',
  habitsProgress: (p) => `${p}% completed`,
  habitsCta: 'Open',
  recommendTitle: 'For this phase',
  recommendSubtitle: 'Suggestions matched to your energy right now.',
  workoutCta: 'See routines',
  foodCta: 'See meal ideas',
  lowActivityNote: 'You said you are mostly sedentary: keep sessions short and build up slowly.',
  pmosNote: 'With PMOS the weekly total matters more than the cycle phase: aim for 150 min of moderate activity (or 75 vigorous) plus 2 strength days, and adjust each session to how you feel.',
  disclaimer: 'This plan is based on your tracked data. Listen to your body first and consult a healthcare professional for medical decisions.',
  phases: {
    Menstrual: {
      name: 'Menstrual', focus: 'Rest and recovery', hormones: 'Low estrogen and progesterone',
      movement: { title: 'Gentle yoga and stretching', desc: 'Restorative flow and walking. Gentle movement can ease cramps.' },
      food: { title: 'Iron and warm meals', desc: 'Lentils, leafy greens, red meat or fortified foods with vitamin C to replace iron.' },
    },
    Follicular: {
      name: 'Follicular', focus: 'Build strength', hormones: 'Rising estrogen',
      movement: { title: 'Progressive strength training', desc: 'Energy rises: a good window for new exercises and heavier loads.' },
      food: { title: 'Fresh and light', desc: 'Vegetables, fermented foods, lean protein and whole grains.' },
    },
    Ovulation: {
      name: 'Ovulation', focus: 'Peak performance', hormones: 'Estrogen peak and LH surge',
      movement: { title: 'HIIT and power circuits', desc: 'Peak energy and coordination. Warm up well to protect your joints.' },
      food: { title: 'Fiber and antioxidants', desc: 'Raw vegetables, berries, quinoa and plenty of water.' },
    },
    Luteal: {
      name: 'Luteal', focus: 'Stabilize blood sugar', hormones: 'High progesterone',
      movement: { title: 'Low-impact strength and pilates', desc: 'Maintain muscle without adding stress. Lower the intensity as your period gets closer.' },
      food: { title: 'Magnesium and complex carbs', desc: 'Nuts, seeds, dark chocolate and whole grains to reduce cravings and mood swings.' },
    },
  },
};

const es: DashboardText = {
  greeting: (name) => (name ? `¡Hola, ${name}!` : 'Tu día'),
  subtitle: 'Lo que importa hoy, según tu ciclo.',
  dayOf: (d, t) => `Día ${d} de ~${t}`,
  phaseWord: 'fase',
  nextPeriod: 'Próxima regla',
  inDays: (n) => `en ${n} ${n === 1 ? 'día' : 'días'}`,
  today: 'hoy',
  late: (n) => `${n} ${n === 1 ? 'día' : 'días'} de retraso`,
  anyDay: 'en cualquier momento',
  expectedBetween: (from, to) => `Esperada entre el ${from} y el ${to}`,
  lateTitle: 'Tu regla va con retraso',
  lateBody: 'Con PMOS suele significar que la ovulación llegó más tarde de lo habitual o no ocurrió en este ciclo. La cuenta sigue hasta que registres tu próxima regla.',
  overdueDay: (d) => `Día ${d} · esperando tu regla`,
  ovulationUnsure: 'puede haberse retrasado',
  noPeriod90: 'Han pasado más de 90 días desde tu última regla registrada. Las guías recomiendan revisar pausas tan largas con tu médica.',
  logPeriodCta: 'Registrar regla',
  ovulation: 'Ovulación',
  ovulationIn: (n) => `en ~${n} ${n === 1 ? 'día' : 'días'}`,
  ovulationToday: 'alrededor de hoy',
  ovulationPassed: 'ya pasó en este ciclo',
  fertileWindow: 'Ventana fértil',
  fertileNow: 'Estás en tu ventana fértil estimada.',
  fertileTip: 'Tus probabilidades son mayores los dos días antes de la ovulación y el día de la ovulación.',
  hormonalNote: 'Usas anticoncepción hormonal, así que las fechas de ovulación son solo una referencia.',
  irregularNote: 'Tus ciclos varían bastante, así que estas fechas tienen un margen amplio. Con PMOS la ovulación puede retrasarse o no ocurrir; las señales del cuerpo (moco cervical, temperatura basal) dicen más que el calendario, y las tiras de LH pueden dar falsos positivos.',
  approx: 'Estimaciones aproximadas, no son un método anticonceptivo ni consejo médico.',
  confidence: 'Confianza',
  confidenceLevels: { low: 'Baja', medium: 'Media', high: 'Alta' },
  noDataTitle: 'Agrega tus reglas para ver predicciones',
  noDataBody: 'Con unos meses pasados estimamos la duración de tu ciclo, tu próxima regla y tu ovulación.',
  noDataCta: 'Agregar historial',
  todayTitle: 'Hoy',
  doneLabel: 'Listo',
  logTitle: 'Registro diario',
  logDone: 'Registrado hoy',
  logPending: 'Ánimo, energía, sueño y síntomas',
  logCta: 'Registrar',
  medsTitle: 'Medicación',
  medsProgress: (t, n) => `${t} de ${n} tomas hechas`,
  medsNone: 'Aún no has agregado medicación',
  medsCta: 'Abrir',
  habitsTitle: 'Hábitos',
  habitsProgress: (p) => `${p}% completado`,
  habitsCta: 'Abrir',
  recommendTitle: 'Para esta fase',
  recommendSubtitle: 'Sugerencias según tu energía de ahora.',
  workoutCta: 'Ver rutinas',
  foodCta: 'Ver ideas de comidas',
  lowActivityNote: 'Dijiste que eres sedentaria casi siempre: mantén sesiones cortas y sube poco a poco.',
  pmosNote: 'Con PMOS importa más el total semanal que la fase del ciclo: apunta a 150 min de actividad moderada (o 75 vigorosa) más 2 días de fuerza, y ajusta cada sesión a cómo te sientes.',
  disclaimer: 'Este plan se basa en tus datos registrados. Escucha primero a tu cuerpo y consulta a un profesional de la salud para decisiones médicas.',
  phases: {
    Menstrual: {
      name: 'Menstrual', focus: 'Descanso y recuperación', hormones: 'Estrógeno y progesterona bajos',
      movement: { title: 'Yoga suave y estiramientos', desc: 'Flujo restaurativo y caminatas. El movimiento suave puede aliviar los cólicos.' },
      food: { title: 'Hierro y comidas calientes', desc: 'Lentejas, hojas verdes, carne roja o alimentos fortificados con vitamina C para reponer hierro.' },
    },
    Follicular: {
      name: 'Folicular', focus: 'Ganar fuerza', hormones: 'Estrógeno en aumento',
      movement: { title: 'Fuerza progresiva', desc: 'La energía sube: buen momento para ejercicios nuevos y más carga.' },
      food: { title: 'Fresco y ligero', desc: 'Verduras, fermentados, proteína magra y cereales integrales.' },
    },
    Ovulation: {
      name: 'Ovulación', focus: 'Máximo rendimiento', hormones: 'Pico de estrógeno y de LH',
      movement: { title: 'HIIT y circuitos de potencia', desc: 'Energía y coordinación al máximo. Calienta bien para cuidar tus articulaciones.' },
      food: { title: 'Fibra y antioxidantes', desc: 'Verduras crudas, frutos rojos, quinoa y mucha agua.' },
    },
    Luteal: {
      name: 'Lútea', focus: 'Estabilizar el azúcar en sangre', hormones: 'Progesterona alta',
      movement: { title: 'Fuerza de bajo impacto y pilates', desc: 'Mantén el músculo sin añadir estrés. Baja la intensidad al acercarse tu regla.' },
      food: { title: 'Magnesio y carbohidratos complejos', desc: 'Nueces, semillas, chocolate oscuro y cereales integrales para reducir antojos y cambios de humor.' },
    },
  },
};

export const dashboardText: Record<Language, DashboardText> = { en, es };

export function phaseKey(phase: CyclePhase | string): PhaseKey {
  return (['Menstrual', 'Follicular', 'Ovulation', 'Luteal'].includes(phase) ? phase : 'Follicular') as PhaseKey;
}
