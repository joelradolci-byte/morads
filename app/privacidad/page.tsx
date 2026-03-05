export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <a href="/" className="inline-block mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors">← Volver</a>
        
        <h1 className="text-4xl font-black mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Política de Privacidad</h1>
        
        <div className="space-y-8 text-[#657166] leading-relaxed font-medium">
          <p>Última actualización: Marzo 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Acceso a Google Ads</h2>
            <p>Mora Analytics utiliza la API oficial de Google Ads. Solo solicitamos permisos de "Solo Lectura" (Read-Only) a través del protocolo seguro OAuth 2.0. No tenemos capacidad técnica para crear, pausar o eliminar campañas, ni para modificar tu presupuesto directamente desde nuestra plataforma sin tu consentimiento explícito.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Uso de Datos de Inteligencia Artificial</h2>
            <p>Los datos de rendimiento de tus campañas se procesan de forma temporal mediante la API de Google Gemini para generar las auditorías. Estos datos se transmiten encriptados y <strong>no son utilizados por Google ni por Mora para entrenar modelos fundacionales públicos</strong> de inteligencia artificial.</p>
          </section>
        </div>
      </div>
    </div>
  );
}