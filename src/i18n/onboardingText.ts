import type { Language } from './translations';

export interface OnboardingOption {
  label: string;
  description?: string;
}

export interface OnboardingText {
  archetype: {
    title: string;
    subtitle: string;
    privacy: string;
    questionOf: (n: number, total: number) => string;
    back: string;
    next: string;
    finish: string;
    saving: string;
    chooseOne: string;
    chooseAny: string;
    questions: Record<string, { title: string; hint: string }>;
    options: Record<string, OnboardingOption>;
    notes: { hormonalContraception: string; irregular: string };
  };
  setup: {
    stepOf: (step: number, total: number, name: string) => string;
    stepNames: { cycle: string; preferences: string; profile: string };
    percentComplete: (n: number) => string;
    back: string;
    next: string;
    complete: string;
    saving: string;
    needLogin: string;
    saveError: string;
    whyWeAsk: string;
    why: { title: string; body: string }[];
    privacyTitle: string;
    privacyBody: string;
    cycle: {
      title: string;
      subtitle: string;
      calendarTitle: string;
      calendarHelp: string;
      daysMarked: (n: number) => string;
      avgTitle: string;
      avgHelp: string;
      avgFromHistory: (n: number, cycles: number) => string;
      unsureTitle: string;
      unsureHelp: string;
      unsureCheck: string;
      needData: string;
    };
    prefs: {
      title: string;
      subtitle: string;
      training: string;
      food: string;
      trainingOptions: Record<string, string>;
      foodOptions: Record<string, string>;
    };
    profile: {
      title: string;
      subtitle: string;
      changePhoto: string;
      displayName: string;
      namePlaceholder: string;
      goal: string;
      goalPlaceholder: string;
    };
  };
}

const en: OnboardingText = {
  archetype: {
    title: "Welcome. Let's personalize your experience.",
    subtitle: 'A few quick questions so the app fits your goals and your body. You can change your answers any time.',
    privacy: 'Your answers are only used to tailor recommendations.',
    questionOf: (n, total) => `Question ${n} of ${total}`,
    back: 'Back',
    next: 'Next',
    finish: 'Save and continue',
    saving: 'Saving...',
    chooseOne: 'Choose one',
    chooseAny: 'Choose all that apply',
    questions: {
      goal: { title: 'What do you want most from CycleSync?', hint: 'This sets your main profile.' },
      regularity: { title: 'How would you describe your periods?', hint: 'An honest guess is fine. Your logged history will refine it.' },
      contraception: { title: 'Do you use hormonal contraception?', hint: 'It changes how reliable cycle and ovulation estimates are.' },
      symptoms: { title: 'Which symptoms bother you the most?', hint: 'We will highlight tips for them.' },
      activity: { title: 'How active are you right now?', hint: 'Used to suggest workout intensity.' },
    },
    options: {
      goal_performance: { label: 'Train in sync with my cycle', description: 'Push harder when energy is high and recover when it is low.' },
      goal_pmos: { label: 'Manage PMOS or irregular cycles', description: 'Hormonal balance, insulin sensitivity and symptom relief with low-impact consistency.' },
      goal_fertility: { label: 'Get pregnant', description: 'Track your fertile window and ovulation to time conception.' },
      goal_wellness: { label: 'Understand my cycle', description: 'Learn your pattern, track symptoms and feel more in control.' },
      reg_regular: { label: 'Regular', description: 'About the same length every month.' },
      reg_irregular: { label: 'Irregular', description: 'Length varies a lot or I skip months.' },
      reg_unsure: { label: "I'm not sure", description: "I haven't tracked them." },
      reg_none: { label: 'I rarely or never get a period' },
      con_none: { label: 'No' },
      con_pill: { label: 'Birth control pill' },
      con_iud: { label: 'Hormonal IUD' },
      con_other: { label: 'Implant, injection or patch' },
      con_nonhormonal: { label: 'Non-hormonal (copper IUD, condoms...)' },
      sym_cramps: { label: 'Cramps' },
      sym_fatigue: { label: 'Fatigue' },
      sym_mood: { label: 'Mood swings' },
      sym_bloating: { label: 'Bloating' },
      sym_acne: { label: 'Acne' },
      sym_headache: { label: 'Headaches' },
      sym_sleep: { label: 'Poor sleep' },
      sym_cravings: { label: 'Cravings' },
      sym_hair: { label: 'Hair changes' },
      act_low: { label: 'Mostly sedentary', description: '0 to 1 workouts a week.' },
      act_moderate: { label: 'Moderately active', description: '2 to 3 workouts a week.' },
      act_high: { label: 'Very active', description: '4 or more workouts a week.' },
    },
    notes: {
      hormonalContraception: 'With hormonal contraception there is usually no natural ovulation, so ovulation estimates will not apply to you.',
      irregular: 'With irregular cycles, estimates have a wider margin. The more history you add, the better they get.',
    },
  },
  setup: {
    stepOf: (step, total, name) => `Step ${step} of ${total}: ${name}`,
    stepNames: { cycle: 'Your cycle', preferences: 'Preferences', profile: 'Profile' },
    percentComplete: (n) => `${n}% complete`,
    back: 'Back',
    next: 'Next step',
    complete: 'Complete setup',
    saving: 'Saving...',
    needLogin: 'Sign in to save your setup.',
    saveError: 'Could not save your setup. Please try again.',
    whyWeAsk: 'Why we ask',
    why: [
      { title: 'Learning your cycle', body: 'The more past periods you add, the better we can estimate your cycle length, next period and ovulation. A few months is enough to start.' },
      { title: 'Tailoring your plan', body: 'We match activities and food to your energy across the phases. Yoga during menstruation, intense training around ovulation.' },
      { title: 'Personalizing your space', body: 'This helps us address you correctly and makes the dashboard feel like your own.' },
    ],
    privacyTitle: 'Privacy first',
    privacyBody: 'Your health data is only visible to you and is never shared with third parties.',
    cycle: {
      title: "Let's learn your cycle",
      subtitle: 'Mark the days of your period for as many past months as you remember.',
      calendarTitle: 'When did your periods start and end?',
      calendarHelp: 'Tap the first day, then the last day to fill the range. Use the arrows to go back month by month.',
      daysMarked: (n) => (n === 0 ? 'No days marked yet.' : `${n} day${n === 1 ? '' : 's'} marked.`),
      avgTitle: 'Average cycle length',
      avgHelp: 'Days from the start of one period to the next',
      avgFromHistory: (n, cycles) => `Calculated from ${cycles} cycle${cycles === 1 ? '' : 's'} in your history: about ${n} days.`,
      unsureTitle: "I don't remember",
      unsureHelp: 'You can continue and add periods later in Period History.',
      unsureCheck: "I don't remember my last periods yet",
      needData: 'Mark at least one period, or check "I don\'t remember" to continue.',
    },
    prefs: {
      title: 'Customize your experience',
      subtitle: 'Tell us about your preferences so we can tailor recommendations.',
      training: 'Preferred training styles',
      food: 'Dietary focus',
      trainingOptions: { yoga: 'Yoga & Pilates', strength: 'Strength', hiit: 'HIIT', run: 'Running' },
      foodOptions: { balanced: 'Balanced', veg: 'Vegetarian', keto: 'Keto / Low carb', paleo: 'Paleo' },
    },
    profile: {
      title: 'Finalize your profile',
      subtitle: "Let's make this space yours.",
      changePhoto: 'Tap to change photo',
      displayName: 'Display name',
      namePlaceholder: 'Enter your name',
      goal: 'Goal statement (optional)',
      goalPlaceholder: 'e.g. I want to feel more energetic during my luteal phase...',
    },
  },
};

