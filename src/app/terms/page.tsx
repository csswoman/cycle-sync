export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-6">Términos del Servicio</h1>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground flex flex-col gap-4">
          <p><strong>Última actualización:</strong> 18 de marzo de 2026</p>

          <h2 className="text-lg font-bold text-foreground mt-4">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar CycleSync, aceptas quedar vinculada por estos Términos del Servicio.
            Si no estás de acuerdo, te pedimos que no utilices la aplicación.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">2. Descripción del Servicio</h2>
          <p>
            CycleSync es una aplicación de bienestar y salud integral diseñada para el registro y seguimiento
            del ciclo menstrual, hábitos diarios, nutrición, entrenamiento y soporte específico para PMOS,
            con integración opcional de dispositivos de salud. La app ofrece sugerencias basadas en fases del ciclo
            y datos autorregistrados.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">3. Descargo de Responsabilidad Médica</h2>
          <p>
            CycleSync no es un dispositivo médico y está destinada exclusivamente a fines informativos, de registro
            y bienestar personal. La app no proporciona diagnósticos ni tratamientos médicos.
            Los datos procedentes de wearables o estimaciones de ciclo no sustituyen la consulta, diagnóstico ni indicación
            de un profesional de la salud cualificado.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">4. Integraciones de Terceros</h2>
          <p>
            CycleSync puede integrarse con servicios de terceros como Health Connect y Google Gemini (funciones de IA, solo con tu permiso). El uso de dichas
            integraciones está sujeto a los términos del servicio y políticas de privacidad correspondientes de dichos terceros.
            CycleSync no se hace responsable de la disponibilidad o exactitud de datos proporcionados por servicios externos.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">5. Datos de la Usuaria</h2>
          <p>
            Conservas en todo momento la titularidad de los datos que ingreses o sincronices en CycleSync.
            Puedes desconectar integraciones y exportar o eliminar tu cuenta y tus datos en cualquier momento
            desde la sección de Configuración.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">6. Modificaciones de los Términos</h2>
          <p>
            Nos reservamos el derecho de actualizar o modificar estos términos cuando sea necesario. El uso continuado
            de CycleSync tras la publicación de cambios constituye la aceptación de los términos actualizados.
          </p>
        </div>
      </div>
    </div>
  );
}
