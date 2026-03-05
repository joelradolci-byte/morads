import { Search, Zap, FileText, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>El Motor de Mora</h1>
        <p className="text-xl text-[#657166] mb-16 font-medium leading-relaxed">Descubrí cómo nuestra inteligencia artificial analiza miles de data points en segundos para encontrar exactamente dónde estás perdiendo dinero.</p>
        
        <div className="space-y-12">
          {/* Paso 1 */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-[2rem] p-10 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#CFD6C4]/40 flex items-center justify-center text-[#262B27]"><ShieldCheck size={32} /></div>
              <h2 className="text-3xl font-bold font-serif">1. Conexión Segura</h2>
            </div>
            <p className="text-[#657166] text-lg leading-relaxed font-medium mb-6">Mora utiliza el protocolo OAuth 2.0 oficial de Google. Solo solicitamos permisos de lectura. No podemos modificar tu presupuesto ni hacer cambios sin tu consentimiento. Tu cuenta está 100% segura.</p>
          </div>

          {/* Paso 2 */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#99CDD8]/60 rounded-[2rem] p-10 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#99CDD8]/40 flex items-center justify-center text-[#262B27]"><Search size={32} /></div>
              <h2 className="text-3xl font-bold font-serif">2. El Escáner de IA</h2>
            </div>
            <p className="text-[#657166] text-lg leading-relaxed font-medium mb-6">Una vez conectados, nuestro motor impulsado por Gemini analiza el historial de rendimiento de tus campañas. Busca patrones ocultos: keywords irrelevantes, horarios donde gastás pero no vendés, y problemas de segmentación que el ojo humano suele pasar por alto.</p>
          </div>

          {/* Paso 3 */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#F3C3B2]/60 rounded-[2rem] p-10 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#F3C3B2]/40 flex items-center justify-center text-[#262B27]"><FileText size={32} /></div>
              <h2 className="text-3xl font-bold font-serif">3. Diagnóstico y Acción</h2>
            </div>
            <p className="text-[#657166] text-lg leading-relaxed font-medium mb-6">En menos de 3 minutos, Mora te entrega un "Score de Salud" de 0 a 100 y una lista de fugas críticas. Podés exportar este informe en un PDF impecable con tu propio logo para enviárselo a tu cliente, o usar nuestra checklist para ir a Google Ads y arreglar los problemas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}