#!/usr/bin/env python3
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(BASE_DIR, 'src', 'data', 'catalogRecipes.json')

NEW_RECIPES = [
  {
    "title": "Red Velvet Proteica",
    "description": "Esponjoso pastel terciopelo rojo a base de harina de almendras, cacao puro y proteína aislada, cubierto con sedoso frosting sin lactosa y frutos rojos.",
    "category": "postre",
    "calories": 230,
    "protein": 20,
    "carbs": 9,
    "fat": 12,
    "ingredients": [
      "1 taza de harina de almendras",
      "1/2 taza de proteína en polvo sabor vainilla o neutra (sin lactosa)",
      "2 cucharadas de cacao amargo puro en polvo (sin azúcar)",
      "1/2 taza de puré o jugo concentrado de remolacha cocida (color natural)",
      "3 huevos enteros camperos",
      "1/3 taza de alulosa o fruto del monje (monk fruit)",
      "1/4 taza de aceite de coco derretido",
      "1/2 taza de bebida vegetal de almendras sin azúcar",
      "1 cucharadita de polvo para hornear sin gluten",
      "1 cucharadita de vinagre de manzana",
      "150g de queso crema sin lactosa o crema vegetal espesa para el frosting",
      "1/4 taza de alulosa en polvo para el frosting"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y forrar un molde para pastel con papel antiadherente.",
      "Licuar la remolacha con huevos, bebida vegetal, aceite de coco, alulosa y vinagre de manzana hasta lograr un batido rojo homogéneo.",
      "Tamizar en un bol la harina de almendras, proteína, cacao puro y polvo para hornear.",
      "Integrar los ingredientes húmedos con los secos mediante movimientos suaves y envolventes.",
      "Verter en el molde y hornear de 28 a 32 minutos hasta que un palillo salga limpio.",
      "Batir el queso crema sin lactosa con la alulosa en polvo y extracto de vainilla. Una vez frío el bizcocho, desmoldar y decorar con el frosting."
    ],
    "prepTime": 35,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/red-velvet-proteica.webp"
  },
  {
    "title": "Selva Negra Fit",
    "description": "Clásica torta Selva Negra en versión ligera: bizcochuelo esponjoso de cacao sin gluten, relleno de cerezas naturales sin azúcar y crema batida vegetal alta en proteína.",
    "category": "postre",
    "calories": 240,
    "protein": 19,
    "carbs": 14,
    "fat": 11,
    "ingredients": [
      "1 taza de harina de avena certificada sin gluten o harina de almendras",
      "1/2 taza de proteína aislada sabor chocolate",
      "3 cucharadas de cacao amargo puro 100%",
      "4 huevos camperos (claras y yemas separadas)",
      "1/3 taza de alulosa o eritritol",
      "1/3 taza de yogur de coco o yogur griego sin lactosa",
      "1 taza de cerezas frescas o congeladas sin hueso y cocidas al vapor sin azúcar",
      "1 lata de leche de coco refrigerada (solo la crema sólida superior)",
      "1 scoop de proteína aislada de vainilla para la crema",
      "30g de chocolate amargo 85% sin azúcar rallado"
    ],
    "instructions": [
      "Montar las claras a punto de nieve y reservar.",
      "Batir las yemas con la alulosa, yogur sin lactosa, harina sin gluten, proteína de chocolate y cacao.",
      "Incorporar las claras montadas con movimientos envolventes para mantener la esponjosidad.",
      "Hornear a 180°C por 25 minutos. Dejar enfriar y cortar transversalmente en 2 capas.",
      "Batir la crema de coco fría junto con la proteína de vainilla hasta punto chantilly.",
      "Rellenar y cubrir el pastel con la crema, colocar las cerezas y finalizar con virutas de chocolate amargo."
    ],
    "prepTime": 40,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/selva-negra-fit.webp"
  },
  {
    "title": "Torta de Chocolate Glaseado",
    "description": "Torta húmeda e intensa de chocolate con harina de almendras y proteína aislada, cubierta con un espejo de glaseado brillante de cacao sin lácteos ni azúcar.",
    "category": "postre",
    "calories": 260,
    "protein": 21,
    "carbs": 10,
    "fat": 15,
    "ingredients": [
      "1 y 1/4 tazas de harina de almendras",
      "1/2 taza de proteína en polvo de chocolate",
      "1/3 taza de cacao amargo holandés puro",
      "3 huevos grandes",
      "1/2 taza de alulosa",
      "1/4 taza de aceite de coco derretido",
      "1/2 taza de café caliente o infusión caliente",
      "1 cucharadita de polvo para hornear sin gluten",
      "Glaseado brillante: 80g de chocolate amargo 85% sin azúcar, 3 cucharadas de leche de coco espesa y 1 cucharada de alulosa"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y forrar molde desmontable de 18-20 cm.",
      "Mezclar harina de almendras, proteína, cacao puro, polvo de hornear y pizca de sal.",
      "Batir huevos con alulosa y aceite. Incorporar los secos alternando con el café caliente.",
      "Hornear durante 28 a 30 minutos. Dejar enfriar por completo.",
      "Fundir a baño maría el chocolate con la leche de coco y la alulosa hasta obtener un glaseado brillante y fluido.",
      "Verter el glaseado sobre la torta dejando que cubra armoniosamente los laterales."
    ],
    "prepTime": 35,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos"
    ],
    "imageUrl": "/recipes/torta-de-chocolate-glaseado.webp"
  },
  {
    "title": "Crocante de Pera",
    "description": "Peras tibias horneadas con canela y jengibre, cubiertas con un crujiente crumble proteico de almendras y avena sin gluten. Postre saciante y antiinflamatorio.",
    "category": "postre",
    "calories": 210,
    "protein": 16,
    "carbs": 22,
    "fat": 7,
    "ingredients": [
      "4 peras medianas peladas y cortadas en cubos o láminas",
      "1 cucharada de jugo de limón",
      "1 cucharadita colmada de canela de Ceilán",
      "1/2 taza de copos de avena certificados sin gluten",
      "1/3 taza de harina de almendras",
      "1/2 taza de proteína aislada sabor vainilla",
      "2 cucharadas de aceite de coco sólido",
      "3 cucharadas de alulosa o fruto del monje granulado",
      "1/4 cucharadita de nuez moscada rallada"
    ],
    "instructions": [
      "Precalentar el horno a 180°C.",
      "En una fuente para horno, mezclar las peras con el jugo de limón, media cucharadita de canela y una cucharada de alulosa.",
      "En un tazón aparte, frotar con las manos la avena sin gluten, harina de almendras, proteína, resto de canela, nuez moscada, alulosa y aceite de coco hasta obtener un crumble arenoso.",
      "Cubrir uniformemente la base de peras con el crumble.",
      "Hornear durante 25-30 minutos hasta que las peras burbujeen tiernas y la superficie esté dorada y crujiente.",
      "Servir tibio solo o con una cucharada de yogur vegetal sin azúcar."
    ],
    "prepTime": 40,
    "servings": 6,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antiinflamatorio",
      "fibra"
    ],
    "imageUrl": "/recipes/crocante-de-pera.webp"
  },
  {
    "title": "Blondie Fit",
    "description": "Blondie denso y jugoso elaborado con mantequilla de almendras, proteína de vainilla y chispas de chocolate amargo sin azúcar. Saciedad prolongada sin picos glucémicos.",
    "category": "postre",
    "calories": 195,
    "protein": 17,
    "carbs": 8,
    "fat": 11,
    "ingredients": [
      "3/4 taza de mantequilla de almendras 100% natural",
      "1/2 taza de proteína en polvo aislada de vainilla",
      "1/4 taza de harina de coco",
      "2 huevos enteros",
      "1/3 taza de alulosa o fruto del monje",
      "1/4 taza de bebida vegetal de almendras sin azúcar",
      "1 cucharadita de extracto puro de vainilla",
      "1/2 cucharadita de bicarbonato de sodio",
      "40g de chispas de chocolate amargo 80% sin azúcar"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y forrar molde cuadrado de 20x20 cm.",
      "Mezclar la mantequilla de almendras con los huevos, alulosa, vainilla y bebida vegetal.",
      "Añadir la proteína en polvo, harina de coco y bicarbonato, integrando hasta formar una masa espesa.",
      "Incorporar la mayor parte de las chispas de chocolate y extender en el molde.",
      "Decorar con las chispas restantes y hornear durante 18 a 20 minutos (mantener el centro tierno).",
      "Dejar enfriar completamente antes de cortar en porciones cuadradas."
    ],
    "prepTime": 25,
    "servings": 9,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "snack"
    ],
    "imageUrl": "/recipes/blondie-fit.webp"
  },
  {
    "title": "Carrot Cake Saludable",
    "description": "Pastel especiado de zanahoria fresca y nueces crujientes con harina de almendras y proteína vegetal, coronado con frosting cremoso sin lácteos.",
    "category": "postre",
    "calories": 225,
    "protein": 18,
    "carbs": 11,
    "fat": 12,
    "ingredients": [
      "1 y 1/2 tazas de zanahoria finamente rallada",
      "1 taza de harina de almendras",
      "1/2 taza de proteína aislada sabor vainilla",
      "3 huevos camperos",
      "1/3 taza de alulosa o eritritol",
      "1/4 taza de aceite de coco virgen",
      "1 cucharada de canela de Ceilán molida",
      "1/2 cucharadita de jengibre y pizca de nuez moscada",
      "1/3 taza de nueces pecanas picadas",
      "1 cucharadita de polvo para hornear sin gluten",
      "Frosting: 150g de queso crema sin lactosa o crema espesa de coco batida con 3 cucharadas de alulosa y vainilla"
    ],
    "instructions": [
      "Precalentar horno a 175°C y forrar molde circular para pastel.",
      "Batir los huevos con la alulosa y el aceite de coco.",
      "Sumar la harina de almendras, proteína, canela, jengibre y polvo de hornear.",
      "Plegar la zanahoria rallada y las nueces picadas con espátula.",
      "Hornear por 30 a 35 minutos hasta dorar. Enfriar sobre rejilla.",
      "Untar el frosting sin lactosa por la parte superior y decorar con trozos de nuez."
    ],
    "prepTime": 35,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/carrot-cake-saludable.webp"
  },
  {
    "title": "Torta de Canela Keto",
    "description": "Pastel esponjoso y aromático con veta central de canela y crumble especiado. Cero azúcar, bajo índice glucémico y alto contenido proteico ideal para la fase lútea.",
    "category": "postre",
    "calories": 215,
    "protein": 18,
    "carbs": 6,
    "fat": 14,
    "ingredients": [
      "1 y 1/4 tazas de harina de almendras",
      "1/2 taza de proteína aislada sin lactosa sabor neutro o vainilla",
      "3 huevos camperos",
      "1/3 taza de bebida de almendras sin azúcar",
      "1/4 taza de aceite de coco derretido",
      "1/3 taza de alulosa granulada",
      "1 cucharadita de polvo para hornear sin gluten",
      "Crumble de canela: 2 cucharadas de canela molida, 3 cucharadas de alulosa, 2 cucharadas de harina de almendras y 1 cucharada de aceite de coco"
    ],
    "instructions": [
      "Precalentar horno a 170°C y engrasar molde.",
      "Mezclar los ingredientes del crumble de canela en un tazón pequeño.",
      "En otro bol, batir los huevos con la alulosa, aceite de coco y bebida vegetal.",
      "Incorporar la harina de almendras, la proteína y el polvo de hornear.",
      "Colocar la mitad de la masa en el molde, espolvorear la mitad de la canela, agregar el resto de la masa y finalizar con el crumble.",
      "Hornear durante 28 a 30 minutos hasta que tome un tono dorado apetitoso."
    ],
    "prepTime": 30,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "fase-lutea",
      "keto"
    ],
    "imageUrl": "/recipes/torta-de-canela-keto.webp"
  },
  {
    "title": "Torta de Manzana Especiada",
    "description": "Torta húmeda y fragante con láminas de manzana fresca, canela y masa tierna sin gluten enriquecida con proteína y claras de huevo.",
    "category": "postre",
    "calories": 190,
    "protein": 16,
    "carbs": 18,
    "fat": 6,
    "ingredients": [
      "2 manzanas medianas (una rallada para la masa y otra en láminas finas)",
      "1 taza de harina de avena certificada sin gluten",
      "1/2 taza de proteína en polvo de vainilla",
      "3 claras de huevo y 1 huevo entero",
      "1/3 taza de bebida vegetal sin azúcar",
      "1/4 taza de alulosa o fruto del monje",
      "1 cucharada de aceite de oliva suave",
      "1 cucharadita colmada de canela molida",
      "1/2 cucharadita de polvo para hornear sin gluten"
    ],
    "instructions": [
      "Precalentar horno a 180°C y forrar molde de 20 cm.",
      "Mezclar la manzana rallada con los huevos, claras, alulosa, aceite y bebida vegetal.",
      "Sumar la harina de avena sin gluten, proteína, canela y polvo de hornear hasta obtener una masa uniforme.",
      "Verter en el molde y colocar las láminas de manzana en espiral sobre la superficie.",
      "Espolvorear con una pizca extra de canela y hornear durante 30 a 35 minutos hasta dorar.",
      "Dejar enfriar antes de rebanar."
    ],
    "prepTime": 40,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antiinflamatorio"
    ],
    "imageUrl": "/recipes/torta-de-manzana-especiada.webp"
  },
  {
    "title": "Paraíso Frutal de Vainilla",
    "description": "Bizcocho esponjoso aromatizado con vainilla pura y proteína aislada, cubierto con fresas, arándanos y frambuesas frescas con crema sedosa sin lactosa.",
    "category": "postre",
    "calories": 210,
    "protein": 20,
    "carbs": 13,
    "fat": 8,
    "ingredients": [
      "1 taza de harina de almendras",
      "1/2 taza de proteína aislada sabor vainilla",
      "3 huevos camperos",
      "1/3 taza de yogur griego sin lactosa o yogur de coco",
      "1/4 taza de alulosa",
      "1 cucharada de extracto de vainilla natural",
      "1 cucharadita de polvo para hornear sin gluten",
      "1 taza de frutos rojos frescos (fresas, arándanos, frambuesas)",
      "Crema: 100g de crema espesa de coco fría batida con 1 scoop de proteína de vainilla"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y preparar molde.",
      "Batir los huevos con la alulosa, yogur sin lactosa y vainilla.",
      "Añadir la harina de almendras, proteína en polvo y polvo de hornear.",
      "Hornear de 22 a 25 minutos hasta que la superficie esté dorada y elástica al tacto.",
      "Dejar enfriar completamente.",
      "Extender la crema batida de coco y proteína por encima y coronar con abundantes frutos rojos frescos."
    ],
    "prepTime": 30,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/paraiso-frutal-de-vainilla.webp"
  },
  {
    "title": "Tiramisú Keto",
    "description": "Reinvención cetogénica y sin lácteos del clásico italiano: bizcochos de almendra embebidos en espresso, suave crema de mascarpone vegetal proteica y lluvia de cacao amargo.",
    "category": "postre",
    "calories": 235,
    "protein": 18,
    "carbs": 5,
    "fat": 16,
    "ingredients": [
      "Bizcochuelos: 3 claras a nieve con 1/2 taza de harina de almendras, 1 scoop de proteína neutra y 2 cucharadas de alulosa",
      "1/2 taza de café espresso recién preparado y frío",
      "1 taza de crema espesa de coco o queso crema sin lactosa",
      "1 scoop de proteína aislada sabor vainilla",
      "3 cucharadas de alulosa en polvo",
      "2 cucharadas de cacao amargo puro 100%",
      "1 cucharadita de extracto de vainilla"
    ],
    "instructions": [
      "Hornear los bizcochitos de almendra: mezclar claras batidas con harina de almendra y proteína, hornear tiras a 180°C por 10 min.",
      "Batir la crema con la proteína de vainilla, alulosa y extracto de vainilla hasta lograr una consistencia sedosa.",
      "Pasar los bizcochitos rápidamente por el café espresso.",
      "Disponer en una fuente por capas alternadas de bizcocho embebido y crema proteica.",
      "Refrigerar durante al menos 3 horas para asentar la textura.",
      "Espolvorear con cacao puro amargo tamizado antes de servir."
    ],
    "prepTime": 25,
    "servings": 6,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "keto"
    ],
    "imageUrl": "/recipes/tiramisu-keto.webp"
  },
  {
    "title": "Tres Leches Fit",
    "description": "Bizcochuelo súper esponjoso sin gluten bañado en una mezcla de leches vegetales proteicas (almendras, coco y proteína de vainilla), coronado con merengue liviano sin azúcar.",
    "category": "postre",
    "calories": 220,
    "protein": 21,
    "carbs": 11,
    "fat": 9,
    "ingredients": [
      "4 huevos enteros (separadas claras y yemas)",
      "1/3 taza de alulosa o fruto del monje",
      "1/2 taza de harina de avena certificada sin gluten",
      "1/2 taza de harina de almendras",
      "1 scoop de proteína aislada sabor vainilla",
      "1 cucharadita de extracto de vainilla",
      "Baño de tres leches: 1 taza de bebida de almendras sin azúcar, 1/2 taza de leche de coco espesa sin azúcar, 1/2 taza de agua con 1 scoop de proteína de vainilla bien disuelta",
      "Merengue: 2 claras a nieve batidas con 3 cucharadas de alulosa y una pizca de canela"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y forrar molde refractario.",
      "Batir las claras a nieve con la mitad de la alulosa. En otro recipiente batir las yemas con el resto de alulosa y vainilla.",
      "Unir con suavidad ambas partes e incorporar las harinas y la proteína con movimientos envolventes.",
      "Hornear durante 22 a 25 minutos. Retirar y dejar entibiar.",
      "Pinchar repetidamente el bizcocho con un tenedor en toda su extensión.",
      "Licuar las tres leches vegetales proteicas y verter poco a poco sobre el bizcocho hasta que absorba todo.",
      "Decorar con merengue batido sin azúcar y un toque de canela. Refrigerar 4 horas antes de servir."
    ],
    "prepTime": 35,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos"
    ],
    "imageUrl": "/recipes/tres-leches-fit.webp"
  },
  {
    "title": "Mocha Protein Cake",
    "description": "Pastel intenso que combina el aroma del café tostado con cacao puro y alta concentración proteica, rematado con ganache brillante de café sin lácteos.",
    "category": "postre",
    "calories": 245,
    "protein": 22,
    "carbs": 9,
    "fat": 13,
    "ingredients": [
      "1 taza de harina de almendras",
      "1/2 taza de proteína aislada de chocolate o café (sin lactosa)",
      "1/4 taza de cacao puro desgrasado",
      "1 shot doble de café espresso concentrado (60 ml)",
      "3 huevos camperos",
      "1/3 taza de alulosa",
      "1/4 taza de aceite de coco derretido",
      "1 cucharadita de polvo para hornear sin gluten",
      "Ganache: 60g de chocolate amargo 85% sin azúcar, 3 cucharadas de café caliente, 2 cucharadas de leche de almendras y granos de café para decorar"
    ],
    "instructions": [
      "Precalentar horno a 175°C y forrar molde.",
      "Combinar harina de almendras, proteína, cacao puro y levadura en polvo.",
      "Batir los huevos con la alulosa, aceite de coco y el shot de café espresso.",
      "Mezclar todo hasta lograr una masa fluida chocolatosa y verter en el molde.",
      "Hornear por 25 a 28 minutos.",
      "Derretir el chocolate con el café caliente y leche vegetal hasta lograr un ganache satinado.",
      "Cubrir la torta y decorar con granos de café."
    ],
    "prepTime": 30,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "energia"
    ],
    "imageUrl": "/recipes/mocha-protein-cake.webp"
  },
  {
    "title": "Torta Trufada Proteica",
    "description": "Torta densa y sedosa estilo trufa fundente de chocolate amargo, preparada con pasta de frutos secos, proteína aislada y nibs crujientes de cacao puro.",
    "category": "postre",
    "calories": 250,
    "protein": 23,
    "carbs": 8,
    "fat": 14,
    "ingredients": [
      "100g de chocolate amargo 85% sin azúcar",
      "1/2 taza de mantequilla de almendras o avellanas pura",
      "1/2 taza de proteína en polvo aislada de chocolate",
      "3 huevos a temperatura ambiente",
      "1/4 taza de alulosa líquida o granulada",
      "1/4 taza de leche de coco espesa",
      "1 cucharadita de extracto de vainilla pura",
      "Pizca de sal marina",
      "2 cucharadas de nibs de cacao puro para decorar"
    ],
    "instructions": [
      "Precalentar horno a 160°C (temperatura suave para lograr textura de trufa fundente).",
      "Derretir el chocolate junto con la mantequilla de frutos secos a baño maría suave.",
      "Batir los huevos con la alulosa hasta duplicar su volumen y formar espuma.",
      "Añadir el chocolate fundido, leche de coco, proteína y la pizca de sal, integrando delicadamente con espátula.",
      "Verter en molde forrado y hornear a baño maría durante 22 a 25 minutos (mantener centro húmedo).",
      "Refrigerar al menos 4 horas para que tome consistencia trufada densa. Decorar con nibs de cacao."
    ],
    "prepTime": 30,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/torta-trufada-proteica.webp"
  },
  {
    "title": "Pasión de Lúcuma",
    "description": "Suave bizcocho proteico sin gluten cubierto de un cremoso mousse de pulpa de lúcuma natural y proteína de vainilla, sin lácteos ni azúcar refinada.",
    "category": "postre",
    "calories": 230,
    "protein": 20,
    "carbs": 15,
    "fat": 10,
    "ingredients": [
      "1 taza de pulpa de lúcuma fresca o harina de lúcuma hidratada",
      "1 taza de harina de almendras",
      "1/2 taza de proteína aislada sabor vainilla",
      "3 huevos camperos",
      "1/4 taza de alulosa",
      "1/4 taza de aceite de coco derretido",
      "1 cucharadita de polvo para hornear sin gluten",
      "Mousse de lúcuma: 1/2 taza de pulpa de lúcuma, 1/2 taza de crema espesa de coco o yogur vegetal, 1 scoop de proteína de vainilla y estevia al gusto",
      "Hilos de chocolate amargo 80% sin azúcar para decorar"
    ],
    "instructions": [
      "Precalentar el horno a 175°C y preparar molde.",
      "Batir huevos con alulosa y aceite de coco.",
      "Integrar la harina de almendras, proteína, lúcuma y polvo de hornear.",
      "Hornear durante 25 a 28 minutos hasta que dore. Dejar enfriar.",
      "Licuar los ingredientes del mousse de lúcuma hasta lograr una textura cremosa y firme.",
      "Esparcir el mousse sobre el bizcocho y decorar con hilos de chocolate amargo."
    ],
    "prepTime": 35,
    "servings": 8,
    "tags": [
      "sin-gluten",
      "sin-lactosa",
      "sin-azucar",
      "alta-proteina",
      "postre-fit",
      "pmos",
      "antioxidante"
    ],
    "imageUrl": "/recipes/pasion-de-lucuma.webp"
  }
]

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

existing_titles = {r['title'].lower() for r in catalog}

added_count = 0
for nr in NEW_RECIPES:
    if nr['title'].lower() in existing_titles:
        print(f"[-] '{nr['title']}' ya existe en el catálogo, actualizando datos...")
        for i, item in enumerate(catalog):
            if item['title'].lower() == nr['title'].lower():
                catalog[i] = nr
                break
    else:
        catalog.append(nr)
        existing_titles.add(nr['title'].lower())
        added_count += 1
        print(f"[+] Agregada: '{nr['title']}'")

with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\nListo: {added_count} recetas nuevas agregadas al catálogo ({len(catalog)} total).")
