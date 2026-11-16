# Plan de funcionalidades PMOS

Fecha: 2026-11-16. Basado en la revisión del código de ese día.

Fuera de este plan: recordatorios push (medicación, blíster, reposición, cribados, regla atrasada). Quedan para la app Android. Donde una fase necesita avisar de algo, el aviso es solo dentro de la app (banner o tarjeta).

Las traducciones se pulen al final. Cada fase escribe sus textos ES/EN en línea, como hace hoy el código.

## Orden y tamaño

| # | Fase | Tamaño | Migración |
| :- | :--- | :--- | :--- |
| 0 | Deuda que afecta a lo existente | S | No |
| 1 | Asistente con contexto clínico | S | No |
| 2 | Intensidad del sangrado y dolor | M | Sí |
| 3 | Análisis: marcadores, unidades y carga por foto/PDF | L | Sí |
| 4 | Conducta alimentaria y modo sin números | M | Sí |
| 5 | Glucosa ligada a comidas | M | Sí |
| 6 | Más correlaciones propias | M | No |
| 7 | Citas, diagnóstico y efectos secundarios | L | Sí |
| 8 | Privacidad: borrar cuenta, exportar datos, bloqueo | M | No |
| 9 | Buscando embarazo y embarazo | L | Sí |
| 10 | Datos de iPhone (Apple Health por webhook) | M | No |

El orden va de menor a mayor esfuerzo dentro de lo que más se usa a diario. Dos excepciones:

- La fase 8 debe estar hecha antes de publicar en Google Play, que exige poder borrar la cuenta desde la app.
- La fase 9 va tarde porque toca el motor de ciclo; conviene hacerla con las fases 2 y 6 ya estables.

## Reglas comunes

- Lógica en funciones puras dentro de `src/lib/**`, con test de vitest al lado. Los tests se corren desde PowerShell.
- Una migración por fase en `supabase/migrations/`, con RLS `auth.uid() = user_id` en cada tabla nueva.
- Las consultas fallan en blando: si la migración no está aplicada, se oculta la tarjeta y el resto sigue funcionando (patrón de `usePMOSOverview.ts`).
- Fechas locales (`toLocalISO`, `parseLocalDate`), nunca UTC.
- Todo resultado se redacta como observación, no como diagnóstico. Los rangos de referencia llevan la nota de que manda el rango del laboratorio.
- La actividad sexual y las fotos de progreso no entran en el contexto del asistente ni en el informe exportado.

---

## Fase 0. Deuda que afecta a lo existente

**Por qué.** Dos fallos pequeños cambian resultados que la usuaria ya ve.

1. **Anticoncepción leída solo de `localStorage`.** `usePMOSOverview.ts:89`, `PeriodHistory.tsx:43` y `DailyLog.tsx:59` usan `loadOnboardingAnswers()`. En otro dispositivo se pierde y vuelven las estimaciones de ovulación. `useCycleOverview.ts:50` ya lee `cycle_config.onboarding_answers`.
   - Crear `useOnboardingAnswers()` que devuelva lo local al instante y lo reemplace por lo remoto cuando llegue, guardándolo en `localStorage`.
   - Usarlo en los cuatro sitios.
2. **"Cuerpo y fertilidad" no funciona sin conexión.**
   - Añadir `cycleSigns` a `offlineDb.ts`, `saveCycleSignOffline` en `offlineHelpers.ts`, y sincronizarlo en `useOfflineSync.ts`.
   - Sumarlo a `getPendingSyncCount`.

**Listo cuando.** Al iniciar sesión en un navegador limpio, una usuaria con píldora no ve ventana fértil. Un registro de temperatura hecho sin red aparece tras reconectar.

## Fase 1. Asistente con contexto clínico

**Por qué.** `loadUserContext` (`src/lib/ai/userContext.server.ts:92-100`) solo carga 5 registros diarios, los últimos síntomas, medicación, despensa y el plan de hoy. No puede responder sobre análisis, glucosa ni ciclos.

**Cambios.**

- Ampliar `UserContextData` y `loadUserContext` con:
  - Ciclo: últimas 6 duraciones, días desde la última regla y banderas de `cycleHealthFlags`.
  - Análisis: último valor por marcador con fecha y estado (`markerStatus`), más HOMA-IR e índice de andrógenos libres derivados.
  - Medidas: promedio de glucosa en ayunas de 30 días, última presión con su categoría, tendencia de peso y cintura a 90 días.
  - Bienestar: último PHQ-2, GAD-2 y señales de apnea; último total de Ferriman-Gallwey con el anterior.
  - Tratamiento: adherencia de 30 días por medicamento y fecha de inicio.
  - Perfil: objetivo y anticoncepción del onboarding.
