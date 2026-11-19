export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-6">Política de Privacidad</h1>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground flex flex-col gap-4">
          <p><strong>Última actualización:</strong> Noviembre de 2026</p>

          <h2 className="text-lg font-bold text-foreground mt-4">1. Información que Recopilamos</h2>
          <p>CycleSync recopila los siguientes tipos de información:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de cuenta:</strong> dirección de correo electrónico, nombre y foto de perfil.</li>
            <li><strong>Datos de salud:</strong> registros del ciclo menstrual, síntomas diarios, estado de ánimo y registros de seguimiento de PMOS.</li>
            <li><strong>Registros sensibles:</strong> sangrado, temperatura basal, actividad sexual, análisis de laboratorio, medicación, cuestionarios de bienestar y fotos de progreso. Las fotos de progreso se almacenan en un almacenamiento privado y se muestran mediante enlaces temporales de corta duración. La actividad sexual y las fotos nunca se envían al asistente de IA ni se incluyen en los reportes exportados.</li>
            <li><strong>Datos de dispositivos wearables:</strong> pasos, frecuencia cardíaca, sueño y actividad que envíes desde Health Connect o ingreses manualmente.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">2. Cómo Usamos tus Datos</h2>
          <p>Tus datos se utilizan exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ofrecer recomendaciones personalizadas según las fases de tu ciclo.</li>
            <li>Mostrar tus métricas de salud desde dispositivos wearables conectados.</li>
            <li>Generar reportes de salud para tu uso personal o consulta médica.</li>
            <li>Responder a tus preguntas y generar contenido con funciones de IA, solo si das tu permiso (ver sección 4).</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">3. Almacenamiento y Seguridad de Datos</h2>
          <p>
            Tus datos se almacenan mediante Supabase con políticas de seguridad a nivel de fila (Row Level Security): cada cuenta solo puede leer y modificar sus propios registros.
            Las conexiones van cifradas (HTTPS). Del token de webhook solo guardamos una huella cifrada (hash), nunca el token completo.
            Para que la app funcione sin conexión, una copia de tus registros recientes se guarda en tu navegador; se borra al cerrar sesión.
          </p>
          <p>
            No vendemos tus datos ni los usamos para publicidad. Solo los compartimos con los proveedores de la sección 4, y únicamente para prestarte el servicio.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">4. Servicios de Terceros</h2>
          <p>CycleSync usa estos proveedores, que tratan datos en nuestro nombre:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> autenticación y almacenamiento de datos.</li>
            <li><strong>Vercel:</strong> alojamiento de la aplicación; procesa las solicitudes entre tu dispositivo y nuestros servidores.</li>
            <li>
              <strong>Google Gemini (IA, opcional):</strong> el asistente, la lectura de análisis de laboratorio, el análisis de fotos y videos, y la generación de recetas y planes envían a Google tus mensajes, los archivos que elijas analizar y un resumen de tus registros (ciclo, síntomas, estado de ánimo y bienestar, embarazos, medicación, análisis y métricas como peso, glucosa o presión).
              Nunca enviamos tu actividad sexual ni tus fotos de progreso. Antes del primer uso te pedimos permiso, y puedes retirarlo cuando quieras en <strong>Configuración → Privacidad</strong>; sin él, no se envía nada a Google.
              Google trata estos datos según los términos de la API de Gemini.
            </li>
            <li><strong>Health Connect (opcional):</strong> si usas la app HC Webhook en Android, envías las métricas de salud que elijas a nuestros servidores a través de una URL privada con token secreto. Los datos se almacenan únicamente en tu cuenta de CycleSync.</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground mt-4">5. Tus Derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acceder a todos tus datos almacenados.</li>
            <li>Desconectar las integraciones de wearables en cualquier momento.</li>
            <li>Eliminar tu cuenta y todos los datos asociados.</li>
            <li>Exportar tus datos de salud.</li>
          </ul>
          <p>
            Ambas opciones están disponibles en <strong>Configuración → Privacidad</strong>. &ldquo;Descargar mis datos&rdquo; te entrega un archivo JSON con todos tus registros.
            &ldquo;Eliminar mi cuenta&rdquo; borra de forma permanente tu cuenta, todos los registros asociados a ella, tus fotos de progreso y tu foto de perfil, y también limpia la copia almacenada en este navegador.
            También puedes configurar un bloqueo por PIN en la misma sección. El PIN se mantiene solo en tu dispositivo y funciona como una pantalla de privacidad; no cifra tus datos.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">6. Retención de Datos</h2>
          <p>
            Todos tus datos, archivos incluidos, se eliminan de forma inmediata y definitiva cuando eliminas tu cuenta desde la app.
            De lo contrario, se conservan hasta que decidas borrarlos.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-4">7. Contacto</h2>
          <p>
            Para preguntas relacionadas con tu privacidad, contáctanos a través de la aplicación.
          </p>
        </div>
      </div>
    </div>
  );
}
