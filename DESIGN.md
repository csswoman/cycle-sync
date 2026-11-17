---
name: CycleSync
description: Un jardín que florece al ritmo del ciclo, cálido y cuidado, nunca clínico.
colors:
  background: "#fbf3ea"
  card: "#fffbf4"
  muted: "#f1eedf"
  border: "#ebe2d3"
  border-emphasized: "#8f8169"
  text-primary: "#2b2620"
  text-secondary: "#6b6357"
  primary: "#c2306a"
  on-primary: "#ffffff"
  blossom-soft: "#f8c9da"
  leaf: "#356d22"
  leaf-soft: "#e3ecc9"
  leaf-fresh: "#7cb356"
  coral: "#d4482c"
  sun: "#f2a93b"
  sun-ink: "#8a5300"
  bud: "#a3224a"
  petal: "#f08bb0"
  blush: "#fde6ee"
  peach: "#fbd2bd"
  sage: "#b9d0ae"
  moss: "#24491a"
  luteal: "#a8461f"
typography:
  heading:
    fontFamily: "Instrument Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.025em"
  subheading:
    fontFamily: "Instrument Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Instrument Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontWeight: 400
rounded:
  inner: "0.625rem"
  element: "1rem"
  container: "1.5rem"
  page: "2rem"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.container}"
---

# Design System: CycleSync

## Overview

**Creative North Star: "El jardín que florece"**

El ciclo se vive como las estaciones de una flor: la fase menstrual es el capullo en reposo, la folicular el brote, la ovulación la flor abierta y la lútea el fruto que madura. La interfaz lo expresa con color de fase, ilustraciones botánicas y un fondo crema cálido. El resultado se siente cuidado y cercano, como un cuaderno de jardín donde se anota cada día.

La densidad es media y tranquila. Las superficies son suaves, con esquinas generosas y sombras cálidas difusas. El modo oscuro es un "jardín de noche": un bosque verde muy apagado (poca saturación, nunca "terminal"), una sola flor ciruela que brilla en una esquina y luciérnagas ámbar. El rosa primario resalta sobre el verde como una flor abierta de noche.

Rechazo confirmado: nada de estética médica fría (blancos clínicos, azules hospitalarios, tablas áridas).

**Key Characteristics:**
- Fondo crema cálido con resplandores rosa y salvia, no blanco puro.
- El color de la fase activa guía acentos, chips y barras.
- Rosa primario reservado para la acción principal y los estados activos.
- Botones en píldora, tarjetas de esquinas grandes.
- Iconos Material Symbols, sin emojis.

## Colors

Paleta de jardín: crema, rosa flor y verde hoja, con sustitutos oscuros para cada tono vía `light-dark()`. De noche los neutros son verde bosque y el rosa queda como acento complementario.