- Mantener el bloque corto: una línea por área y tope de líneas en `formatUserContext`.
- Reforzar la instrucción de sistema: explica valores frente al rango, no diagnostica ni ajusta dosis.
- Añadir sugerencias rápidas en `ChatTab.tsx`: "Explícame mis últimos análisis", "¿Cómo van mis ciclos?".

**Tests.** Ampliar `userContext.test.ts`: formato con datos completos, con datos vacíos y exclusión de actividad sexual.

**Listo cuando.** El asistente responde "¿cómo va mi HOMA-IR?" con el valor y la fecha reales, y sin datos dice que no hay registros.

## Fase 2. Intensidad del sangrado y dolor

**Por qué.** `periods` solo guarda inicio y fin. El sangrado abundante tras meses sin regla es la señal que más importa para el endometrio.

**Datos.** En `cycle_signs` (ya hay una fila por usuaria y día):

- `flow text` en `('light','medium','heavy','very_heavy')`
- `clots boolean default false`
- `pain smallint` de 0 a 10

**Lógica.** Nuevo `src/lib/cycle/bleeding.ts`:

- `heavyBleedingDays(signs, period)`: días `very_heavy` o `heavy` con coágulos.
- Nueva bandera `heavyBleeding` en `cycleHealthFlags`: 2 o más días así en una regla.
- Nueva bandera `heavyAfterGap`: regla abundante después de 90 días o más sin sangrado. Mensaje: conviene comentarlo en consulta.
- `very_heavy` se define en pantalla como "empapas una toalla o tampón cada 1 a 2 horas".

**UI.**

- Selector de flujo, coágulos y dolor en `BodySignsPanel.tsx`.
- Acceso directo al marcar un día de regla en `PeriodDayCalendar.tsx`.
- `PeriodHistory.tsx`: intensidad por día dentro de cada regla.
- En días `heavy` o `very_heavy`, enlazar la sugerencia de hierro de `supplementSuggestions.ts`.
- Añadir sangrado y dolor al informe (`medicalReportService.ts`) y al contexto del asistente.

**Tests.** `bleeding.test.ts` y casos nuevos en `cycleAnalysis.test.ts`.

**Listo cuando.** Una regla con dos días muy abundantes tras 100 días sin regla muestra ambas banderas en el resumen PMOS y aparece en el PDF.

## Fase 3. Análisis: marcadores, unidades y carga por foto/PDF

**Por qué.** Escribir cada valor a mano es la mayor fricción del módulo, y faltan marcadores que se piden de rutina.

**Datos.**

- Ampliar el `CHECK` de `lab_results.marker` (mismo bloque `DO` de la migración `20261116010000`) con: `ferritin`, `dheas`, `androstenedione`, `free_testosterone`, `ohp17`, `glucose_2h`, `alt`, `ast`, `progesterone`, `estradiol`.
- `lab_results.source text default 'manual'` en `('manual','scan')`.

**Lógica.**

- `LAB_MARKERS` en `src/lib/pmos/metrics.ts`: añadir los diez marcadores. Rangos seguros de partida:
  - `glucose_2h`: menos de 140 mg/dL normal, 140 a 199 prediabetes, 200 o más diabetes.
  - `progesterone`: sin rango alto/bajo; nota de que un valor de fase lútea por encima de unos 3 ng/mL sugiere ovulación.
  - El resto (ferritina, DHEA-S, androstenediona, testosterona libre, 17-OHP, ALT, AST, estradiol) necesita una fuente clínica antes de fijar el rango. Mientras tanto se guardan sin bandera.
- `screening.ts`: contar `glucose_2h` como control de glucosa.
- Nuevo `src/lib/pmos/units.ts` con conversiones a la unidad canónica:
  - glucosa mmol/L × 18,016 = mg/dL
  - colesterol mmol/L × 38,67 = mg/dL
  - triglicéridos mmol/L × 88,57 = mg/dL
  - testosterona nmol/L ÷ 0,0347 = ng/dL
  - vitamina D nmol/L ÷ 2,496 = ng/mL
  - B12 pmol/L ÷ 0,738 = pg/mL
  - insulina pmol/L ÷ 6,945 = µUI/mL