const es: OnboardingText = {
  archetype: {
    title: 'Bienvenida. Personalicemos tu experiencia.',
    subtitle: 'Unas preguntas rápidas para que la app se ajuste a tus metas y a tu cuerpo. Puedes cambiar tus respuestas cuando quieras.',
    privacy: 'Tus respuestas solo se usan para personalizar las recomendaciones.',
    questionOf: (n, total) => `Pregunta ${n} de ${total}`,
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Guardar y continuar',
    saving: 'Guardando...',
    chooseOne: 'Elige una opción',
    chooseAny: 'Elige todas las que apliquen',
    questions: {
      goal: { title: '¿Qué quieres lograr con CycleSync?', hint: 'Esto define tu perfil principal.' },
      regularity: { title: '¿Cómo describirías tus reglas?', hint: 'Una idea aproximada basta. Tu historial registrado la irá afinando.' },
      contraception: { title: '¿Usas anticoncepción hormonal?', hint: 'Cambia qué tan confiables son las estimaciones del ciclo y la ovulación.' },
      symptoms: { title: '¿Qué síntomas te molestan más?', hint: 'Destacaremos consejos para ellos.' },
      activity: { title: '¿Qué tan activa eres ahora?', hint: 'Sirve para sugerir la intensidad del entrenamiento.' },
    },
    options: {
      goal_performance: { label: 'Entrenar en sintonía con mi ciclo', description: 'Dar más cuando tengo energía y recuperarme cuando baja.' },
      goal_pmos: { label: 'Manejar el SOP/PMOS o ciclos irregulares', description: 'Equilibrio hormonal, sensibilidad a la insulina y alivio de síntomas con constancia de bajo impacto.' },
      goal_fertility: { label: 'Quedar embarazada', description: 'Seguir tu ventana fértil y tu ovulación para planear la concepción.' },
      goal_wellness: { label: 'Entender mi ciclo', description: 'Conocer tu patrón, registrar síntomas y sentir más control.' },
      reg_regular: { label: 'Regulares', description: 'Duran más o menos lo mismo cada mes.' },
      reg_irregular: { label: 'Irregulares', description: 'Varían mucho o a veces me salto meses.' },
      reg_unsure: { label: 'No estoy segura', description: 'No les he llevado registro.' },
      reg_none: { label: 'Casi nunca o nunca me llega' },
      con_none: { label: 'No' },
      con_pill: { label: 'Pastillas anticonceptivas' },
      con_iud: { label: 'DIU hormonal' },
      con_other: { label: 'Implante, inyección o parche' },
      con_nonhormonal: { label: 'No hormonal (DIU de cobre, condón...)' },
      sym_cramps: { label: 'Cólicos' },
      sym_fatigue: { label: 'Cansancio' },
      sym_mood: { label: 'Cambios de humor' },
      sym_bloating: { label: 'Hinchazón' },
      sym_acne: { label: 'Acné' },
      sym_headache: { label: 'Dolores de cabeza' },
      sym_sleep: { label: 'Mal sueño' },
      sym_cravings: { label: 'Antojos' },
      sym_hair: { label: 'Cambios en el cabello' },
      act_low: { label: 'Sedentaria casi siempre', description: '0 a 1 entrenamientos por semana.' },
      act_moderate: { label: 'Moderadamente activa', description: '2 a 3 entrenamientos por semana.' },
      act_high: { label: 'Muy activa', description: '4 o más entrenamientos por semana.' },
    },
    notes: {
      hormonalContraception: 'Con anticoncepción hormonal normalmente no hay ovulación natural, así que las estimaciones de ovulación no aplican en tu caso.',
      irregular: 'Con ciclos irregulares las estimaciones tienen un margen mayor. Mientras más historial agregues, mejores serán.',
    },
  },
  setup: {
    stepOf: (step, total, name) => `Paso ${step} de ${total}: ${name}`,
    stepNames: { cycle: 'Tu ciclo', preferences: 'Preferencias', profile: 'Perfil' },
    percentComplete: (n) => `${n}% completado`,
    back: 'Atrás',
    next: 'Siguiente paso',
    complete: 'Finalizar configuración',
    saving: 'Guardando...',
    needLogin: 'Inicia sesión para guardar tu configuración.',
    saveError: 'No se pudo guardar tu configuración. Inténtalo de nuevo.',
    whyWeAsk: 'Por qué lo preguntamos',
    why: [
      { title: 'Aprender tu ciclo', body: 'Mientras más reglas pasadas agregues, mejor estimamos la duración de tu ciclo, tu próxima regla y tu ovulación. Con unos pocos meses basta para empezar.' },
      { title: 'Ajustar tu plan', body: 'Combinamos actividades y comidas con tu energía en cada fase. Yoga durante la menstruación y entrenamiento intenso cerca de la ovulación.' },
      { title: 'Personalizar tu espacio', body: 'Nos ayuda a dirigirnos a ti correctamente y hace que el panel se sienta tuyo.' },
    ],
    privacyTitle: 'Tu privacidad primero',
    privacyBody: 'Tus datos de salud solo los ves tú y nunca se comparten con terceros.',
    cycle: {
      title: 'Conozcamos tu ciclo',
      subtitle: 'Marca los días de tu regla de todos los meses pasados que recuerdes.',
      calendarTitle: '¿Cuándo empezaron y terminaron tus reglas?',
      calendarHelp: 'Toca el primer día y luego el último para marcar el rango. Usa las flechas para retroceder mes a mes.',
      daysMarked: (n) => (n === 0 ? 'Aún no has marcado días.' : `${n} ${n === 1 ? 'día marcado' : 'días marcados'}.`),
      avgTitle: 'Duración promedio del ciclo',
      avgHelp: 'Días desde el inicio de una regla hasta el inicio de la siguiente',
      avgFromHistory: (n, cycles) => `Calculado con ${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'} de tu historial: unos ${n} días.`,
      unsureTitle: 'No lo recuerdo',
      unsureHelp: 'Puedes continuar y agregar tus reglas después en Historial de períodos.',
      unsureCheck: 'Todavía no recuerdo mis últimas reglas',
      needData: 'Marca al menos una regla o activa "No lo recuerdo" para continuar.',
    },
    prefs: {
      title: 'Personaliza tu experiencia',
      subtitle: 'Cuéntanos tus preferencias para ajustar las recomendaciones.',
      training: 'Estilos de entrenamiento preferidos',
      food: 'Enfoque de alimentación',
      trainingOptions: { yoga: 'Yoga y Pilates', strength: 'Fuerza', hiit: 'HIIT', run: 'Correr' },
      foodOptions: { balanced: 'Balanceada', veg: 'Vegetariana', keto: 'Keto / Baja en carbohidratos', paleo: 'Paleo' },
    },
    profile: {
      title: 'Termina tu perfil',
      subtitle: 'Hagamos este espacio tuyo.',
      changePhoto: 'Toca para cambiar la foto',
      displayName: 'Nombre para mostrar',
      namePlaceholder: 'Escribe tu nombre',
      goal: 'Tu meta (opcional)',
      goalPlaceholder: 'Ej. Quiero sentirme con más energía en mi fase lútea...',
    },
  },
};

export const onboardingText: Record<Language, OnboardingText> = { en, es };
