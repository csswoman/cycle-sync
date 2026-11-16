// How to get more nutrition out of dishes the user already loves: portion, quality and upgrades.
// Amounts are approximate. Pure data and functions so they can be tested.
import { foodLabel, getCatalogFood, recipeHasFood } from './foodPreferences';

type Lang = 'es' | 'en';
type Text = { es: string; en: string };

/** solid: good base as is. tweak: good with a few changes. occasional: better as a treat. */
export type DishQuality = 'solid' | 'tweak' | 'occasional';

export const DISH_QUALITY_LABELS: Record<DishQuality, Text> = {
  solid: { es: 'Buena base', en: 'Good base' },
  tweak: { es: 'Mejora con ajustes', en: 'Better with tweaks' },
  occasional: { es: 'Mejor ocasional', en: 'Best occasionally' },
};

interface DishTipDef {
  quality: DishQuality;
  /** Honest take on how nutritious the dish is as usually made. */
  summary: Text;
  /** Portion advice in concrete amounts. */
  portion: Text;
  /** Concrete changes that raise protein or fiber, or lower refined carbs and frying. */
  upgrades: Text[];
}

export interface DishTip {
  id: string;
  name: string;
  quality: DishQuality;
  qualityLabel: string;
  summary: string;
  portion: string;
  upgrades: string[];
}

