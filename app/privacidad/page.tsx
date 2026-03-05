import { ArrowLeft } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Política de Privacidad</h1>
        
        <div className="space-y-10 text-[#657166] leading-relaxed font-medium">
          <p className="text-sm uppercase tracking-widest font-bold text-[#99CDD8]">Última actualización: Marzo 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Datos que recopilamos (Google Ads API)</h2>
            <p>Mora Analytics utiliza la API oficial de Google Ads. Solo solicitamos permisos de "Solo Lectura" (Read-Only) a través del protocolo seguro OAuth 2.0. Recopilamos estrictamente las métricas de rendimiento necesarias (impresiones, clics, conversiones, gasto) para generar las auditorías.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Uso de Datos en Inteligencia Artificial</h2>
            <p>Cumplimos estrictamente con la Política de Datos de Usuario de los Servicios de API de Google. Los datos de tus campañas se envían temporalmente a modelos de IA de Google (Gemini) mediante API de nivel empresarial. <strong>Tus datos no son utilizados por Google ni por Mora para entrenar modelos fundacionales públicos de IA.</strong></p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>3. Cláusula de Copiloto y Ejecución de Cambios</h2>
            <p>De acuerdo con nuestra filosofía de "Copiloto", los algoritmos de Mora Analytics acceden a la información únicamente con fines de análisis y diagnóstico. Mora no aplica, inyecta, ni ejecuta modificaciones automatizadas en el presupuesto o estructura de las campañas sin que exista una instrucción directa, voluntaria y explícita por parte del usuario dentro de la interfaz.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>4. Revocación de Accesos OAuth</h2>
            <p>Como usuario, mantienes el control total. Puedes revocar el acceso de Mora Analytics a tu cuenta de Google Ads en cualquier momento directamente desde el panel de seguridad de tu cuenta de Google. Al hacerlo, Mora perderá inmediatamente cualquier acceso a tus métricas.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>5. Almacenamiento y Seguridad</h2>
            <p>Los reportes generados se guardan en bases de datos seguras (tecnología Supabase) asociadas a tu cuenta de usuario para que puedas acceder al historial. Estos reportes son confidenciales y se almacenan mediante protocolos de cifrado estándar de la industria.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>6. Compartir con Terceros</h2>
            <p>Mora Analytics no vende, alquila ni comparte bajo ninguna circunstancia tus datos personales o el rendimiento de las campañas de tus clientes con agencias de publicidad, competidores u otros terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>7. Derechos del Usuario</h2>
            <p>Tienes derecho a solicitar la eliminación completa de tu cuenta, tu perfil y todo el historial de auditorías y snapshots de nuestros servidores contactando al equipo de soporte. Esta acción es irreversible.</p>
          </section>
        </div>
      </div>
    </div>
  );
}