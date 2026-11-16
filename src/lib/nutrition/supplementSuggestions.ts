// General, non-medical nutrient suggestions based on the foods the user likes or avoids
// and her daily habits. Amounts are approximate (USDA / NIH reference values) and meant as
// orientation, not prescription. Pure functions so they can be tested.
import {
  foodLabel,
  getCatalogFood,
  recipeHasFood,
  type FoodPreferences,
} from './foodPreferences';

type Lang = 'es' | 'en';
type Text = { es: string; en: string };

export type NutrientId = 'omega3' | 'vitaminD' | 'iron' | 'b12' | 'calcium' | 'magnesium';

export interface FoodSwap {
  id: string;
  name: string;
  /** How much of this food gives how much of the nutrient. */
  amount: string;
}

export interface NutrientSuggestion {
  id: NutrientId;
  nutrient: string;
  priority: 'high' | 'medium';
  reason: string;
  /** Daily reference amount for the nutrient. */
  target: string;
  /** What an avoided food gives, so she can see what she is replacing. */
  replaces?: string;
  /** Foods to try first, never including anything the user avoids. */
  foods: FoodSwap[];
  /** How the alternatives compare with the usual source, in plain amounts. */
  equivalence?: string;
  /** Short practical tip, optional. */
  tip?: string;
  supplement: string;
}

interface NutrientDef {
  id: NutrientId;
  name: Text;
  target: Text;
  /** Catalog ids that provide the nutrient, best first. */
  sources: string[];
  /** Foods that can be suggested when she does not eat any source. Defaults to `sources`. */
  suggest?: string[];
  /** Amount of nutrient per portion, for every food in `suggest`/`sources`. */
  amounts: Record<string, Text>;
  /** What a portion of an avoided source gives. */
  ofAvoided?: Record<string, Text>;
  equivalence?: Text;
  tip?: Text;
  supplement: Text;
}