- Nuevo `src/lib/pmos/labExtract.ts`, `normalizeExtractedLabs(raw)`: asigna cada fila a un marcador conocido, convierte la unidad, descarta valores fuera de límites plausibles y marca las filas dudosas.

**API.** `src/app/api/labs/extract/route.ts`:

- `requireUser`, límite de tamaño, solo imagen o PDF.
- Usa `generateJson(prompt, mediaDataUrl)` de `gemini.server.ts`, que ya acepta ambos.
- Devuelve filas `{ marker, value, unit, date, rawLabel }` ya normalizadas.
- El archivo no se guarda.

**UI.** En `LabResultsSection.tsx`:

- Selector de unidad al escribir un valor.
- Botón "Subir análisis" con pantalla de revisión: cada fila muestra la etiqueta original, el valor convertido y un interruptor. Nada se guarda sin confirmar.

**Tests.** `units.test.ts` y `labExtract.test.ts` (etiquetas en español e inglés, unidades mezcladas, valores imposibles).

**Listo cuando.** Una foto de un perfil lipídico en mmol/L produce cuatro filas en mg/dL que la usuaria confirma y que aparecen en la gráfica.

## Fase 4. Conducta alimentaria y modo sin números

**Por qué.** La guía de 2023 pide vigilar la alimentación desordenada y la imagen corporal. La app hoy muestra macros, calorías, peso y cintura sin opción de ocultarlos.

**Datos.**

- `cycle_config.display_prefs jsonb default '{}'` con `hideNumbers: boolean`.
- `wellbeing_checks.scoff smallint` (0 a 5, nulo si no se respondió).

**Lógica.**

- `src/lib/pmos/wellbeing.ts`: `scoreScoff(answers)`, positivo con 2 o más. Se pregunta cada 90 días y se puede saltar.
- `src/lib/pmos/insights.ts`: `bingeInsight`, días con atracón frente a días con menos de 6 h de sueño y días con comidas saltadas.

**UI.**

- Interruptor "Modo sin números" en `Settings.tsx`. Oculta calorías, macros, peso y cintura en `MacroWaterCalculator`, `PlateBuilder`, `RecipeCard`, `RecipeDetailModal`, `BodyMetricsSection`, `HealthConnectWidget`, `WeeklySummaryCard` y el informe.
- Con el modo activo, el contexto del asistente incluye la instrucción de no hablar de peso ni calorías.
- `SymptomGrid.tsx`: chips "Atracón o pérdida de control", "Comer por emociones" y "Me salté comidas". Son cadenas en `daily_logs.symptoms`, sin migración.
- `WellbeingCheck.tsx`: bloque SCOFF opcional. Si da positivo, mensaje sin alarma, sugerencia de consultar y oferta de activar el modo sin números.
- Revisión de textos: quitar "detox" y la pérdida de peso como objetivo por defecto en recetas y rutinas.

**Tests.** Casos de `scoreScoff` y `bingeInsight`.

**Listo cuando.** Con el modo activo no aparece ninguna caloría ni peso en nutrición, planner, dashboard ni PDF.

## Fase 5. Glucosa ligada a comidas

**Por qué.** Ya se registra glucosa "después de comer", pero sin saber de qué comida.

**Datos.** En `pmos_metrics`:

- `meal_slot text` en `('breakfast','lunch','snack','dinner')`
- `meal_label text` (copia del título, porque las entradas del planner se reemplazan)
- `minutes_after_meal smallint` (60 o 120)

**Lógica.** Nuevo `src/lib/pmos/mealGlucose.ts`:

- Agrupa por `meal_label` normalizado.
- Promedio por comida con mínimo 2 lecturas.
- Ordena de mayor a menor y marca las que superan 140 mg/dL a las 2 h.

**UI.**

- `BodyMetricsSection.tsx`: con contexto "después de comer", selector de las comidas de hoy del planner o texto libre, y 1 h o 2 h.
- `WeeklyPlanner.tsx`: en una comida marcada como hecha, acción "Añadir glucosa".
- Tarjeta "Comidas que más te suben" en el resumen PMOS, visible desde 2 comidas con datos.

**Tests.** `mealGlucose.test.ts`.

**Listo cuando.** Con tres lecturas tras "arepa con queso" y dos tras "avena", la tarjeta las ordena con su promedio y número de lecturas.

## Fase 6. Más correlaciones propias

