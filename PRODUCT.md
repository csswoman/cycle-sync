# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Mujeres con PMOS (síndrome metabólico ovárico poliquístico) como usuaria principal. También la pueden usar mujeres sin PMOS que quieren seguir su ciclo y registrar sus rutinas. Dispositivo y momento de uso habitual: sin definir.

## Product Purpose
CycleSync es un registro diario de avances. Sincroniza nutrición, ejercicio y salud mental con las fases del ciclo menstrual y da soporte específico a PMOS. Éxito: la usuaria registra a diario (ciclo, síntomas, rutinas, comidas, medicación, citas) y ve su progreso con el tiempo.

## Positioning
Las apps de ciclo conocidas no toman en cuenta el ovario poliquístico. CycleSync lo trata como eje del producto: seguimiento de síntomas PMOS, análisis de laboratorio y consejos por fase. Es offline-first (IndexedDB) y prioriza la privacidad.

## Operating Context
PWA offline-first con sincronización a la nube cuando hay conexión. Registros diarios de ánimo, energía, síntomas, entrenamientos, recetas y planificador semanal. Asistente de IA (Gemini). Datos opcionales de wearables (Samsung Health Connect) y exportación de informes PDF para consultas médicas. La interfaz y el copy están en español.

## Capabilities and Constraints
- Terminología: usar "PMOS", no "PCOS". El nombre PCOS ya no es el vigente. Aplica a UI, copy y documentación.
- La app no da diagnósticos. Solo ofrece sugerencias y registro. No prometer lógica que la app no tiene.
- Una versión móvil (app) vendrá más adelante. Por ahora el producto es la web/PWA. Android nativo (Health Connect) sigue sin decidir.

## Brand Commitments
Nombre: CycleSync. Sin emojis ni glifos como sustituto de iconos en la UI (se usa Material Symbols). Copy en español.

## Product Principles
- Registro diario primero: cada pantalla ayuda a registrar rápido y a ver avances.
- Sugerir, no diagnosticar.
- PMOS es central, no una opción secundaria.
- Privacidad y uso offline por defecto.
- Útil también para quien no tiene PMOS.

## Accessibility & Inclusion
Accesibilidad estándar (buenas prácticas habituales), sin certificación formal. Reglas ya aplicadas en el proyecto: texto mínimo de 12px, controles de al menos 40px de alto, roles ARIA en tabs.
