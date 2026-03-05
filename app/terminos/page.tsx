import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Términos y Condiciones</h1>
        
        <div className="space-y-10 text-[#657166] leading-relaxed font-medium">
          <p className="text-sm uppercase tracking-widest font-bold text-[#99CDD8]">Última actualización: Marzo 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Transparencia y Control (Cláusula de Copiloto)</h2>
            <p className="mb-4">El uso de Mora Analytics se rige bajo un modelo de "Copiloto". Esto implica que:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Supervisión Humana Obligatoria:</strong> Mora actúa como una herramienta de diagnóstico que sugiere optimizaciones. El usuario es el único responsable de validar, revisar y confirmar la pertinencia de dichos cambios.</li>
              <li><strong>Responsabilidad del Propietario:</strong> La decisión estratégica final y la aplicación o inyección de ajustes directamente en la plataforma de Google Ads recaen pura y exclusivamente sobre el dueño de la cuenta o el gestor autorizado.</li>
              <li><strong>Red de Seguridad:</strong> Todas las acciones aplicadas a través de nuestras funciones de automatización mantienen un mecanismo de "Undo" (Deshacer) para una reversión inmediata, en caso de errores en la validación humana.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Disclaimer de ROAS y Rendimiento</h2>
            <p>Mora Analytics <strong>no garantiza aumentos específicos en el Retorno de Inversión (ROAS), volumen de conversiones, ni disminuciones en el CPA</strong>. Mora Analytics y sus creadores quedan eximidos de cualquier reclamo por pérdidas financieras, deterioro del rendimiento publicitario o resultados negativos derivados de la aplicación de las sugerencias de la IA.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>3. Suscripciones y Gestión de Pagos</h2>
            <p>El servicio opera bajo un modelo de suscripción mensual procesado a través de Stripe. Todos los nuevos usuarios disponen de 14 días de prueba gratuita. La suscripción se puede cancelar en cualquier momento. No se emiten reembolsos parciales por fracciones de meses no completados tras la cancelación.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>4. Propiedad Intelectual y Marca Blanca</h2>
            <p>Los usuarios suscritos al "Plan Agency" obtienen el derecho de exportar reportes eliminando la marca visual de Mora Analytics y reemplazándolos por su propia identidad corporativa. Sin embargo, el software, código fuente, algoritmos subyacentes y prompts de IA siguen siendo propiedad intelectual exclusiva de Mora Analytics.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>5. Políticas de Google Ads</h2>
            <p>Es responsabilidad exclusiva del usuario asegurarse de que sus campañas publicitarias cumplan con las Políticas Oficiales de Publicidad de Google. Mora Analytics no es responsable por cuentas suspendidas, anuncios rechazados o baneos emitidos por Google, incluso si dichos eventos ocurren después de utilizar nuestra plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>6. Suspensión del Servicio</h2>
            <p>Mora Analytics se reserva el derecho de suspender o terminar el acceso de un usuario a la plataforma de forma inmediata en caso de detectar un uso abusivo de la API, intentos de ingeniería inversa de nuestros modelos de IA, reventa no autorizada del software o impagos de la suscripción.</p>
          </section>
        </div>
      </div>
    </div>
  );
}