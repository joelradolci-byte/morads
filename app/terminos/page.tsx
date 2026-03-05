import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <a href="/" className="inline-flex items-center gap-2 mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Términos y Condiciones</h1>
        
        <div className="space-y-8 text-[#657166] leading-relaxed font-medium">
          <p className="text-sm uppercase tracking-widest font-bold text-[#99CDD8]">Última actualización: Marzo 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Naturaleza del Servicio y Disclaimer de ROAS</h2>
            <p>Mora Analytics proporciona sugerencias, análisis y reportes generados por algoritmos de Inteligencia Artificial basados en métricas históricas de tu cuenta de Google Ads. Mora <strong>no garantiza aumentos específicos en el Retorno de Inversión (ROAS) ni en conversiones</strong>. Mora es una herramienta de asesoría; el usuario asume la responsabilidad total de las decisiones y cambios que decida aplicar en su cuenta publicitaria.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Suscripciones y Gestión de Pagos</h2>
            <p>El servicio opera bajo un modelo de suscripción mensual procesado a través de Stripe. Todos los nuevos usuarios disponen de 14 días de prueba gratuita. La suscripción se puede cancelar en cualquier momento desde el panel de facturación. No se emiten reembolsos parciales por meses no completados.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>3. Propiedad Intelectual y Marca Blanca</h2>
            <p>Los usuarios suscritos al "Plan Agency" obtienen el derecho de exportar reportes sin la marca de agua de Mora Analytics y reemplazarlos por su propia identidad corporativa (Marca Blanca). El software, código y algoritmos subyacentes de Mora siguen siendo propiedad exclusiva de Mora Analytics.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>4. Responsabilidad de la Cuenta (Google Ads)</h2>
            <p>Es responsabilidad del usuario asegurarse de que las campañas publicitarias cumplan con las Políticas Oficiales de Publicidad de Google. Mora Analytics no es responsable por cuentas suspendidas, anuncios rechazados o baneos emitidos por Google, incluso si ocurren después de aplicar sugerencias de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>5. Suspensión del Servicio</h2>
            <p>Mora Analytics se reserva el derecho de suspender o terminar el acceso de un usuario a la plataforma en caso de detectar un uso abusivo de la API, intentos de ingeniería inversa de nuestros algoritmos de IA, o impagos de la suscripción.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>6. Modificaciones de los Términos</h2>
            <p>Podemos modificar estos términos periódicamente para reflejar cambios en la plataforma o exigencias legales. Los usuarios activos serán notificados por correo electrónico con 30 días de anticipación ante cualquier cambio material.</p>
          </section>
        </div>
      </div>
    </div>
  );
}