import exerciseMapJson from './exerciseNamesEsMap.json';

const NAMES_ES: Record<string, string> = exerciseMapJson as Record<string, string>;

/** English translations for curated program exercises whose source dataset is in Spanish. */
const PROGRAM_NAMES_EN: Record<string, string> = {
  'Abduccion de Cadera': 'Hip Abduction',
  'Aducción de Cadera': 'Hip Adduction',
  'Alpinista (Mountain Climbers)': 'Mountain Climbers',
  'Aperturas con Mancuernas': 'Dumbbell Chest Fly',
  'Aperturas en Máquina (Pec Deck)': 'Pec Deck Machine Fly',
  'Bicho Muerto': 'Dead Bug',
  'Burpees': 'Burpees',
  'Circulos de Brazo': 'Arm Circles',
  'Cruce de Cables': 'Cable Crossover',
  'Crunch Abdominal': 'Abdominal Crunch',
  'Crunch Cruzado': 'Cross Body Crunch',
  'Crunch Inverso': 'Reverse Crunch',
  'Crunch Oblicuo': 'Oblique Crunch',
  'Crunch de Pie con Cable': 'Standing Cable Crunch',
  'Crunch en Banco Declinado': 'Decline Bench Crunch',
  'Crunch en Máquina': 'Machine Crunch',
  'Curl Femoral': 'Lying Hamstring Curl',
  'Curl Martillo con Mancuerna': 'Dumbbell Hammer Curl',
  'Curl Zottman': 'Zottman Curl',
  'Curl de Bíceps con Barra': 'Barbell Bicep Curl',
  'Curl de Bíceps con Mancuernas': 'Dumbbell Bicep Curl',
  'Curl de Bíceps en Polea a Un Brazo': 'Single-Arm Cable Bicep Curl',
  'Curl de Concentración': 'Concentration Curl',
  'Curl de Predicador': 'Preacher Curl',
  'Dominadas': 'Pull-Ups',
  'Dominadas Asistidas': 'Assisted Pull-Ups',
  'Elevación Frontal con Banda Elástica': 'Resistance Band Front Raise',
  'Elevación Lateral con Mancuerna': 'Dumbbell Lateral Raise',
  'Elevación Piernas Silla del Capitán': "Captain's Chair Leg Raise",
  'Elevación de Cadera con Barra': 'Barbell Hip Thrust',
  'Elevación de Glúteos e Isquiotibiales': 'Glute-Ham Raise',
  'Elevación de Pantorrilla a Una Pierna en Hack': 'Single-Leg Hack Calf Raise',
  'Elevación de Pantorrilla con Banda Elástica': 'Resistance Band Calf Raise',
  'Elevación de Pantorrillas Sentado en Máquina': 'Seated Machine Calf Raise',
  'Elevación de Pantorrillas de Pie': 'Standing Calf Raise',
  'Elevación de Pantorrillas en Máquina Hack': 'Hack Machine Calf Raise',
  'Elevación de Pantorrillas en Prensa': 'Leg Press Calf Raise',
  'Elevación de Pantorrillas tipo Burro': 'Donkey Calf Raise',
  'Elevación de Piernas': 'Lying Leg Raise',
  'Elevación de Piernas Sentado': 'Seated Leg Raise',
  'Empuje de Tríceps en Polea': 'Cable Tricep Pushdown',
  'Encogimiento de Hombros con Barra': 'Barbell Shrug',
  'Escaladores de Montana': 'Mountain Climbers',
  'Estiramiento de Cuello': 'Neck Stretch',
  'Estiramiento de Hombros': 'Shoulder Stretch',
  'Estiramiento de Isquiotibiales': 'Hamstring Stretch',
  'Extensión de Piernas con Banda Elástica': 'Band Leg Extension',
  'Extensión de Piernas en Máquina': 'Leg Extension Machine',
  'Extensión de Tríceps en Polea': 'Cable Triceps Extension',
  'Extensión de Tríceps en Polea a Un Brazo': 'Single-Arm Cable Triceps Extension',
  'Extensión sobre Cabeza con Cuerda': 'Overhead Cable Rope Extension',
  'Flexiones de Pecho': 'Push-Ups',
  'Flexión Declinada': 'Decline Push-Up',
  'Flexión Diamante': 'Diamond Push-Up',
  'Flexión Inclinada': 'Incline Push-Up',
  'Flexión Lateral con Mancuerna': 'Dumbbell Side Bend',
  'Flexión Lateral de Pie': 'Standing Side Bend',
  'Flexión de Brazos': 'Push-Ups',
  'Flexión de Pared': 'Wall Push-Up',
  'Flexión de Rodillas': 'Kneeling Push-Up',
  'Flutter Kick (Aleteo de Piernas)': 'Flutter Kicks',
  'Fondos de Tríceps': 'Tricep Dips',
  'Fondos en Banco': 'Bench Dips',
  'Fondos en Paralelas': 'Parallel Bar Dips',
  'JM Press con Barra': 'Barbell JM Press',
  'Jalon Tras Nuca': 'Behind-the-Neck Pulldown',
  'Jalon al Pecho': 'Lat Pulldown',
  'Jalon con Brazos Rectos': 'Straight-Arm Cable Pulldown',
  'Jumping Jacks': 'Jumping Jacks',
  'Patada de Glúteo': 'Glute Kickback',
  'Patada de Glúteo en Máquina': 'Machine Glute Kickback',
  'Patada de Glúteo en Polea': 'Cable Glute Kickback',
  'Patada de Tijera': 'Scissor Kicks',
  'Patada de Tríceps con Mancuerna': 'Dumbbell Tricep Kickback',
  'Peso Muerto Rumano con Barra': 'Barbell Romanian Deadlift',
  'Peso Muerto Rumano con Mancuernas': 'Dumbbell Romanian Deadlift',
  'Peso Muerto a Una Pierna': 'Single-Leg Deadlift',
  'Peso Muerto con Piernas Rigidas': 'Stiff-Leg Deadlift',
  'Plancha Frontal': 'Front Plank',
  'Plancha Lateral': 'Side Plank',
  'Prensa de Piernas': 'Leg Press',
  'Press Inclinado con Barra': 'Incline Barbell Bench Press',
  'Press Militar de Pie con Barra': 'Standing Barbell Military Press',
  'Press con Mancuernas': 'Dumbbell Press',
  'Press de Banca Plano con Mancuernas': 'Flat Dumbbell Bench Press',
  'Press de Banca con Barra': 'Barbell Bench Press',
  'Press de Hombros con Banda Elástica': 'Band Shoulder Press',
  'Press de Hombros con Mancuerna': 'Dumbbell Shoulder Press',
  'Press de Hombros de Pie con Mancuernas': 'Standing Dumbbell Shoulder Press',
  'Puente de Glúteos': 'Glute Bridge',
  'Puente de Glúteos a Una Pierna': 'Single-Leg Glute Bridge',
  'Pullover con Mancuernas': 'Dumbbell Pullover',
  'Remo Inclinado': 'Bent-Over Row',
  'Remo Sentado con Banda Elástica': 'Seated Band Row',
  'Remo Sentado con Cable': 'Seated Cable Row',
  'Remo con Barra Inclinado': 'Barbell Bent-Over Row',
  'Remo con Mancuerna': 'Dumbbell Row',
  'Rodillo Abdominal de Pie': 'Standing Ab Wheel Rollout',
  'Rotación Torácica de Espalda': 'Thoracic Spine Rotation',
  'Rotación de Espalda': 'Spine Rotation',
  'Rueda Abdominal': 'Ab Wheel Rollout',
  'Saltar la Cuerda': 'Jump Rope',
  'Sentadilla Bulgara': 'Bulgarian Split Squat',
  'Sentadilla Búlgara': 'Bulgarian Split Squat',
  'Sentadilla Goblet con Kettlebell': 'Kettlebell Goblet Squat',
  'Sentadilla Hack en Máquina': 'Hack Squat Machine',
  'Sentadilla Isométrica': 'Wall Sit / Isometric Squat',
  'Sentadilla Sumo con Mancuerna': 'Dumbbell Sumo Squat',
  'Sentadilla Sumo con Mancuernas': 'Dumbbell Sumo Squat',
  'Sentadilla Unilateral con Pierna Elevada': 'Elevated Single-Leg Squat',
  'Sentadilla con Banda Elástica': 'Band Squat',
  'Sentadilla con Barra': 'Barbell Squat',
  'Sentadilla con Salto': 'Jump Squat',
  'Step-Up en Banco': 'Bench Step-Up',
  'Superman': 'Superman',
  'Toque de Talones': 'Heel Touches',
  'Zancada Estatica': 'Static Lunge',
  'Zancada Lateral': 'Side Lunge',
  'Zancada con Mancuernas': 'Dumbbell Lunge',
  'Zancada con Salto': 'Jumping Lunge',
};

