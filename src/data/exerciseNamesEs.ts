// Spanish names for the exercises recommended per phase (phaseExercises.json); the source dataset is English only.
const NAMES_ES: Record<string, string> = {
  '1363': 'Estiramiento de columna',
  '2571': 'Estiramiento de rana balanceándose',
  '1494': 'Postura de mariposa',
  '3639': 'Torsión acostada con rodillas flexionadas',
  '3147': 'Inclinación pélvica',
  '0690': 'Estiramiento lumbar sentada',
  '1685': 'Sentadilla con alcance sobre la cabeza',
  '3013': 'Puente de glúteo bajo en el suelo',
  '3470': 'Zancada hacia adelante',
  '3211': 'Flexión de brazos de rodillas',
  '0276': 'Bicho muerto',
  '1373': 'Elevación de talones de pie',
  '0514': 'Sentadilla con salto',
  '3582': 'Zancada con salto',
  '0662': 'Flexión de brazos',
  '0630': 'Escalador',
  '3223': 'Salto de estrella',
  '0687': 'Giro ruso',
  '3769': 'Sentadilla reverencia',
  '3645': 'Puente a una pierna con pierna extendida',
  '0710': 'Abducción lateral de cadera',
  '0624': 'Marcha sentada (en pared)',
  '3672': 'Paso adelante y atrás',
  '1604': 'El mejor estiramiento del mundo',
};

// shortcut: unmapped exercises keep their English name minus the "(male)" tag, add them to NAMES_ES when they enter a phase list.
export const exerciseNameEs = (ex: { id: string; name: string }): string =>
  NAMES_ES[ex.id] ?? ex.name.replace(/\s*\((male|female)\)/i, '');