const TIPS: Record<string, DishTipDef> = {
  arepa: {
    quality: 'tweak',
    summary: {
      es: 'La harina de maíz precocida sacia y no tiene gluten, pero es casi puro almidón refinado y aporta poca proteína: una arepa mediana trae unos 4 g de proteína y unos 40 g de carbohidratos.',
      en: 'Pre-cooked corn flour is filling and gluten free, but it is mostly refined starch with little protein: a medium arepa has about 4 g of protein and about 40 g of carbs.',
    },
    portion: {
      es: 'Una arepa delgada (1 cm de grosor, 10 a 12 cm de diámetro) con 100 a 120 g de relleno proteico (unos 3/4 de taza) rinde más que 2 arepas gruesas con poco relleno.',
      en: 'One thin arepa (1 cm thick, 10 to 12 cm wide) with 100 to 120 g of a protein filling (about 3/4 cup) does more for you than 2 thick arepas with little filling.',
    },
    upgrades: [
      { es: 'Hazla más delgada: menos masa es menos carbohidrato por arepa y deja más lugar al relleno.', en: 'Make it thinner: less dough means fewer carbs per arepa and more room for filling.' },
      { es: 'Mezcla la masa con avena molida, harina de maíz integral o 1 cucharada de linaza molida para subir la fibra.', en: 'Mix the dough with ground oats, whole corn flour or 1 tablespoon of ground flax to raise the fiber.' },
      { es: 'Rellena con proteína: pollo desmechado, carne mechada magra, huevo, queso fresco o caraotas negras. 100 g de pollo desmechado (unos 3/4 de taza) aportan unos 25 g de proteína.', en: 'Fill it with protein: shredded chicken, lean shredded beef, egg, fresh cheese or black beans. 100 g of shredded chicken (about 3/4 cup) gives about 25 g of protein.' },
      { es: 'Cocínala en budare o al horno con poco aceite en lugar de freírla.', en: 'Cook it on a griddle or in the oven with little oil instead of frying.' },
      { es: 'Súmale aguacate o ensalada: la fibra y la grasa buena hacen que la glucosa suba más despacio.', en: 'Add avocado or salad: fiber and good fat make glucose rise more slowly.' },
    ],
  },
  cachapa: {
    quality: 'tweak',
    summary: {
      es: 'El maíz tierno aporta fibra y es naturalmente dulce, pero casi toda la proteína sale del queso. Una cachapa con mucha mantequilla o azúcar añadida se vuelve pesada y alta en azúcares.',
      en: 'Fresh corn adds fiber and is naturally sweet, but most of the protein comes from the cheese. A cachapa with lots of butter or added sugar gets heavy and high in sugars.',
    },
    portion: {
      es: '1 cachapa mediana en lugar de 2, con 100 g de queso fresco o pollo (3/4 de taza desmenuzado) y una ensalada al lado.',
      en: '1 medium cachapa instead of 2, with 100 g of fresh cheese or chicken (3/4 cup crumbled) and a salad on the side.',
    },
    upgrades: [
      { es: 'Prepara la masa sin azúcar añadida: el maíz ya es dulce.', en: 'Make the batter without added sugar: the corn is already sweet.' },
      { es: 'Cambia parte del queso graso por queso fresco y agrega pollo desmechado o huevo para llegar a 25 a 30 g de proteína.', en: 'Swap part of the fatty cheese for fresh cheese and add shredded chicken or egg to reach 25 to 30 g of protein.' },
      { es: 'Usa poco aceite en la plancha.', en: 'Use little oil on the griddle.' },
    ],
  },
  empanada: {
    quality: 'occasional',
    summary: {
      es: 'La masa de harina de maíz frita suma mucha grasa y carbohidrato refinado. El relleno de carne o queso aporta proteína, pero la fritura pesa más.',
      en: 'The fried corn dough adds a lot of fat and refined carbs. The meat or cheese filling gives protein, but the frying outweighs it.',
    },
    portion: {
      es: '1 o 2 empanadas con una ensalada grande, en lugar de 3 o 4 como comida completa.',
      en: '1 or 2 empanadas with a big salad, instead of 3 or 4 as a full meal.',
    },
    upgrades: [
      { es: 'Hornéalas o hazlas en la freidora de aire: se ahorran muchas calorías de aceite.', en: 'Bake them or use an air fryer: it saves many calories of oil.' },
      { es: 'Rellena con pollo, carne molida magra, caraotas o queso fresco, con más relleno y menos masa.', en: 'Fill with chicken, lean ground beef, beans or fresh cheese, with more filling and less dough.' },
      { es: 'Acompáñalas con ensalada o aguacate en vez de refresco.', en: 'Serve them with salad or avocado instead of soda.' },
    ],
  },
  tequenos: {
    quality: 'occasional',
    summary: {
      es: 'Masa de trigo frita con queso: mucha grasa y harina refinada. Son un gusto, no una comida.',
      en: 'Fried wheat dough with cheese: lots of fat and refined flour. They are a treat, not a meal.',
    },
    portion: {
      es: '3 o 4 tequeños en lugar de 8, después de una porción de proteína o ensalada para llegar con menos hambre.',
      en: '3 or 4 tequeños instead of 8, after a protein portion or salad so you arrive less hungry.',
    },
    upgrades: [
      { es: 'Hornéalos o hazlos en la freidora de aire.', en: 'Bake them or use an air fryer.' },
      { es: 'Cámbiale la salsa azucarada por una de aguacate o yogur con limón.', en: 'Swap the sugary dip for avocado or yogurt with lemon.' },
    ],
  },
  patacon: {
    quality: 'tweak',
    summary: {
      es: 'El plátano verde tiene almidón resistente que sienta bien al azúcar en sangre, pero frito absorbe mucho aceite. El relleno es lo que le da proteína.',
      en: 'Green plantain has resistant starch that is kind to blood sugar, but fried it soaks up a lot of oil. The filling is what adds protein.',
    },
    portion: {
      es: '1 patacón con 100 g de pollo o carne mechada (3/4 de taza) y ensalada, en lugar de 2 patacones con poco relleno.',
      en: '1 patacón with 100 g of chicken or shredded beef (3/4 cup) and salad, instead of 2 patacones with little filling.',
    },
    upgrades: [
      { es: 'Aplástalo y hornéalo o hazlo en la freidora de aire con un chorrito de aceite.', en: 'Flatten and bake it or use an air fryer with a drizzle of oil.' },
      { es: 'Dobla el relleno proteico y agrega repollo o aguacate.', en: 'Double the protein filling and add cabbage or avocado.' },
    ],
  },
  pabellon: {
    quality: 'solid',
    summary: {
      es: 'Es un plato muy completo: carne mechada y caraotas dan proteína y fibra. Lo que más conviene vigilar es la cantidad de arroz y el aceite de las tajadas fritas.',
      en: 'A very complete dish: shredded beef and black beans give protein and fiber. What to watch is the amount of rice and the oil in the fried plantain.',
    },
    portion: {
      es: '1/2 taza de arroz (100 g cocido) en lugar de 1 o 2 tazas, con ración completa de carne (100 a 120 g, del tamaño de la palma) y 1/2 taza de caraotas.',
      en: '1/2 cup of rice (100 g cooked) instead of 1 or 2 cups, with a full portion of beef (100 to 120 g, palm-sized) and 1/2 cup of beans.',
    },
    upgrades: [
      { es: 'Haz las tajadas al horno o a la plancha.', en: 'Bake or griddle the plantain slices.' },
      { es: 'Cambia el arroz blanco por integral o por mitad arroz y mitad ensalada.', en: 'Swap white rice for brown, or half rice and half salad.' },
      { es: 'Dobla las caraotas y suma una ensalada: más fibra y más saciedad.', en: 'Double the beans and add a salad: more fiber and more fullness.' },
    ],
  },
  taco: {
    quality: 'tweak',
    summary: {
      es: 'La tortilla de maíz es una buena base. El problema suele ser comer muchas tortillas con poco relleno, que sube los carbohidratos y deja poca proteína.',
      en: 'The corn tortilla is a good base. The usual problem is eating many tortillas with little filling, which raises carbs and leaves little protein.',
    },
    portion: {
      es: '2 tacos con el doble de relleno (80 a 100 g de proteína en cada uno, unos 1/2 taza) en lugar de 3 con poco: casi la misma saciedad, un tercio menos de tortilla y unos 35 g de proteína.',
      en: '2 tacos with double filling (80 to 100 g of protein in each, about 1/2 cup) instead of 3 with little: nearly the same fullness, a third less tortilla and about 35 g of protein.',
    },
    upgrades: [
      { es: 'Elige tortilla de maíz en lugar de harina de trigo.', en: 'Choose corn tortillas over wheat-flour ones.' },
      { es: 'Rellena con pollo, res magra o pescado a la plancha, y pide frijoles en vez de más tortilla.', en: 'Fill with chicken, lean beef or grilled fish, and have beans instead of more tortilla.' },
      { es: 'Agrega repollo, pico de gallo y aguacate para fibra, y limón en lugar de crema.', en: 'Add cabbage, pico de gallo and avocado for fiber, and lime instead of sour cream.' },
      { es: 'Evita los tacos fritos o dorados.', en: 'Skip fried or crispy tacos.' },
    ],
  },
  pizza: {
    quality: 'tweak',
    summary: {
      es: 'Masa refinada y queso: poca fibra y proteína moderada. Se mejora mucho con la masa y los ingredientes.',
      en: 'Refined dough and cheese: little fiber and moderate protein. The dough and toppings make a big difference.',
    },
    portion: {
      es: '2 porciones de masa fina (1/4 de pizza mediana cada una) con ensalada, en lugar de 3 o 4 porciones.',
      en: '2 slices of thin crust (1/4 of a medium pizza each) with salad, instead of 3 or 4 slices.',
    },
    upgrades: [
      { es: 'Elige masa fina o integral y pide la mitad del queso con más verduras.', en: 'Choose thin or whole-wheat crust and ask for half the cheese with more vegetables.' },
      { es: 'Suma pollo, huevo o atún como proteína en vez de embutidos.', en: 'Add chicken, egg or tuna as protein instead of cured meats.' },
      { es: 'Empieza con una ensalada: llegas con menos hambre.', en: 'Start with a salad: you arrive less hungry.' },
    ],
  },
  hamburguesa: {
    quality: 'tweak',
    summary: {
      es: 'La carne aporta proteína y hierro. El pan blanco, el queso extra y las papas fritas son lo que la desbalancea.',
      en: 'The patty gives protein and iron. White bread, extra cheese and fries are what throw it off.',
    },
    portion: {
      es: '1 hamburguesa con 120 a 150 g de carne (un disco un poco más grande que la palma, de 2 cm de grosor) y ensalada o verduras al lado, en lugar de papas fritas.',
      en: '1 burger with a 120 to 150 g patty (a disc a bit larger than your palm, 2 cm thick) and salad or vegetables on the side, instead of fries.',
    },
    upgrades: [
      { es: 'Pan integral o pan de lechuga, y carne magra o de pollo.', en: 'Whole-wheat bun or lettuce wrap, and lean beef or chicken.' },
      { es: 'Agrega tomate, lechuga, cebolla y aguacate en lugar de salsas azucaradas.', en: 'Add tomato, lettuce, onion and avocado instead of sugary sauces.' },
    ],
  },
  panqueques: {
    quality: 'tweak',
    summary: {
      es: 'Con harina blanca y jarabe son casi solo carbohidratos y azúcar. Se vuelven un desayuno decente con proteína y fruta.',
      en: 'Made with white flour and syrup they are nearly all carbs and sugar. They become a decent breakfast with protein and fruit.',
    },
    portion: {
      es: '2 panqueques medianos con 150 g de yogur griego (2/3 de taza) y fruta, en lugar de 4 con jarabe.',
      en: '2 medium pancakes with 150 g of Greek yogurt (2/3 cup) and fruit, instead of 4 with syrup.',
    },
    upgrades: [
      { es: 'Haz la masa con avena molida, huevo y yogur: sube la proteína y la fibra.', en: 'Make the batter with ground oats, egg and yogurt: it raises protein and fiber.' },
      { es: 'Cubre con fruta y canela en lugar de miel o jarabe.', en: 'Top with fruit and cinnamon instead of honey or syrup.' },
    ],
  },
  pan: {
    quality: 'tweak',
    summary: {
      es: 'El pan y la pasta blancos digieren rápido y dejan poca fibra y proteína. Las versiones integrales o de legumbres mejoran eso sin cambiar el plato.',
      en: 'White bread and pasta digest fast and leave little fiber and protein. Whole-grain or legume versions improve that without changing the dish.',
    },
    portion: {
      es: '70 a 80 g de pasta seca (1 taza cocida, un puño cerrado) en lugar de 120 g o más, con la salsa y la proteína como protagonistas.',
      en: '70 to 80 g of dry pasta (about 1 cup cooked, a closed fist) instead of 120 g or more, with the sauce and protein as the stars.',
    },
    upgrades: [
      { es: 'Prueba pasta integral o de lentejas o garbanzos: duplican la proteína por porción.', en: 'Try whole-grain or lentil or chickpea pasta: they roughly double the protein per serving.' },
      { es: 'Sirve con verduras y 100 g de pollo, atún o carne magra (del tamaño de la palma).', en: 'Serve with vegetables and 100 g of chicken, tuna or lean meat (palm-sized).' },
      { es: 'Si la cocinas y la enfrías antes de recalentar, parte del almidón se vuelve resistente y sube menos la glucosa.', en: 'If you cook it and cool it before reheating, part of the starch turns resistant and glucose rises less.' },
    ],
  },
  arroz: {
    quality: 'tweak',
    summary: {
      es: 'El arroz blanco es energía rápida con poca fibra. No hace falta eliminarlo: importa la porción y con qué lo acompañas.',
      en: 'White rice is quick energy with little fiber. You do not need to cut it out: portion and pairing matter.',
    },
    portion: {
      es: '1/2 a 3/4 de taza cocida (100 a 150 g) por comida, con proteína y verduras ocupando el resto del plato.',
      en: '1/2 to 3/4 cup cooked (100 to 150 g) per meal, with protein and vegetables filling the rest of the plate.',
    },
    upgrades: [
      { es: 'Mezcla mitad arroz blanco y mitad integral, o con quinoa.', en: 'Mix half white and half brown rice, or with quinoa.' },
      { es: 'Acompáñalo con lentejas, frijoles o pollo para subir la proteína.', en: 'Pair it with lentils, beans or chicken to raise the protein.' },
    ],
  },
};

/** Catalog ids that have upgrade tips. */
export const DISH_TIP_IDS = Object.keys(TIPS);

/** The tipped dish a liked entry stands for: its catalog id, or free text that mentions a dish. */
function dishIdFor(entry: string): string | null {
  if (TIPS[entry]) return entry;
  if (getCatalogFood(entry)) return null;
  return DISH_TIP_IDS.find((id) => recipeHasFood({ title: entry, ingredients: [] }, id)) ?? null;
}

/** Upgrade tips for the dishes and staples the user likes, without repeats. */
export function getDishTips(likes: string[], language: Lang): DishTip[] {
  const ids = Array.from(new Set(likes.map(dishIdFor).filter((id): id is string => !!id)));
  return ids.map((id) => {
    const t = TIPS[id];
    return {
      id,
      name: foodLabel(id, language),
      quality: t.quality,
      qualityLabel: DISH_QUALITY_LABELS[t.quality][language],
      summary: t.summary[language],
      portion: t.portion[language],
      upgrades: t.upgrades.map((u) => u[language]),
    };
  });
}
