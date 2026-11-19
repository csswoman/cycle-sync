import type { Language } from '@/i18n/translations';

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface LandingFeature {
  icon: string;
  title: string;
  desc: string;
  points: string[];
}

export interface LandingTips {
  /** Hero pill. */
  pmos: string;
  phases: Record<PhaseKey, string>;
  /** Feature bullets, keyed by `<feature index>-<point index>`. */
  points: Record<string, string>;
  /** PMOS block cards, by index. */
  pmosPoints: Record<number, string>;
  more: string;
}

export interface LandingText {
  tips: LandingTips;
  nav: { features: string; pmos: string; privacy: string; login: string; signUp: string; menu: string };
  toggleLanguage: string;
  toggleTheme: string;
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  mock: {
    day: string;
    phase: string;
    nextPeriod: string;
    todayTitle: string;
    items: string[];
    suggestion: string;
  };
  phases: {
    title: string;
    subtitle: string;
    items: Record<PhaseKey, { name: string; season: string; desc: string }>;
  };
  features: { title: string; subtitle: string; items: LandingFeature[]; more: string; less: string };
  pmos: {
    title: string;
    body: string;
    points: { title: string; desc: string }[];
    cta: string;
  };
  steps: { title: string; items: { title: string; desc: string }[] };
  privacy: { title: string; subtitle: string; items: { icon: string; title: string; desc: string }[] };
  finalCta: { title: string; body: string; primary: string; secondary: string };
  footer: { disclaimer: string; privacy: string; terms: string; rights: string };
}