**Por qué.** `buildInsights` cruza medicación, glucosa y sueño. Hay datos de ejercicio, pasos y tratamientos largos que no se usan.

**Cambios en `src/lib/pmos/insights.ts`.**

- `exerciseInsight`: energía y puntaje de síntomas al día siguiente de entrenar frente a días sin entrenar (`workout_logs`).
- `activitySleepInsight`: pasos y sueño de `health_data` frente al puntaje de síntomas.
- `treatmentCheckpoint`: a los 3 y 6 meses del inicio de un medicamento, compara síntomas, acné y Ferriman-Gallwey de antes con los últimos 30 días. Mensaje pensado para espironolactona y anticonceptivos, que tardan.
- `phaseSymptomInsight`: síntomas por fase, solo sin anticoncepción hormonal y con ovulación confirmada por temperatura.
- `waistCycleInsight`: tendencia de cintura frente a duración de ciclos. No se muestra en modo sin números.

Todas respetan `MIN_GROUP` y se redactan como observación.

**Datos de entrada.** `usePMOSOverview.ts` carga además `workout_logs`, `health_data` y `hirsutism_scores`.

**Tests.** Un caso positivo, uno neutro y uno sin datos suficientes por función en `insights.test.ts`.

**Listo cuando.** Una usuaria con 6 meses de espironolactona ve su punto de control con el antes y el después.

## Fase 7. Citas, diagnóstico y efectos secundarios

**Por qué.** La pestaña "Mi cita" solo guarda preguntas. No hay fecha de cita, ficha de diagnóstico ni registro de efectos de la medicación.

**Datos.**

- `appointments`: `date`, `time`, `specialty`, `doctor`, `place`, `notes`, `summary`.
- `doctor_questions.appointment_id uuid` nulo.
- `pmos_diagnosis` (una fila por usuaria): `diagnosed_on`, `irregular_cycles`, `clinical_hyperandrogenism`, `biochemical_hyperandrogenism`, `polycystic_ovaries`, `notes`.
- `health_events`: `date`, `kind` (`ultrasound`, `procedure`, `other`), `summary`.
- `medication_side_effects`: `medication_id`, `date`, `effect`, `severity` de 1 a 3.

**Lógica.**

- `src/lib/pmos/diagnosis.ts`: `phenotype(criteria)` devuelve A, B, C, D o nulo según los criterios marcados.
- `insights.ts`: `sideEffectInsight`, efectos por medicamento en las semanas tras empezar o cambiar la pauta.

**UI.**

- `DoctorQuestions.tsx` pasa a ser la pestaña completa de cita:
  - Próxima cita con cuenta atrás.
  - Lista "Qué llevar": cribados vencidos de `screeningPlan`, preguntas pendientes y botón para generar el PDF.
  - Después de la cita: notas y fecha de la siguiente.
- Banner en el dashboard cuando faltan 3 días o menos.
- Ficha "Mi diagnóstico" en la pestaña Resumen, con ecografías y eventos.
- `Medications.tsx`: registrar efecto secundario con chips por tipo de medicamento (apoyado en `MedicationCareTips.tsx`) y verlo en el historial.
- Añadir diagnóstico, eventos y efectos al informe.

**Tests.** `diagnosis.test.ts` y el caso de `sideEffectInsight`.

**Listo cuando.** Antes de una cita la usuaria ve qué análisis le tocan y sus preguntas, y el PDF incluye fenotipo y efectos registrados.

## Fase 8. Privacidad

**Por qué.** No hay forma de borrar la cuenta ni de sacar los datos, y la app guarda fotos y actividad sexual. Google Play lo exige.

**Cambios.**

- **Borrar cuenta.** `src/app/api/account/delete/route.ts` con `requireUser` y el cliente de `src/lib/supabase/admin.ts`:
  1. Borra los archivos de `progress-photos/<user_id>/` y el avatar.
  2. Llama a `auth.admin.deleteUser`; las tablas caen por `ON DELETE CASCADE`.
  - En `Settings.tsx`: confirmación escribiendo una palabra, y limpieza de `localStorage` e IndexedDB al terminar.
- **Descargar mis datos.** Botón en `Settings.tsx` que genera un JSON con todas las tablas de la usuaria.
- **Bloqueo con PIN.** PIN derivado con PBKDF2 (WebCrypto) y guardado solo en el dispositivo; pantalla de bloqueo al abrir y tras inactividad. Es una pantalla de privacidad, no cifrado. La biometría llega con la app Android.
- **Fotos de progreso.** Se muestran difuminadas hasta tocar.
- Actualizar `src/app/privacy/page.tsx` con lo anterior.