const DEFS: Record<NutrientId, NutrientDef> = {
  omega3: {
    id: 'omega3',
    name: { es: 'Omega-3', en: 'Omega-3' },
    target: {
      es: 'Referencia: unos 250 a 500 mg de EPA+DHA al día (2 porciones de pescado graso por semana) y al menos 1,1 g de ALA al día.',
      en: 'Reference: about 250 to 500 mg of EPA+DHA a day (2 servings of oily fish a week) and at least 1.1 g of ALA a day.',
    },
    sources: ['pescado', 'chia', 'linaza', 'nueces'],
    suggest: ['chia', 'linaza', 'nueces'],
    amounts: {
      pescado: { es: '100 g de salmón o sardinas (un filete del tamaño de la palma, o 4 sardinas pequeñas) ≈ 1,5 a 2 g de EPA+DHA', en: '100 g of salmon or sardines (a palm-sized fillet, or 4 small sardines) ≈ 1.5 to 2 g of EPA+DHA' },
      chia: { es: '1 cucharada sopera (12 g) ≈ 2 g de ALA', en: '1 tablespoon (12 g) ≈ 2 g of ALA' },
      linaza: { es: '1 cucharada molida (10 g) ≈ 2,3 g de ALA', en: '1 tablespoon ground (10 g) ≈ 2.3 g of ALA' },
      nueces: { es: 'Un puñado (30 g, unas 7 mitades o 1/4 de taza) ≈ 2,5 g de ALA', en: 'A handful (30 g, about 7 halves) ≈ 2.5 g of ALA' },
    },
    ofAvoided: {
      pescado: {
        es: '100 g de pescado graso por semana aportan unos 285 mg de EPA+DHA al día en promedio, dentro de la referencia.',
        en: '100 g of oily fish a week gives about 285 mg of EPA+DHA a day on average, within the reference.',
      },
    },
    equivalence: {
      es: 'No hay equivalencia gramo a gramo: el cuerpo convierte solo un 5 a 10% del ALA en EPA y menos de 5% en DHA. Para llegar a esos ~285 mg de EPA+DHA diarios solo con plantas harían falta unos 3 a 6 g de ALA, es decir 2 a 3 cucharadas de chía o de linaza molida al día. Si eso no te resulta, el aceite de algas es la forma práctica de igualar al pescado.',
      en: 'There is no gram-for-gram swap: the body converts only 5 to 10% of ALA into EPA and under 5% into DHA. Getting that ~285 mg of EPA+DHA a day from plants alone takes about 3 to 6 g of ALA, which is 2 to 3 tablespoons of chia or ground flax a day. If that is not realistic, algae oil is the practical way to match fish.',
    },
    supplement: {
      es: 'Aceite de algas (da DHA y EPA sin pescado), con 250 a 500 mg de EPA+DHA por día en la etiqueta. También sirve aceite de pescado purificado.',
      en: 'Algae oil (gives DHA and EPA without fish), with 250 to 500 mg of EPA+DHA a day on the label. Purified fish oil also works.',
    },
  },
  vitaminD: {
    id: 'vitaminD',
    name: { es: 'Vitamina D', en: 'Vitamin D' },
    target: {
      es: 'Referencia: 600 UI (15 µg) al día. No pases de 4000 UI al día sin supervisión médica.',
      en: 'Reference: 600 IU (15 µg) a day. Do not go above 4000 IU a day without medical supervision.',
    },
    sources: ['pescado', 'huevo', 'champinones'],
    suggest: ['huevo', 'champinones', 'pescado', 'yogur'],
    amounts: {
      pescado: { es: '100 g de salmón (un filete del tamaño de la palma) ≈ 400 a 600 UI', en: '100 g of salmon (a palm-sized fillet) ≈ 400 to 600 IU' },
      huevo: { es: '1 huevo ≈ 40 UI (muy poco)', en: '1 egg ≈ 40 IU (very little)' },
      champinones: { es: '100 g de champiñones (1 taza y media laminados) con luz UV o sol ≈ 400 UI (los comunes, solo 10 UI)', en: '100 g of mushrooms (1.5 cups sliced) UV- or sun-exposed ≈ 400 IU (regular ones, only 10 IU)' },
      yogur: { es: '1 pote (200 g, unos 3/4 de taza) fortificado ≈ 100 UI', en: '1 tub (200 g, about 3/4 cup) fortified ≈ 100 IU' },
    },
    equivalence: {
      es: 'Con comida casi no se llega: harían falta unos 15 huevos al día para cubrir 600 UI. Lo práctico es sol más suplemento.',
      en: 'Food alone rarely gets there: it would take about 15 eggs a day to reach 600 IU. Sun plus a supplement is the practical route.',
    },
    tip: {
      es: 'La fuente principal es el sol: unos 15 a 20 minutos con brazos y piernas al aire libre varios días a la semana.',
      en: 'The main source is sunlight: about 15 to 20 minutes with arms and legs outdoors several days a week.',
    },
    supplement: {
      es: 'Vitamina D3, de 1000 UI al día es una dosis común de mantenimiento, tomada con una comida que tenga grasa. Lo ideal es medir la 25-OH vitamina D en sangre para ajustarla.',
      en: 'Vitamin D3, 1000 IU a day is a common maintenance dose, taken with a meal that has some fat. Ideally measure 25-OH vitamin D in blood to adjust it.',
    },
  },
  iron: {
    id: 'iron',
    name: { es: 'Hierro', en: 'Iron' },
    target: {
      es: 'Referencia: 18 mg al día (mujeres de 19 a 50 años). Si no comes carne, calcula casi el doble porque el hierro vegetal se absorbe menos.',
      en: 'Reference: 18 mg a day (women 19 to 50). If you eat no meat, plan for nearly double because plant iron is absorbed less.',
    },
    sources: ['res', 'lentejas', 'garbanzos', 'frijoles', 'espinaca', 'tofu', 'mariscos'],
    amounts: {
      res: { es: '100 g de carne de res (del tamaño de la palma y 1 cm de grosor) ≈ 2,6 mg (hierro hemo, el que mejor se absorbe)', en: '100 g of beef (palm-sized, 1 cm thick) ≈ 2.6 mg (heme iron, absorbed best)' },
      lentejas: { es: '1 taza cocida (200 g) ≈ 6,6 mg', en: '1 cup cooked (200 g) ≈ 6.6 mg' },
      garbanzos: { es: '1 taza cocida (165 g) ≈ 4,7 mg', en: '1 cup cooked (165 g) ≈ 4.7 mg' },
      frijoles: { es: '1 taza cocida (170 g) ≈ 3,6 mg', en: '1 cup cooked (170 g) ≈ 3.6 mg' },
      espinaca: { es: '1 taza cocida (180 g) ≈ 6 mg, pero se absorbe poco', en: '1 cup cooked (180 g) ≈ 6 mg, but poorly absorbed' },
      tofu: { es: '100 g firme (un trozo como una baraja, algo menos de 1/2 taza en cubos) ≈ 2 a 3 mg', en: '100 g firm (a deck-of-cards piece, a bit under 1/2 cup cubed) ≈ 2 to 3 mg' },
      mariscos: { es: '100 g de mejillones (unos 10 medianos, 1/2 taza sin concha) ≈ 6 mg', en: '100 g of mussels (about 10 medium, 1/2 cup shelled) ≈ 6 mg' },
    },
    ofAvoided: {
      res: { es: '100 g de carne de res aportan 2,6 mg de hierro que se absorbe bien.', en: '100 g of beef gives 2.6 mg of well-absorbed iron.' },
    },
    equivalence: {
      es: 'Para reemplazar 100 g de carne de res calcula 1 a 1,5 tazas de lentejas cocidas con limón, naranja o tomate, porque el hierro vegetal se absorbe unas 2 a 5 veces menos.',
      en: 'To replace 100 g of beef plan on 1 to 1.5 cups of cooked lentils with lemon, orange or tomato, since plant iron is absorbed about 2 to 5 times less.',
    },
    tip: {
      es: 'Combínalo con vitamina C y evita té o café junto a la comida, porque reducen la absorción. Importa más en los días de sangrado.',
      en: 'Pair it with vitamin C and avoid tea or coffee with the meal, since they reduce absorption. It matters most on bleeding days.',
    },
    supplement: {
      es: 'Solo con un análisis de ferritina que lo justifique. Tomar hierro de más hace daño, así que no lo uses a ciegas.',
      en: 'Only if a ferritin test supports it. Too much iron is harmful, so do not take it blindly.',
    },
  },
  b12: {
    id: 'b12',
    name: { es: 'Vitamina B12', en: 'Vitamin B12' },
    target: { es: 'Referencia: 2,4 µg al día.', en: 'Reference: 2.4 µg a day.' },
    sources: ['pollo', 'res', 'cerdo', 'pescado', 'mariscos', 'huevo', 'yogur', 'queso'],
    suggest: ['huevo', 'yogur', 'queso'],
    amounts: {
      huevo: { es: '1 huevo ≈ 0,6 µg', en: '1 egg ≈ 0.6 µg' },
      yogur: { es: '1 pote (200 g, unos 3/4 de taza) ≈ 1 µg', en: '1 tub (200 g, about 3/4 cup) ≈ 1 µg' },
      queso: { es: '30 g (1 rebanada o un cubo de 3 cm) ≈ 0,4 µg', en: '30 g (1 slice or a 3 cm cube) ≈ 0.4 µg' },
    },
    equivalence: {
      es: 'Para cubrir el día: 2 huevos, 1 pote de yogur (3/4 de taza) y 30 g de queso (1 rebanada) suman unos 2,6 µg.',
      en: 'To cover the day: 2 eggs, 1 tub of yogurt (3/4 cup) and 30 g of cheese (1 slice) add up to about 2.6 µg.',
    },
    tip: {
      es: 'Casi solo está en alimentos de origen animal. Si comes poco de ellos, busca productos fortificados con B12.',
      en: 'It is found almost only in animal foods. If you eat few of them, look for B12-fortified products.',
    },
    supplement: {
      es: 'B12 (cianocobalamina o metilcobalamina), de 25 a 100 µg al día. Es segura y suele hacer falta si no comes productos animales.',
      en: 'B12 (cyanocobalamin or methylcobalamin), 25 to 100 µg a day. It is safe and usually needed if you eat no animal products.',
    },
  },
  calcium: {
    id: 'calcium',
    name: { es: 'Calcio', en: 'Calcium' },
    target: { es: 'Referencia: 1000 mg al día (19 a 50 años).', en: 'Reference: 1000 mg a day (19 to 50).' },
    sources: ['yogur', 'queso', 'tofu', 'almendras', 'kale', 'brocoli', 'chia'],
    amounts: {
      yogur: { es: '1 pote (200 g, unos 3/4 de taza) ≈ 250 mg', en: '1 tub (200 g, about 3/4 cup) ≈ 250 mg' },
      queso: { es: '30 g de queso duro (1 rebanada o un cubo de 3 cm) ≈ 200 mg (fresco ≈ 100 mg)', en: '30 g of hard cheese (1 slice or a 3 cm cube) ≈ 200 mg (fresh ≈ 100 mg)' },
      tofu: { es: '100 g con sulfato de calcio (un trozo como una baraja, algo menos de 1/2 taza en cubos) ≈ 350 mg', en: '100 g calcium-set (a deck-of-cards piece, a bit under 1/2 cup cubed) ≈ 350 mg' },
      almendras: { es: '30 g (un puñado, unas 23 almendras) ≈ 75 mg', en: '30 g (a handful, about 23 almonds) ≈ 75 mg' },
      kale: { es: '1 taza cocida ≈ 180 mg', en: '1 cup cooked ≈ 180 mg' },
      brocoli: { es: '1 taza cocida ≈ 60 mg', en: '1 cup cooked ≈ 60 mg' },
      chia: { es: '2 cucharadas soperas (25 g) ≈ 140 mg', en: '2 tablespoons (25 g) ≈ 140 mg' },
    },
    equivalence: {
      es: 'Un pote de yogur (250 mg) equivale a unos 70 g de tofu con calcio (1/3 de taza en cubos) o a 1,5 tazas de kale cocido.',
      en: 'A tub of yogurt (250 mg) equals about 70 g of calcium-set tofu (1/3 cup cubed) or 1.5 cups of cooked kale.',
    },
    tip: {
      es: 'Mejor desde la comida. El tofu con sulfato de calcio, el kale y el brócoli se absorben bien.',
      en: 'Better from food. Calcium-set tofu, kale and broccoli are absorbed well.',
    },
    supplement: {
      es: 'Calcio en dosis de 500 mg o menos por toma, con comida, solo si los alimentos no llegan.',
      en: 'Calcium in doses of 500 mg or less at a time, with food, only if food does not get you there.',
    },
  },
  magnesium: {
    id: 'magnesium',
    name: { es: 'Magnesio', en: 'Magnesium' },
    target: { es: 'Referencia: 310 a 320 mg al día (mujeres adultas).', en: 'Reference: 310 to 320 mg a day (adult women).' },
    sources: ['almendras', 'semillas-calabaza', 'cacao', 'espinaca', 'aguacate', 'lentejas', 'garbanzos', 'frijoles', 'avena', 'banano'],
    amounts: {
      almendras: { es: '30 g (un puñado, unas 23 almendras) ≈ 80 mg', en: '30 g (a handful, about 23 almonds) ≈ 80 mg' },
      'semillas-calabaza': { es: '30 g (3 cucharadas soperas) ≈ 150 mg', en: '30 g (3 tablespoons) ≈ 150 mg' },
      cacao: { es: '30 g de chocolate negro 70% (unos 3 cuadritos) ≈ 65 mg', en: '30 g of 70% dark chocolate (about 3 squares) ≈ 65 mg' },
      espinaca: { es: '1 taza cocida ≈ 160 mg', en: '1 cup cooked ≈ 160 mg' },
      aguacate: { es: '1 mediano ≈ 58 mg', en: '1 medium ≈ 58 mg' },
      lentejas: { es: '1 taza cocida ≈ 70 mg', en: '1 cup cooked ≈ 70 mg' },
      garbanzos: { es: '1 taza cocida ≈ 80 mg', en: '1 cup cooked ≈ 80 mg' },
      frijoles: { es: '1 taza cocida ≈ 120 mg', en: '1 cup cooked ≈ 120 mg' },
      avena: { es: '40 g (1/2 taza de hojuelas) ≈ 55 mg', en: '40 g (1/2 cup of flakes) ≈ 55 mg' },
      banano: { es: '1 mediano ≈ 32 mg', en: '1 medium ≈ 32 mg' },
    },
    equivalence: {
      es: 'Un puñado de semillas de calabaza (30 g, 3 cucharadas) cubre casi la mitad del día.',
      en: 'A handful of pumpkin seeds (30 g, 3 tablespoons) covers almost half of the day.',
    },
    tip: {
      es: 'Participa en el sueño, los calambres y los síntomas premenstruales, y muchas dietas se quedan cortas.',
      en: 'It plays a part in sleep, cramps and premenstrual symptoms, and many diets fall short.',
    },
    supplement: {
      es: 'Magnesio glicinato o citrato, de 200 a 350 mg de magnesio elemental, de noche. El óxido cae peor al estómago.',
      en: 'Magnesium glycinate or citrate, 200 to 350 mg of elemental magnesium, in the evening. The oxide form is harder on the stomach.',
    },
  },
};