### Primary
- **Rosa flor** (#c2306a, oscuro #ff8fb8): acción principal, enlaces y estados activos. Texto blanco sobre él en claro (4.9:1 o más). En oscuro el texto es #2b0f1c.

### Secondary
- **Verde hoja** (#356d22, oscuro #a9dc84): éxito, fase folicular y énfasis suave. Sobre `leaf-soft` (#e3ecc9) cumple AA.

### Tertiary
- **Coral** (#d4482c) y **sol** (#f2a93b): calidez de la fase lútea y destellos. **Capullo** (#a3224a): fase menstrual y sangrado en el calendario.
- **Tinta sol** (`sun-ink`, #8a5300, oscuro #f2c27a): el sol como texto (avisos, nivel intermedio). `sun` es solo relleno; sobre un relleno `sun` sólido el texto es `sun-on` (#2b1d08) en ambos temas.

### Neutral
- **Crema** (#fbf3ea, oscuro bosque #101612): fondo de la app.
- **Crema clara** (#fffbf4, oscuro #18201b): tarjetas y superficies. Popover oscuro #1f2922.
- **Arena** (#f1eedf, oscuro #232d26): fondos apagados y chips.
- **Borde arena** (#ebe2d3, oscuro #2f3b32): divisores y bordes de tarjeta. Énfasis #8f8169 / #71806f.
- **Tinta cálida** (#2b2620, oscuro crema #f3efe6): texto principal (13.6:1 claro, 14.5:1 oscuro).
- **Tinta suave** (#6b6357, oscuro #b5bfb0): texto secundario (5.1:1 claro, 8.8:1 oscuro).

### Tonos decorativos
Pétalo (#f08bb0), rubor (#fde6ee), durazno (#fbd2bd), salvia (#b9d0ae), hoja fresca (#7cb356) y musgo (#24491a). Son para rellenos y degradados, no para texto.

### Named Rules
**La Regla de la Fase.** Cada fase tiene su color (`data-phase`): menstrual = capullo, folicular = hoja, ovulación = flor + sol, lútea = coral + oro (#a8461f). Se usan `bg-phase-soft` y `text-phase` para diferenciar con color, no con más texto.

**La Regla del Bosque Nocturno.** En oscuro el verde vive en los neutros, así que los acentos verdes (hover, `leaf-soft`) necesitan más luz o un lavado crema para no desaparecer. El hover del menú usa crema al 7% y `leaf-soft` oscuro es #24402a.

**La Regla del Token.** Los componentes no usan colores de la paleta de Tailwind (`emerald-500`, `amber-600`, `sky-400`…): verde = `leaf`, aviso = `sun`/`sun-ink`, error = `destructive`, rosa = `bud`/`blossom`, info suave = `sage`/`moss`. Así todo cambia con el tema.

**La Regla de la Voz Rosa.** El rosa primario marca la acción principal y lo activo. No se usa como color de fase ni de relleno decorativo, porque el blanco sobre `--phase` pierde contraste en oscuro.

## Typography

**Display Font:** Instrument Sans (con -apple-system, Segoe UI, Roboto, sans-serif)
**Body Font:** Instrument Sans
**Label/Mono Font:** Instrument Sans

**Character:** Una sola familia sans humanista y amable. La jerarquía sale del peso y el tamaño, no de cambiar de fuente.

### Hierarchy
- **Heading** (600, -0.025em): h1 y h2, con `text-wrap: balance`.
- **Subheading** (600, -0.015em): h3 a h6, con `text-wrap: balance`.
- **Body** (400): párrafos con `text-wrap: pretty`.
- **Label** (texto mínimo 12px): etiquetas y metadatos. Los números clave (series × repeticiones, descanso) van en 14px o más.

### Named Rules
**La Regla del Piso de 12px.** Ningún texto baja de 12px. Sin etiquetas en mayúsculas con tracking sobre los títulos.

## Layout

App con barra lateral y lienzo `garden-canvas`. El dashboard sigue una jerarquía fija: héroe del ciclo, **Ritmo de hoy** (registro, medicación, plan y hábitos en una sola tarjeta), sugerencias de fase con su porqué y, al final, métricas del cuerpo como sección abierta sin tarjeta. Las páginas evitan pilas largas de tarjetas del mismo peso. El héroe es compacto y los detalles se reparten en pestañas (por ejemplo /routines: Para tu Fase, Programas, Diario y Registro). Las tiras horizontales con snap se usan para programas y ejercicios. Los controles miden al menos 40px de alto (44px en formularios de registro). La versión móvil dedicada llegará más adelante.

## Elevation & Depth

Capas suaves con sombras cálidas y difusas. En oscuro las sombras son negro verdoso (#050a07), no negro puro. Las tarjetas son casi planas en reposo (`shadow-low`) y se elevan al interactuar (translateY -2px y brillo rosa tenue). En oscuro se añade un filo crema superior (`inset 0 1px 0 #f3efe60f`) para separar las tarjetas del fondo.

### Shadow Vocabulary
- **Low** (`0 1px 2px #5a3a2a0d, 0 6px 16px #5a3a2a0f`): tarjetas en reposo.
- **Med** (`0 2px 4px #5a3a2a0f, 0 12px 28px #5a3a2a14`): superficies elevadas.
- **High** (`0 4px 8px #5a3a2a14, 0 24px 48px #5a3a2a1f`): modales y popovers.

### Named Rules
**La Regla de la Sombra Cálida.** Las sombras llevan tinte marrón cálido (#5a3a2a), nunca gris neutro.

## Shapes

Esquinas generosas: interior 10px, elemento 16px, contenedor 24px, página 32px. Botones en píldora (9999px). Bordes finos de 1px al 70% del color de borde. Las formas orgánicas (flores, hojas, patrones) aparecen como ilustración, no como recortes de contenedores.

## Components

### Buttons
- **Shape:** píldora (9999px). Se apoyan en Astryx.
- **Primary:** fondo rosa flor, texto blanco. Es la única acción rosa por vista.
- **CTA especial (`cta-bloom`):** degradado flor a coral con un barrido de luz al pasar el cursor. Se desactiva con `prefers-reduced-motion`.
- **Secondary / Ghost / Outline:** versiones sobre arena o transparentes.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** crema clara (#fffbf4).
- **Shadow Strategy:** ver Elevation. Hover: sube 2px.
- **Border:** 1px sólido suave.
- **Internal Padding:** generoso, con `CardHeader` de icono y título.

### Estados de error
Nada se oculta en silencio: si unos datos no cargan, el widget lo dice en una línea discreta ("No pudimos cargar…" + Reintentar, o "Sin conexión" con reintento automático al volver).

### Chips / Badges
Insignias de Astryx (rosa, neutral, éxito, aviso, error). Las de dificultad usan color: principiante = hoja, intermedio = sol, avanzado = capullo o rubor.

### Navigation
Barra lateral con ítems `nav-item`. El activo lleva un lavado de flor a hoja, borde rosa suave y marcador de pétalo. Hover verdoso con `leaf-soft`.

### Botánica (componente distintivo)
Ilustraciones `Bloom`, `Flower` y `Botanical` con animaciones suaves (balanceo, respiración, pétalos cayendo). Siempre respetan `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** usar el color de la fase activa para diferenciar contenido.
- **Do** reservar el rosa primario (#c2306a) para la acción principal y los estados activos.
- **Do** usar iconos Material Symbols, con `aria-hidden` cuando son decorativos.
- **Do** mantener texto de 12px o más y controles de 40px o más.
- **Do** usar sombras cálidas y esquinas de 16 a 24px.

### Don't:
- **Don't** usar estética médica fría: blancos clínicos, azules hospitalarios, tablas áridas.
- **Don't** usar emojis ni glifos (✓ ✕ 💡) como iconos.
- **Don't** poner etiquetas en mayúsculas con tracking sobre los títulos.
- **Don't** apilar muchas tarjetas del mismo peso antes del contenido.
- **Don't** usar los tonos decorativos (pétalo, durazno, salvia, hoja fresca) para texto.