const es: LandingText = {
  tips: {
    pmos: 'PMOS es el síndrome metabólico ovárico poliquístico. CycleSync registra tus síntomas y datos y da sugerencias. No diagnostica.',
    phases: {
      menstrual: 'Empieza el primer día de sangrado y suele durar de 3 a 7 días.',
      follicular: 'Va del primer día del periodo hasta la ovulación. Suben los estrógenos y suele haber más energía.',
      ovulation: 'Se libera un óvulo hacia la mitad del ciclo y dura 1 o 2 días. Con PMOS puede ser irregular, así que la fecha es una estimación.',
      luteal: 'Va de la ovulación al siguiente periodo, unos 12 a 14 días. Sube la progesterona y pueden aparecer antojos y cansancio.',
    },
    points: {
      '2-2': 'El peso máximo que podrías levantar una sola vez en un ejercicio. La calculadora lo estima a partir de series con menos peso.',
      '5-1': 'Servicio de Android que reúne pasos, sueño y actividad de tu reloj o teléfono. Si no lo usas, los anotas a mano.',
    },
    pmosPoints: {
      0: 'La escala Ferriman-Gallwey puntúa el crecimiento de vello en nueve zonas del cuerpo. Sirve para llevar un registro y comentarlo con tu médico.',
      1: 'Compara cada valor de tus análisis con su rango de referencia. No interpreta ni diagnostica: llévalo a tu consulta.',
    },
    more: 'Más información',
  },
  nav: { features: 'Funciones', pmos: 'PMOS', privacy: 'Privacidad', login: 'Iniciar sesión', signUp: 'Crear cuenta', menu: 'Menú' },
  toggleLanguage: 'Switch to English',
  toggleTheme: 'Cambiar tema claro u oscuro',
  hero: {
    eyebrow: 'Registro diario hecho para PMOS',
    title: 'Tu ciclo, tu cuerpo y tus rutinas,',
    titleAccent: 'en sincronía.',
    subtitle:
      'Seguimiento del ciclo con nutrición, ejercicio y bienestar para cada fase. Pensada para PMOS, útil para cualquiera.',
    primaryCta: 'Crear cuenta',
    secondaryCta: 'Probar sin cuenta',
    note: 'Funciona sin conexión. Tus datos son tuyos.',
  },
  mock: {
    day: 'Ejemplo · Día 9 de 29',
    phase: 'Fase folicular',
    nextPeriod: 'Próximo periodo en 20 días',
    todayTitle: 'Ritmo de hoy',
    items: ['Registro diario', 'Metformina 500 mg', 'Fuerza: tren inferior', 'Beber 2 L de agua'],
    suggestion: 'Tu energía suele subir en esta fase: buen momento para entrenar fuerza.',
  },
  phases: {
    title: 'Cada fase, como una estación de la flor',
    subtitle: 'La app adapta sugerencias de comida, movimiento y descanso a la fase en la que estás.',
    items: {
      menstrual: { name: 'Menstrual', season: 'Capullo', desc: 'Descanso, movimiento suave y alimentos ricos en hierro.' },
      follicular: { name: 'Folicular', season: 'Brote', desc: 'La energía sube: ideal para probar cosas nuevas y entrenar fuerza.' },
      ovulation: { name: 'Ovulación', season: 'Flor abierta', desc: 'Pico de energía y ánimo social. Entrenamientos más intensos.' },
      luteal: { name: 'Lútea', season: 'Fruto', desc: 'Antojos y cansancio: comidas estables y rutinas más tranquilas.' },
    },
  },
  features: {
    title: 'Todo lo que registras, en un solo lugar',
    more: 'Ver más funciones',
    less: 'Ver menos',
    subtitle: 'Cada pantalla te ayuda a anotar rápido y a ver tu avance con el tiempo.',
    items: [
      {
        icon: 'daily_log',
        title: 'Ciclo y registro diario',
        desc: 'Calendario con predicción de fases y un check-in diario en segundos.',
        points: ['Historial de periodos e intensidad del sangrado', 'Ánimo, energía, sueño, antojos y síntomas', 'Tendencias entre ciclos y hábitos'],
      },
      {
        icon: 'nutrition',
        title: 'Nutrición y planificador',
        desc: 'Recetas, plan semanal de comidas y entrenos, y lista de compras.',
        points: ['Biblioteca de recetas y tus favoritas', 'Plan semanal a partir de tus recetas', 'Lista de compras generada del plan'],
      },
      {
        icon: 'routines',
        title: 'Entrenamiento por fase',
        desc: 'Rutinas, programas y videos guiados según tu energía de cada día.',
        points: ['Diario de entrenamientos y estadísticas', 'Sugerencias según cómo te sientes hoy', 'Calculadora de repetición máxima (1RM)'],
      },
      {
        icon: 'assistant',
        title: 'Asistente con IA',
        desc: 'Pregunta lo que quieras con el contexto de tus propios registros.',
        points: ['Análisis de fotos de comidas', 'Revisión de videos de ejercicio', 'Solo usa tus datos si das permiso'],
      },
      {
        icon: 'medication',
        title: 'Medicación y citas',
        desc: 'Horarios, cambios de dosis, efectos secundarios y próximas consultas.',
        points: ['Recordatorios y calendario de tomas', 'Registro de efectos secundarios', 'Preguntas para llevar a tu médico'],
      },
      {
        icon: 'description',
        title: 'Reportes e integraciones',
        desc: 'Lleva un resumen claro a tu consulta y conecta tus datos de actividad.',
        points: ['Reporte de salud en PDF', 'Samsung Health Connect o registro manual', 'Exportación completa en JSON'],
      },
    ],
  },
  pmos: {
    title: 'Hecha desde PMOS, no adaptada a él.',
    body:
      'CycleSync parte de PMOS: síntomas, análisis, medicación y consejos por fase en un mismo lugar, para llevar un registro claro a tu consulta.',
    points: [
      { title: 'Síntomas con escala', desc: 'Puntuación de síntomas, incluido el exceso de vello (hirsutismo) con la escala Ferriman-Gallwey.' },
      { title: 'Análisis desde una foto', desc: 'Sube una foto o PDF de tus resultados y se leen con sus rangos de referencia.' },
      { title: 'Métricas que importan', desc: 'Glucosa, insulina, peso, cintura y presión arterial, con su evolución.' },
      { title: 'Fotos de progreso privadas', desc: 'Guardadas en almacenamiento privado y nunca enviadas a la IA.' },
    ],
    cta: 'Ver la sección PMOS',
  },
  steps: {
    title: 'Empieza en tres pasos',
    items: [
      { title: 'Cuéntanos de tu ciclo', desc: 'Duración, último periodo y si tienes PMOS. Toma un par de minutos.' },
      { title: 'Registra cada día', desc: 'Un check-in rápido de ánimo, energía, síntomas, comidas y rutinas.' },
      { title: 'Mira cómo florece', desc: 'Tendencias, patrones por fase y un reporte listo para tu consulta.' },
    ],
  },
  privacy: {
    title: 'Privacidad por defecto',
    subtitle: 'Tu salud es información sensible. Así la cuidamos.',
    items: [
      { icon: 'wifi_off', title: 'Funciona sin conexión', desc: 'Instálala como app y registra aunque no tengas internet. Se sincroniza al volver.' },
      { icon: 'shield_lock', title: 'Solo tú ves tus datos', desc: 'Cada cuenta solo puede leer sus propios registros. No vendemos datos ni hay publicidad.' },
      { icon: 'lock', title: 'Bloqueo con PIN', desc: 'Añade un PIN opcional para abrir la app en tu dispositivo.' },
      { icon: 'download', title: 'Tú decides', desc: 'Descarga todos tus datos o elimina tu cuenta cuando quieras.' },
    ],
  },
  finalCta: {
    title: 'Empieza a conocer tu ciclo hoy',
    body: 'Explora el panel, las rutinas y las recetas sin cuenta. Crea una cuando quieras guardar tus registros.',
    primary: 'Crear cuenta',
    secondary: 'Probar sin cuenta',
  },
  footer: {
    disclaimer: 'CycleSync ofrece sugerencias y registros. No da diagnósticos ni sustituye la consulta médica.',
    privacy: 'Privacidad',
    terms: 'Términos',
    rights: 'Todos los derechos reservados.',
  },
};