**Listo cuando.** Tras borrar la cuenta no quedan filas ni archivos de esa usuaria, y no puede volver a iniciar sesión.

## Fase 9. Buscando embarazo y embarazo

**Por qué.** El objetivo "Quedar embarazada" existe en el onboarding y ya hay tiras de LH, temperatura y moco (con el aviso de falsos positivos). Falta el test de embarazo y un estado que detenga las predicciones.

**Alcance.** No es un seguimiento del embarazo semana a semana. El objetivo es que la app deje de dar información incorrecta y recuerde los controles propios de PMOS.

**Datos.**

- `cycle_signs.pregnancy_test text` en `('negative','positive')`.
- `pregnancies`: `start_date`, `positive_test_date`, `end_date` nulo. Sin campo obligatorio de desenlace.
- El modo "buscando embarazo" es `onboarding_answers.goal = 'fertility'`, editable desde `Settings.tsx`.

**Lógica.**

- `src/lib/cycle/pregnancy.ts`: `activePregnancy(pregnancies, today)` y `excludePregnancyGaps(starts, pregnancies)`.
- `estimateCycle`, `cycleHealthFlags`, `cycles()` de `insights.ts` y `periodForecast.ts` excluyen los intervalos de embarazo, para que no cuenten como un ciclo de 280 días ni disparen "más de 90 días sin regla".
- `screening.ts`:
  - Con objetivo fertilidad: control de glucosa preconcepcional.
  - Con embarazo activo: curva de glucosa en la primera visita y entre las semanas 24 y 28.

**UI.**

- Test de embarazo en `BodySignsPanel.tsx`. Un positivo ofrece activar el modo embarazo.
- Modo embarazo:
  - Oculta predicción de regla, ventana fértil, alertas de retraso y recomendaciones por fase.
  - Tarjeta fija: revisar con la médica qué medicación continuar.
  - El asistente recibe el estado en su contexto.
- Modo buscando embarazo:
  - Tarjeta de ventana fértil que prioriza señales del cuerpo sobre calendario (`cycleStatus.ts`).
  - Lista preconcepcional: ácido fólico, revisión de medicación, glucosa y presión.
  - Ciclos de inducción: marcar un medicamento como inducción de ovulación con sus días de toma, y ver en ese ciclo temperatura, LH y test juntos.
- Salir del modo embarazo con un solo paso y texto neutro. Las predicciones vuelven con la siguiente regla registrada.

**Tests.** `pregnancy.test.ts`, y casos en `cycleEngine.test.ts`, `cycleAnalysis.test.ts` y `screening.test.ts`.

**Listo cuando.** Con un embarazo activo no aparece ninguna predicción ni alerta de retraso, y al terminar, la media de ciclos no cambia por ese intervalo.

## Fase 10. Datos de iPhone

**Por qué.** Tras quitar Fitbit solo queda Health Connect, que es Android.

**Enfoque.** El webhook actual (`src/app/api/health/webhook/route.ts`) recibe JSON de una app puente. En iPhone hay apps que envían Apple Health a una URL del mismo modo. Antes de programar hay que confirmar el formato exacto del JSON de la app elegida.

**Cambios.**

- `src/lib/health/records.ts`: `normalizeAppleExport(payload, tz)` que produce los mismos `HealthRecord`, con `source: 'apple_health'`.
- El webhook detecta el formato y elige el normalizador. `preferDevice` trata `apple_health` como dispositivo.
- `HealthWebhookSettings.tsx`: instrucciones para iPhone.
- Si la app puente lo permite, traer también temperatura de muñeca para apoyar la detección de ovulación.

**Tests.** Casos nuevos en `records.test.ts` con un payload real de ejemplo.

**Listo cuando.** Un iPhone envía pasos y sueño y aparecen en el dashboard igual que los de Android.

---

## Decisiones tomadas por defecto

Cámbialas si no encajan:

1. **Rangos de los marcadores nuevos.** Se guardan sin bandera hasta tener fuente clínica, salvo glucosa a las 2 h.
2. **"Detox".** Se quita de los textos en la fase 4; las recetas se quedan con otro nombre.
3. **Embarazo.** Solo pausa y controles PMOS, sin contenido semana a semana.
4. **Archivos de análisis.** No se guardan; solo los valores confirmados.
