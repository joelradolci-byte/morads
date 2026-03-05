export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <a href="/" className="inline-block mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors">← Volver</a>
        
        <h1 className="text-4xl font-black mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Términos y Condiciones</h1>
        
        <div className="space-y-8 text-[#657166] leading-relaxed font-medium">
          <p>Última actualización: Marzo 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Naturaleza del Servicio</h2>
            <p>Mora Analytics proporciona sugerencias y reportes generados por IA basados en métricas históricas de Google Ads. Mora no garantiza aumentos específicos en el Retorno de Inversión (ROAS) ni asume responsabilidad por las decisiones tomadas por el usuario en base a dichas auditorías.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Suscripciones y Pagos</h2>
            <p>El servicio opera bajo un modelo de suscripción mensual. Todos los nuevos usuarios disponen de 14 días de prueba gratuita. La suscripción se puede cancelar en cualquier momento desde el panel de facturación. No se emiten reembolsos parciales por meses no completados.</p>
          </section>
        </div>
      </div>
    </div>
  );
}