// Ideas to reach a high protein and water target without getting bored.
// Pure data and functions so they can be tested.
import { FOOD_DATABASE, type FoodItem } from '@/data/nutritionFoods';
import type { ProteinMealPlan } from './targets';

export interface ProteinEquivalent {
  food: FoodItem;
  /** Grams of this food that give one meal's protein, rounded to 5 g. */
  grams: number;
}

/**
 * Foods that alone can cover one meal's protein, with the amount needed.
 * Only lean sources (protein gives at least 40% of their calories) and
 * amounts that fit on a plate (<= 350 g).
 */
export function proteinEquivalents(perMealGrams: number): ProteinEquivalent[] {
  if (!(perMealGrams > 0)) return [];
  return FOOD_DATABASE
    .filter((f) => f.protein >= 8 && f.calories > 0 && (f.protein * 4) / f.calories >= 0.4)
    .map((food) => ({ food, grams: Math.max(5, Math.round(((perMealGrams / food.protein) * 100) / 5) * 5) }))
    .filter((e) => e.grams <= 350)
    .sort((a, b) => a.grams - b.grams);
}

export interface WaterMoment {
  time: string;
  label: string;
  glasses: number;
}

/**
 * Spreads the day's glasses over the meal plan: one on waking (30 min before
 * the first meal), the rest split between meals, front-loaded so the evening
 * stays light.
 */
export function waterSchedule(plan: ProteinMealPlan, totalGlasses: number): WaterMoment[] {
  const total = Math.max(0, Math.round(totalGlasses));
  if (total === 0 || plan.slots.length === 0) return [];
  const first = plan.slots[0].time;
  const [h, m] = first.split(':').map(Number);
  const wakeMin = ((h * 60 + m - 30) + 24 * 60) % (24 * 60);
  const wake = `${String(Math.floor(wakeMin / 60)).padStart(2, '0')}:${String(wakeMin % 60).padStart(2, '0')}`;
  const moments: WaterMoment[] = [{ time: wake, label: 'Al despertar', glasses: 1 }];
  const rest = total - 1;
  const n = plan.slots.length;
  plan.slots.forEach((slot, i) => {
    const share = Math.floor(rest / n) + (i < rest % n ? 1 : 0);
    if (share > 0) moments.push({ time: slot.time, label: `Con ${slot.label.toLowerCase()} y después`, glasses: share });
  });
  return moments;
}

export interface IdeaGroup {
  title: string;
  icon: string;
  items: string[];
}

/** Rotating meal ideas so the same protein does not repeat all week. */
export const PROTEIN_MEAL_IDEAS: IdeaGroup[] = [
  {
    title: 'Desayunos',
    icon: 'light_mode',
    items: [
      'Huevos revueltos con espinaca y queso fresco, con una tortilla de maíz',
      'Yogur griego natural con frutos rojos, nueces y chía',
      'Omelette de claras y un huevo entero con champiñones y pimiento',
      'Avena cocida en leche con un yogur griego encima',
      'Tostada integral con requesón o cottage, tomate y orégano',
    ],
  },
  {
    title: 'Comidas y cenas',
    icon: 'restaurant',
    items: [
      'Tacos de pollo deshebrado con pico de gallo y aguacate',
      'Salmón al horno con limón y verduras asadas',
      'Bowl de atún, arroz integral, pepino, edamame y ajonjolí',
      'Tofu salteado con brócoli, jengibre y salsa de soya',
      'Ternera magra con nopales o calabacitas y frijoles',
      'Sopa de lentejas con pollo o huevo cocido encima',
      'Camarones al ajillo con ensalada y quinoa',
    ],
  },
  {
    title: 'Meriendas',
    icon: 'favorite',
    items: [
      'Cottage o requesón con fruta picada y canela',
      'Pepino relleno de atún con limón',
      'Edamame con sal de mar',
      'Licuado de leche o bebida de soya con yogur griego y fresas',
      'Dos huevos cocidos con jitomate y sal de ajo',
      'Hummus con palitos de zanahoria y un yogur griego',
    ],
  },
];

/** Practical tricks for a larger protein target. */
export const PROTEIN_TRICKS: IdeaGroup[] = [
  {
    title: 'Que no se sienta como una tarea',
    icon: 'lightbulb',
    items: [
      'Come la proteína y las verduras primero y el carbohidrato al final: la glucosa sube menos y te llenas antes.',
      'Rota al menos 5 proteínas distintas por semana: pollo, pescado, huevo, lácteos y una vegetal.',
      'Cambia la forma, no solo el alimento: el mismo pollo sirve en tacos, en sopa, en ensalada o deshebrado.',
      'Ten tres marinados base: limón, ajo y comino; yogur con chipotle; soya con jengibre.',
    ],
  },
  {
    title: 'Si te cuesta comer tanto',
    icon: 'bowl_food',
    items: [
      'Elige fuentes densas que dan mucha proteína en poco volumen: pechuga, atún, claras, yogur griego y cottage.',
      'Las bebidas también cuentan: un licuado de leche con yogur griego puede dar 20 a 30 g.',
      'Sube poco a poco: 10 g más por semana es suficiente. No hace falta llegar a la meta el primer día.',
      'Cocina en lote dos proteínas el domingo y guárdalas listas para armar platos en minutos.',
    ],
  },
];

/** Ideas to drink more water without forcing it. */
export const WATER_TRICKS: IdeaGroup[] = [
  {
    title: 'Con sabor y sin azúcar',
    icon: 'drop',
    items: [
      'Agua con pepino y menta, o con limón y jengibre',
      'Agua de jamaica o de canela, sin azúcar o con un toque de stevia',
      'Fresas con albahaca, o naranja con romero, en una jarra en el refrigerador',
      'Agua mineral con gas y una rodaja de limón',
      'Tés de hierbas fríos o calientes: también cuentan',
    ],
  },
  {
    title: 'Hábitos que lo hacen fácil',
    icon: 'schedule',
    items: [
      'Ten una botella de 1 L a la vista y márcale horas. Rellenarla es más fácil que contar vasos.',
      'Un vaso antes de cada comida ayuda a sentir saciedad antes.',
      'Cerca de una quinta parte del agua viene de la comida: sopas, caldos, pepino, sandía y fruta.',
      'Bebe más si hace calor, si haces ejercicio o si tu orina sale oscura. Amarillo claro es la meta.',
      'Deja el último vaso unas dos horas antes de dormir para no despertarte de noche.',
    ],
  },
];