const en: LandingText = {
  tips: {
    pmos: 'PMOS is polycystic ovarian metabolic syndrome. CycleSync records your symptoms and data and gives suggestions. It does not diagnose.',
    phases: {
      menstrual: 'Starts on the first day of bleeding and usually lasts 3 to 7 days.',
      follicular: 'Runs from the first day of your period to ovulation. Estrogen rises and energy is often higher.',
      ovulation: 'An egg is released around mid-cycle and lasts 1 or 2 days. With PMOS it can be irregular, so the date is an estimate.',
      luteal: 'Runs from ovulation to the next period, about 12 to 14 days. Progesterone rises and cravings and tiredness may show up.',
    },
    points: {
      '2-2': 'The most weight you could lift once for an exercise. The calculator estimates it from sets with lighter weight.',
      '5-1': 'An Android service that collects steps, sleep and activity from your watch or phone. If you do not use it, you enter them by hand.',
    },
    pmosPoints: {
      0: 'The Ferriman-Gallwey scale scores hair growth in nine body areas. It helps you keep a record to discuss with your doctor.',
      1: 'Compares each value in your results with its reference range. It does not interpret or diagnose: bring it to your appointment.',
    },
    more: 'More information',
  },
  nav: { features: 'Features', pmos: 'PMOS', privacy: 'Privacy', login: 'Log in', signUp: 'Sign up', menu: 'Menu' },
  toggleLanguage: 'Cambiar a español',
  toggleTheme: 'Toggle light or dark theme',
  hero: {
    eyebrow: 'A daily log built for PMOS',
    title: 'Your cycle, your body and your routines,',
    titleAccent: 'in sync.',
    subtitle:
      'Cycle tracking with nutrition, training and wellbeing for each phase. Built for PMOS, useful for anyone.',
    primaryCta: 'Create account',
    secondaryCta: 'Try it without an account',
    note: 'Works offline. Your data stays yours.',
  },
  mock: {
    day: 'Example · Day 9 of 29',
    phase: 'Follicular phase',
    nextPeriod: 'Next period in 20 days',
    todayTitle: "Today's rhythm",
    items: ['Daily check-in', 'Metformin 500 mg', 'Strength: lower body', 'Drink 2 L of water'],
    suggestion: 'Your energy tends to rise in this phase: a good time for strength training.',
  },
  phases: {
    title: 'Each phase, like a season of a flower',
    subtitle: 'The app adapts food, movement and rest suggestions to the phase you are in.',
    items: {
      menstrual: { name: 'Menstrual', season: 'Bud', desc: 'Rest, gentle movement and iron-rich foods.' },
      follicular: { name: 'Follicular', season: 'Sprout', desc: 'Energy rises: a great time to try new things and lift.' },
      ovulation: { name: 'Ovulation', season: 'Full bloom', desc: 'Peak energy and social mood. Harder workouts.' },
      luteal: { name: 'Luteal', season: 'Fruit', desc: 'Cravings and tiredness: steady meals and calmer routines.' },
    },
  },
  features: {
    title: 'Everything you log, in one place',
    more: 'Show more features',
    less: 'Show less',
    subtitle: 'Every screen helps you record quickly and see your progress over time.',
    items: [
      {
        icon: 'daily_log',
        title: 'Cycle and daily log',
        desc: 'A calendar with phase predictions and a daily check-in in seconds.',
        points: ['Period history and bleeding intensity', 'Mood, energy, sleep, cravings and symptoms', 'Trends across cycles and habit tracking'],
      },
      {
        icon: 'nutrition',
        title: 'Nutrition and planner',
        desc: 'Recipes, a weekly plan for meals and workouts, and a grocery list.',
        points: ['Recipe library and your favorites', 'Weekly plan built from your recipes', 'Grocery list generated from the plan'],
      },
      {
        icon: 'routines',
        title: 'Training by phase',
        desc: 'Routines, programs and guided videos matched to your energy each day.',
        points: ['Workout journal and training stats', 'Suggestions based on how you feel today', 'One-rep max (1RM) calculator'],
      },
      {
        icon: 'assistant',
        title: 'AI assistant',
        desc: 'Ask anything, with context from your own records.',
        points: ['Meal photo analysis', 'Exercise video review', 'Uses your data only with your consent'],
      },
      {
        icon: 'medication',
        title: 'Medication and appointments',
        desc: 'Schedules, dose changes, side effects and upcoming visits.',
        points: ['Reminders and a dose calendar', 'Side-effect log', 'Questions to bring to your doctor'],
      },
      {
        icon: 'description',
        title: 'Reports and integrations',
        desc: 'Bring a clear summary to your appointment and connect your activity data.',
        points: ['PDF health report', 'Samsung Health Connect or manual entry', 'Full JSON export'],
      },
    ],
  },
  pmos: {
    title: 'Built around PMOS, not adapted to it.',
    body:
      'CycleSync starts from PMOS: symptoms, lab results, medication and phase-aware advice in one place, so you can bring a clear record to your appointment.',
    points: [
      { title: 'Scored symptoms', desc: 'Symptom scoring, including excess hair growth (hirsutism) with the Ferriman-Gallwey scale.' },
      { title: 'Labs from a photo', desc: 'Upload a photo or PDF of your results and they are read with their reference ranges.' },
      { title: 'Metrics that matter', desc: 'Glucose, insulin, weight, waist and blood pressure, tracked over time.' },
      { title: 'Private progress photos', desc: 'Kept in private storage and never sent to the AI.' },
    ],
    cta: 'See the PMOS section',
  },
  steps: {
    title: 'Get started in three steps',
    items: [
      { title: 'Tell us about your cycle', desc: 'Cycle length, last period and whether you have PMOS. It takes a couple of minutes.' },
      { title: 'Log each day', desc: 'A quick check-in for mood, energy, symptoms, meals and routines.' },
      { title: 'Watch it bloom', desc: 'Trends, patterns by phase and a report ready for your appointment.' },
    ],
  },
  privacy: {
    title: 'Private by default',
    subtitle: 'Your health is sensitive information. This is how we protect it.',
    items: [
      { icon: 'wifi_off', title: 'Works offline', desc: 'Install it as an app and log without internet. It syncs when you are back online.' },
      { icon: 'shield_lock', title: 'Only you see your data', desc: 'Each account can only read its own records. No data selling, no ads.' },
      { icon: 'lock', title: 'PIN lock', desc: 'Add an optional PIN to open the app on your device.' },
      { icon: 'download', title: 'You are in control', desc: 'Download all your data or delete your account at any time.' },
    ],
  },
  finalCta: {
    title: 'Start getting to know your cycle today',
    body: 'Explore the dashboard, routines and recipes without an account. Create one when you want to save your logs.',
    primary: 'Create account',
    secondary: 'Try it without an account',
  },
  footer: {
    disclaimer: 'CycleSync offers suggestions and records. It does not diagnose or replace medical advice.',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved.',
  },
};

export const landingText: Record<Language, LandingText> = { es, en };