/** Rough kitchen measures so grams are easy to eyeball. */
export const MEASURE_GUIDE: Text = {
  es: 'Medidas caseras: 1 cucharadita ≈ 5 ml, 1 cucharada sopera ≈ 15 ml, 1 taza ≈ 240 ml. A ojo: la palma de la mano (sin dedos) ≈ 100 g de carne o pescado, un puño cerrado ≈ 1 taza de arroz o fruta, un puñado ≈ 30 g de frutos secos, la punta del pulgar ≈ 1 cucharadita.',
  en: 'Kitchen measures: 1 teaspoon ≈ 5 ml, 1 tablespoon ≈ 15 ml, 1 cup ≈ 240 ml. By eye: the palm of your hand (without fingers) ≈ 100 g of meat or fish, a closed fist ≈ 1 cup of rice or fruit, a handful ≈ 30 g of nuts, the tip of your thumb ≈ 1 teaspoon.',
};

export const SUPPLEMENT_DISCLAIMER: Text = {
  es: 'Son sugerencias generales con cantidades aproximadas, no consejo médico. Antes de tomar un suplemento consulta con un profesional, sobre todo si estás embarazada, lactando, tomas medicación o tienes una condición de salud.',
  en: 'These are general suggestions with approximate amounts, not medical advice. Before taking a supplement talk to a professional, especially if you are pregnant, breastfeeding, on medication or have a health condition.',
};

