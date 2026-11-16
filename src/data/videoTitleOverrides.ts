/**
 * Display titles for catalog videos whose original title promises weight or fat loss.
 * Keyed by the title stored in `workout_videos` and `workoutVideos.json`, so both sources get the same wording
 * without writing to the database. Titles not listed here are shown as they are.
 */
export const VIDEO_TITLE_OVERRIDES: Record<string, string> = {
  "30 Minutos Rutina Hombro y Bíceps en Casa 🔥 Rutina con Mancuernas | Te Van a QUEMAR los Brazos": "30 Minutos Rutina Hombro y Bíceps en Casa | Rutina con Mancuernas",
  "Adiós Flacidez en Muslos y Abdomen: Rutina QUEMA GRASA en Casa (20 min)": "Rutina de Muslos y Abdomen en Casa (20 min)",
  "RUTINA 30 MINUTOS para QUEMAR GRASA 🔥 Cardio, Piernas y Abdomen en Casa": "RUTINA 30 MINUTOS Cardio, Piernas y Abdomen en Casa",
  "Quema GRASA ABDOMINAL Rápido: RUTINA de Cardio 20 MINUTOS para Adelgazar en Casa": "Cardio de 20 Minutos con Abdomen en Casa",
  "🔥 CARDIO INTENSO 20 Minutos para ADELGAZAR y Quemar Grasa en Casa | GymVirtual": "Cardio Intenso 20 Minutos en Casa | GymVirtual",
  "Rutina DESTROZA GRASA Cardio, Piernas y Abdomen en un solo vídeo": "Rutina de Cardio, Piernas y Abdomen en un solo vídeo",
  "CARDIO INTENSO 25 MIN para QUEMAR GRASA y Adelgazar | GymVirtual": "Cardio Intenso 25 Min | GymVirtual",
  "20 Minutos de CORE CARDIO Intenso | Quema Grasa y Define Abdomen ⚡": "20 Minutos de Core Cardio Intenso | Abdomen",
  "🔥 Rutina GAP CARDIO en Casa: Adelgazar y Tonificar Piernas, Glúteos y Abdomen (SIN MATERIAL)": "Rutina GAP Cardio en Casa: Piernas, Glúteos y Abdomen (Sin material)",
  "Cardio Abdominal para Bajar de Peso | Sin Equipos 💦": "Cardio Abdominal | Sin Equipos",
  "CARDIO Y ABDOMEN 20 MINUTOS 🔥 Quema Grasa y Tonifica Abdomen en Casa": "Cardio y Abdomen 20 Minutos en Casa",
  "CARDIO HIIT 🔥 QUEMA GRASA RÁPIDO (Pierde Peso en Casa en 20 Minutos)": "Cardio HIIT en Casa de 20 Minutos",
  "¡QUEMA Y TONIFICA! 🔥 10 Min con Bandas de Resistencia | Full Body en Casa": "10 Min con Bandas de Resistencia | Full Body en Casa",
  "QUEMA GRASA RAPIDO | Rutina 3 en 1 de Cardio, Abdomen y Estiramiento": "Rutina 3 en 1 de Cardio, Abdomen y Estiramiento",
  "Rutina para Adelgazar y Tonificar Brazos y Espalda en 30 minutos": "Rutina de Brazos y Espalda en 30 minutos",
  "Reduce Grasa de Espalda, Brazos y Abdomen | EN CASA": "Rutina de Espalda, Brazos y Abdomen | En Casa",
  "Elimina Grasa de Espalda y Tonifica Brazos en Casa - 25 Minutos": "Espalda y Brazos en Casa - 25 Minutos",
  "ABDOMINALES DE PIE | Reduce Cintura y Tonifica tu Abdomen": "Abdominales de Pie | Tonifica tu Abdomen",
  "Ejercicios para Reducir Grasa Abdominal | Cardio en Casa 20 minutos": "Ejercicios de Abdomen | Cardio en Casa 20 minutos",
  "Rutina de Cardio Intenso | Baja Grasa Abdominal": "Rutina de Cardio Intenso | Abdomen",
  "Cardio Abdominal SIN EQUIPO para ADELGAZAR RÁPIDO | Quema Grasa y Reduce Cintura en Casa": "Cardio Abdominal Sin Equipo en Casa",
  "Cardio Abdominal para Bajar de Peso | Sin Equipos - RETO 7 DÍAS": "Cardio Abdominal | Sin Equipos - Reto 7 Días",
  "Ejercicios SIN SALTOS para Adelgazar - 20 Minutos": "Ejercicios Sin Saltos - 20 Minutos",
  "Ejercicios para Abdomen Plano | Reducir Grasa Abdominal": "Ejercicios de Abdomen",
  "Rutina para Adelgazar Brazos y Espalda Rápido | Adiós Gordos": "Rutina de Brazos y Espalda",
  "Ejercicios para Adelgazar Rápido | QUEMA GRASA 🔥": "Ejercicios de Cardio en Casa",
  "Rutina de Bajo Impacto para Adelgazar 🔥 20 Minutos | Sin Equipos | Cardio Suave para Quemar Grasa": "Rutina de Bajo Impacto | 20 Minutos | Sin Equipos | Cardio Suave",
  "Cardio sin Saltos para Perder Peso Rápido | Entrena en Familia 💪🏽": "Cardio sin Saltos | Entrena en Familia",
  "Entrenamiento de danza del vientre AVANZADO | Movimientos rápidos para quemar y sudar RÁPIDO 🔥": "Entrenamiento de danza del vientre AVANZADO | Movimientos rápidos",
  "Esculpir Glúteos de Pie en 20 Minutos (¡Estilo Danza del Vientre para Quemar Grasa!)": "Esculpir Glúteos de Pie en 20 Minutos (Estilo Danza del Vientre)",
  "Low Impact, High Burn: 25 Min Hips, Shimmies and Figure 8s! Egyptian Dance Tutorial": "Low Impact: 25 Min Hips, Shimmies and Figure 8s! Egyptian Dance Tutorial",
  "Entrenamiento de cadera con danza del vientre | Fitness de danza árabe de 18 min | Quema grasa y ...": "Entrenamiento de cadera con danza del vientre | Fitness de danza árabe de 18 min",
  "¡Fiesta de danza del vientre! 💃 ¡Sigue la rutina en 15 minutos! ¡Entrenamiento para quemar calorí...": "¡Fiesta de danza del vientre! 💃 ¡Sigue la rutina en 15 minutos!",
  "Entrenamiento cardiovascular de 15 minutos con barra | Quema de calorías para todo el cuerpo en casa": "Entrenamiento cardiovascular de 15 minutos con barra | Todo el cuerpo en casa",
  "19 MIN TATE MCRAE DANCE WORKOUT | Weight loss | Dance Cardio 💗": "19 MIN TATE MCRAE DANCE WORKOUT | Dance Cardio 💗",
  "MICHAEL JACKSON DANCE WORKOUT | 20 MINUTES | FUN CARDIO | Burn Calories & Have Fun! ⭐": "MICHAEL JACKSON DANCE WORKOUT | 20 MINUTES | FUN CARDIO ⭐",
  "AFRO PILATES 🔥 Dynamic Pilates Workout | Core, Legs & Full Body Burn | Low impact": "AFRO PILATES 🔥 Dynamic Pilates Workout | Core, Legs & Full Body | Low impact",
  "AFROBEATS DANCE WORKOUT | WEIGHT LOSS | HOME CARDIO": "AFROBEATS DANCE WORKOUT | HOME CARDIO",
};

export function displayVideoTitle(title: string): string {
  return VIDEO_TITLE_OVERRIDES[title] ?? title;
}
