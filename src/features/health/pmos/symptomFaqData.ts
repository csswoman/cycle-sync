export interface SummarizedFAQ {
  cause: { es: string; en: string };
  tips: { es: string[]; en: string[] };
  doctor: { es: string; en: string };
}

export interface SymptomConfig {
  key: string;
  name: { es: string; en: string };
  tagline: { es: string; en: string };
  icon: string;
  color: string;
  accentBg: string;
  accentBorder: string;
  levels: {
    es: [string, string, string, string];
    en: [string, string, string, string];
  };
  faqSummary: SummarizedFAQ;
}

export const PMOS_SYMPTOM_CONFIGS: Record<string, SymptomConfig> = {
  acne: {
    key: 'acne',
    name: {
      es: 'Acné hormonal',
      en: 'Hormonal Acne',
    },
    tagline: {
      es: 'Seborrea y poros obstruidos',
      en: 'Excess sebum & clogged pores',
    },
    icon: 'face_retouching_off',
    color: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/30',
    levels: {
      es: ['Ninguno', 'Leve', 'Moderado', 'Severo'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'Andrógenos elevados aumentan la grasa facial; la resistencia a la insulina sube el IGF-1 obstruyendo poros e inflamando la piel.',
        en: 'Elevated androgens boost sebum production; insulin resistance spikes IGF-1, clogging pores and causing inflammation.',
      },
      tips: {
        es: [
          'Dieta de bajo índice glucémico y proteína en cada comida.',
          'Mio-inositol (2-4 g/día), Zinc (15-30 mg) y Omega-3.',
          'Limpieza suave no comedogénica, sin frotar ni usar alcohol.',
        ],
        en: [
          'Low-glycemic meals with adequate protein to steady insulin.',
          'Myo-inositol (2-4 g/day), Zinc (15-30 mg), and Omega-3.',
          'Gentle non-comedogenic cleansing twice daily without scrubs.',
        ],
      },
      doctor: {
        es: 'Acné quístico doloroso o si no mejora tras 8-12 semanas de hábitos.',
        en: 'Deep painful cysts or failure to improve after 8-12 weeks.',
      },
    },
  },

  fatigue: {
    key: 'fatigue',
    name: {
      es: 'Fatiga y baja energía',
      en: 'Fatigue & Low Energy',
    },
    tagline: {
      es: 'Agotamiento celular y bajones',
      en: 'Cellular fatigue & energy crashes',
    },
    icon: 'battery_1_bar',
    color: 'text-amber-500',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    levels: {
      es: ['Ninguna', 'Leve', 'Moderada', 'Severa'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'La resistencia a la insulina frena el ingreso de glucosa a las células (bajones de energía), sumada a cortisol alterado y sueño poco reparador.',
        en: 'Insulin resistance blocks optimal glucose uptake for ATP energy, compounded by altered cortisol and shallow sleep.',
      },
      tips: {
        es: [
          'Desayuno salado con 25-30 g de proteína antes del café.',
          'Luz solar matutina (10 min) y caminatas suaves tras comer.',
          'Magnesio glicinato (200-400 mg) por la noche para descanso profundo.',
        ],
        en: [
          'Savory breakfast with 25-30g protein before morning coffee.',
          '10 min morning sunlight and light post-meal walks.',
          'Magnesium glycinate (200-400 mg) before bed for deep sleep.',
        ],
      },
      doctor: {
        es: 'Cansancio extremo constante; pide análisis de tiroides (TSH/T3/T4) y ferritina.',
        en: 'Persistent exhaustion; request full thyroid panel (TSH) and ferritin bloodwork.',
      },
    },
  },

  hirsutism: {
    key: 'hirsutism',
    name: {
      es: 'Hirsutismo (Vello corporal)',
      en: 'Hirsutism (Excess Hair)',
    },
    tagline: {
      es: 'Vello grueso en zonas androgénicas',
      en: 'Coarse hair in androgenic zones',
    },
    icon: 'dermatology',
    color: 'text-orange-500',
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/30',
    levels: {
      es: ['Ninguno', 'Leve', 'Moderado', 'Severo'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'La enzima 5-alfa reductasa convierte testosterona en DHT, transformando el vello fino en pelo terminal oscuro (mentón, patillas, abdomen).',
        en: '5-alpha reductase converts testosterone to DHT, converting fine vellus hair into dark coarse terminal hair.',
      },
      tips: {
        es: [
          'Té de menta verde / hierbabuena (spearmint): 2 tazas al día.',
          'Entrenamiento de fuerza regular para elevar la SHBG.',
          'Láser médico o electrólisis para eliminar folículos ya formados.',
        ],
        en: [
          'Organic spearmint tea: 2 cups daily to lower free testosterone.',
          'Progressive resistance training to improve insulin & SHBG.',
          'Medical laser or electrolysis to remove established terminal hair.',
        ],
      },
      doctor: {
        es: 'Aparición repentina y acelerada, o si notas cambios en el tono de voz.',
        en: 'Sudden rapid hair growth or voice deepening.',
      },
    },
  },

  hair_loss: {
    key: 'hair_loss',
    name: {
      es: 'Caída de cabello (Alopecia)',
      en: 'Hair Loss & Thinning',
    },
    tagline: {
      es: 'Pérdida en coronilla o raya media',
      en: 'Thinning at crown or central part',
    },
    icon: 'sentiment_dissatisfied',
    color: 'text-purple-500',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/30',
    levels: {
      es: ['Ninguna', 'Leve', 'Moderada', 'Severa'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'La DHT miniaturiza los folículos del cuero cabelludo, acortando su fase de crecimiento y afinando el cabello progresivamente.',
        en: 'Scalp DHT miniaturizes follicles, shortening the anagen growth cycle and thinning hair shafts.',
      },
      tips: {
        es: [
          'Ferritina en sangre óptima (>50-70 ng/ml) y suficiente proteína.',
          'Inhibidores botánicos como Saw Palmetto y Zinc.',
          'Masaje capilar suave con aceite de romero diluido.',
        ],
        en: [
          'Ensure optimal ferritin levels (>50-70 ng/ml) and protein.',
          'Botanical saw palmetto and zinc to modulate 5-alpha reductase.',
          'Scalp massage with diluted rosemary essential oil.',
        ],
      },
      doctor: {
        es: 'Ensanchamiento visible de la raya o caída masiva continua por más de 6 semanas.',
        en: 'Visible part widening or heavy shedding persisting over 6 weeks.',
      },
    },
  },

  mood_swings: {
    key: 'mood_swings',
    name: {
      es: 'Cambios de humor y ansiedad',
      en: 'Mood Swings & Anxiety',
    },
    tagline: {
      es: 'Irritabilidad y sensibilidad al estrés',
      en: 'Irritability & stress sensitivity',
    },
    icon: 'mood_bad',
    color: 'text-sky-500',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/30',
    levels: {
      es: ['Ninguno', 'Leves', 'Moderados', 'Severos'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'La falta de progesterona en ciclos irregulares reduce el neurotransmisor calmante GABA, aumentando la reactividad emocional y la ansiedad.',
        en: 'Low luteal progesterone reduces calming allopregnanolone/GABA, leaving the nervous system susceptible to anxiety & mood shifts.',
      },
      tips: {
        es: [
          'Mio-inositol para modular receptores de serotonina y dopamina.',
          'Magnesio bisglicinato (300 mg) para calmar el sistema nervioso.',
          'Respiración diafragmática 4-7-8 y evitar café en ayunas.',
        ],
        en: [
          'Myo-inositol to support serotonin and dopamine signaling.',
          'Magnesium bisglycinate (300 mg) to ease neuromuscular tension.',
          '4-7-8 diaphragmatic breathwork; avoid fasting coffee.',
        ],
      },
      doctor: {
        es: 'Episodios frecuentes de pánico o tristeza persistente por más de 2 semanas.',
        en: 'Recurring panic episodes or persistent sadness lasting over 2 weeks.',
      },
    },
  },

  bloating: {
    key: 'bloating',
    name: {
      es: 'Hinchazón y distensión',
      en: 'Bloating & Distension',
    },
    tagline: {
      es: 'Pesadez y retención de líquidos',
      en: 'Abdominal fullness & water retention',
    },
    icon: 'water_drop',
    color: 'text-teal-500',
    accentBg: 'bg-teal-500/10',
    accentBorder: 'border-teal-500/30',
    levels: {
      es: ['Ninguna', 'Leve', 'Moderada', 'Severa'],
      en: ['None', 'Mild', 'Moderate', 'Severe'],
    },
    faqSummary: {
      cause: {
        es: 'Disbiosis intestinal ligada a la insulina y variaciones de estrógenos que retienen agua y ralentizan el tránsito digestivo.',
        en: 'Gut dysbiosis linked to insulin resistance and estrogen shifts that cause fluid retention and slow motility.',
      },
      tips: {
        es: [
          'Caminar 10-15 min tras las comidas para reactivar el peristaltismo.',
          'Infusiones digestivas de jengibre, hinojo o menta piperita.',
          'Masticar despacio y limitar edulcorantes polioles (eritritol, maltitol).',
        ],
        en: [
          '10-15 min walk post-meals to stimulate natural gut motility.',
          'Digestive ginger, fennel, or peppermint herbal teas.',
          'Chew food thoroughly and reduce polyol sweeteners.',
        ],
      },
      doctor: {
        es: 'Dolor punzante agudo o estreñimiento/diarrea de más de 4 días seguidos.',
        en: 'Sharp localized pain or severe bowel irregularity lasting over 4 days.',
      },
    },
  },
};