/** True when an entry (catalog id or free text such as "salmón") counts as the catalog food `foodId`. */
function entryIs(entry: string, foodId: string): boolean {
  if (entry === foodId) return true;
  if (getCatalogFood(entry)) return false;
  return recipeHasFood({ title: entry, ingredients: [] }, foodId);
}

const anyEntryIs = (entries: string[], foodId: string) => entries.some((e) => entryIs(e, foodId));

/** Minimum liked foods before we judge gaps from the diet alone. */
export const MIN_LIKES_FOR_DIET_GAPS = 3;

/**
 * Suggestions for nutrients that look short. A nutrient is flagged when she eats none of its
 * sources and either picked enough foods to judge, or avoids one of its main sources.
 */
export function getSupplementSuggestions(prefs: FoodPreferences, language: Lang): NutrientSuggestion[] {
  const enoughFoods = prefs.likes.length >= MIN_LIKES_FOR_DIET_GAPS;
  const out: NutrientSuggestion[] = [];
  const name = (id: string) => foodLabel(id, language);

  for (const def of Object.values(DEFS)) {
    const eatsSource = def.sources.some((s) => anyEntryIs(prefs.likes, s));
    const avoidedSources = def.sources.filter((s) => anyEntryIs(prefs.avoid, s));
    const allowed = (def.suggest ?? def.sources).filter((s) => !anyEntryIs(prefs.avoid, s));
    const foods: FoodSwap[] = allowed
      .filter((s) => !prefs.likes.some((l) => l === s))
      .filter((s) => def.amounts[s])
      .slice(0, 4)
      .map((s) => ({ id: s, name: name(s), amount: def.amounts[s][language] }));

    let priority: 'high' | 'medium' | null = null;
    let reason = '';
    const tr = (es: string, en: string) => (language === 'es' ? es : en);

    if (def.id === 'vitaminD') {
      const sedentary = prefs.activity === 'sedentary';
      if (prefs.sun === 'rarely') {
        priority = 'high';
        reason = tr(
          'Casi no te da el sol, y el sol es la fuente principal de vitamina D. Es una carencia muy común en quien pasa el día en interiores.',
          'You rarely get sun, and sunlight is the main source of vitamin D. Low levels are very common in people who spend the day indoors.'
        );
      } else if (prefs.sun === 'sometimes' && (sedentary || (enoughFoods && !eatsSource))) {
        priority = 'medium';
        reason = sedentary
          ? tr(
            'Te da el sol solo a veces y te mueves poco, así que probablemente pasas mucho tiempo bajo techo.',
            'You get sun only sometimes and move little, so you probably spend a lot of time indoors.'
          )
          : tr(
            'Te da el sol solo a veces y tus alimentos casi no aportan vitamina D.',
            'You get sun only sometimes and your foods add almost no vitamin D.'
          );
      } else if (prefs.sun === 'daily' && sedentary && enoughFoods && !eatsSource) {
        priority = 'medium';
        reason = tr(
          'Aunque te da el sol, tus alimentos casi no aportan vitamina D. Si el sol es con ropa y a horas de poca radiación, puede no alcanzar.',
          'Even with some sun, your foods add almost no vitamin D. If the sun is through clothing or at low-UV hours it may not be enough.'
        );
      }
    } else if (!eatsSource && (enoughFoods || avoidedSources.length > 0)) {
      const avoidedNames = avoidedSources.map(name).join(', ');
      priority = def.id === 'b12' || (def.id === 'omega3' && avoidedSources.includes('pescado')) ? 'high' : 'medium';
      if (def.id === 'omega3' && avoidedSources.includes('pescado')) {
        reason = tr(
          'No te gusta el pescado, que es la fuente principal de omega-3 (EPA y DHA), un nutriente antiinflamatorio útil en PMOS y dolor menstrual.',
          'You do not like fish, the main source of omega-3 (EPA and DHA), an anti-inflammatory nutrient useful in PCOS and period pain.'
        );
      } else if (avoidedSources.length > 0) {
        reason = tr(
          `Evitas ${avoidedNames}, que son fuentes de ${def.name.es.toLowerCase()}, y no marcaste otras.`,
          `You avoid ${avoidedNames}, which are sources of ${def.name.en.toLowerCase()}, and did not pick others.`
        );
      } else {
        reason = tr(
          `Entre los alimentos que elegiste no hay buenas fuentes de ${def.name.es.toLowerCase()}.`,
          `Among the foods you picked there are no good sources of ${def.name.en.toLowerCase()}.`
        );
      }
    }

    if (!priority) continue;
    const replacedId = avoidedSources.find((s) => def.ofAvoided?.[s]);
    out.push({
      id: def.id,
      nutrient: def.name[language],
      priority,
      reason,
      target: def.target[language],
      replaces: replacedId ? def.ofAvoided![replacedId][language] : undefined,
      foods,
      equivalence: def.equivalence?.[language],
      tip: def.tip?.[language],
      supplement: def.supplement[language],
    });
  }

  return out.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1));
}