/** Formats English name cleanly by removing redundant gender tags like (male)/(female). */
export const cleanEnglishExerciseName = (name: string): string =>
  name.replace(/\s*\((male|female)\)/gi, '').trim();

/**
 * Returns the Spanish name for an exercise from the dataset or routine.
 */
export const exerciseNameEs = (ex: { id?: string; name: string; nameEs?: string }): string => {
  if (ex.nameEs) return ex.nameEs;
  if (ex.id && NAMES_ES[ex.id]) return NAMES_ES[ex.id];
  return cleanEnglishExerciseName(ex.name);
};

/**
 * Returns the English name for an exercise.
 */
export const exerciseNameEn = (ex: { id?: string; name: string; nameEs?: string; nameEn?: string }): string => {
  if (ex.nameEn) return ex.nameEn;
  const spanishKey = ex.nameEs || ex.name;
  if (PROGRAM_NAMES_EN[spanishKey]) return PROGRAM_NAMES_EN[spanishKey];
  return cleanEnglishExerciseName(ex.name);
};

/**
 * Returns the localized name for an exercise depending on the active language.
 */
export const exerciseDisplayName = (
  ex: { id?: string; name: string; nameEs?: string; nameEn?: string },
  lang: 'es' | 'en' = 'es',
): string => (lang === 'en' ? exerciseNameEn(ex) : exerciseNameEs(ex));

/**
 * Returns the localized name for a program exercise.
 */
export const programExerciseDisplayName = (
  ex: { id?: string; name?: string; nameEs?: string; nameEn?: string },
  lang: 'es' | 'en' = 'es',
): string => {
  if (lang === 'en') {
    if (ex.nameEn) return ex.nameEn;
    const key = ex.nameEs || ex.name || '';
    if (PROGRAM_NAMES_EN[key]) return PROGRAM_NAMES_EN[key];
    return ex.name || ex.nameEs || '';
  }
  return ex.nameEs || ex.name || '';
};
