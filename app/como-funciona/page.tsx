import Link from "next/link";
import { Search, Zap, FileText, ArrowLeft, ShieldCheck, Database, LineChart, BrainCircuit, Compass } from "lucide-react";

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>El Motor de Mora</h1>
          <p className="text-xl text-[#657166] font-medium leading-relaxed">Descubrí cómo nuestra inteligencia artificial analiza miles de puntos de datos en segundos para encontrar exactamente dónde estás perdiendo dinero.</p>
        </div>
        
        {/* Los 3 Pasos Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-[2rem] p-10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#CFD6C4]/30 rounded-full blur-3xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-[#CFD6C4]/40 flex items-center justify-center text-[#262B27] mb-6 relative z-10"><ShieldCheck size={32} /></div>
            <h2 className="text-2xl font-bold font-serif mb-4 relative z-10">1. Conexión Segura</h2>
            <p className="text-[#657166] leading-relaxed font-medium relative z-10">Mora utiliza el protocolo OAuth 2.0 oficial de Google. Solo solicitamos permisos de lectura. No podemos modificar tu presupuesto ni hacer cambios sin tu consentimiento.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-[#99CDD8]/60 rounded-[2rem] p-10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#99CDD8]/30 rounded-full blur-3xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-[#99CDD8]/40 flex items-center justify-center text-[#262B27] mb-6 relative z-10"><Search size={32} /></div>
            <h2 className="text-2xl font-bold font-serif mb-4 relative z-10">2. El Escáner de IA</h2>
            <p className="text-[#657166] leading-relaxed font-medium relative z-10">Nuestro motor impulsado por Gemini analiza el historial de rendimiento buscando patrones ocultos: keywords irrelevantes, horarios de gasto ineficiente y problemas de segmentación.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl border border-[#F3C3B2]/60 rounded-[2rem] p-10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#F3C3B2]/30 rounded-full blur-3xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-[#F3C3B2]/40 flex items-center justify-center text-[#262B27] mb-6 relative z-10"><FileText size={32} /></div>
            <h2 className="text-2xl font-bold font-serif mb-4 relative z-10">3. Acción y Reporte</h2>
            <p className="text-[#657166] leading-relaxed font-medium relative z-10">Te entregamos un "Score de Salud" y una lista de fugas críticas. Podés exportar un PDF impecable marca blanca o usar la checklist para arreglar los problemas vos mismo.</p>
          </div>
        </div>

        {/* ROADMAP / ECOSISTEMA MORA */}
        <div className="border-t border-[#CFD6C4] pt-20">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#99CDD8] mb-2">Roadmap de Desarrollo</p>
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>El Ecosistema Mora</h2>
            <p className="text-lg text-[#657166] font-medium">Mora no es solo un escáner. Estamos construyendo la suite definitiva para la gestión avanzada y retención de clientes en Google Ads. Esto es lo que se viene:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grupo 1 */}
            <div className="bg-white/80 backdrop-blur-md border border-[#CFD6C4]/80 p-8 rounded-3xl shadow-sm hover:border-[#99CDD8] transition-colors">
              <h3 className="text-xl font-bold text-[#262B27] mb-6 flex items-center gap-3 border-b border-[#CFD6C4]/50 pb-4"><Database size={24} className="text-[#99CDD8]"/> Conexión & Memoria Absoluta</h3>
              <ul className="space-y-4 text-[#657166] font-medium text-sm">
                <li><strong className="text-[#262B27]">Integración Nativa (OAuth):</strong> El motor invisible. Extracción automática de datos de los últimos meses, sin copiar ni pegar.</li>
                <li><strong className="text-[#262B27]">Instantáneas Semanales (Snapshots):</strong> Memoria a largo plazo que guarda una "foto" del estado de tu cuenta cada semana en bases de datos seguras.</li>
              </ul>
            </div>

            {/* Grupo 2 */}
            <div className="bg-white/80 backdrop-blur-md border border-[#CFD6C4]/80 p-8 rounded-3xl shadow-sm hover:border-[#F3C3B2] transition-colors">
              <h3 className="text-xl font-bold text-[#262B27] mb-6 flex items-center gap-3 border-b border-[#CFD6C4]/50 pb-4"><Compass size={24} className="text-[#F3C3B2]"/> Inteligencia Financiera</h3>
              <ul className="space-y-4 text-[#657166] font-medium text-sm">
                <li><strong className="text-[#262B27]">GPS del Presupuesto (Pacing):</strong> Sugerencias matemáticas en tiempo real para alcanzar tus objetivos de gasto a fin de mes.</li>
                <li><strong className="text-[#262B27]">Estrategia "Robin Hood":</strong> Detección automática para quitarle presupuesto a los anuncios malos y dárselo a los rentables.</li>
                <li><strong className="text-[#262B27]">Calculadora de Escalamiento:</strong> Simulación predictiva (Performance Planner) para calcular cuántas conversiones ganarías si aumentás la inversión.</li>
              </ul>
            </div>

            {/* Grupo 3 */}
            <div className="bg-white/80 backdrop-blur-md border border-[#CFD6C4]/80 p-8 rounded-3xl shadow-sm hover:border-[#DAEBE3] transition-colors">
              <h3 className="text-xl font-bold text-[#262B27] mb-6 flex items-center gap-3 border-b border-[#CFD6C4]/50 pb-4"><LineChart size={24} className="text-[#DAEBE3]"/> Análisis Evolutivo & Retención</h3>
              <ul className="space-y-4 text-[#657166] font-medium text-sm">
                <li><strong className="text-[#262B27]">Gráfico Evolutivo de Retención:</strong> La herramienta definitiva para agencias. Mostrale a tu cliente el "Antes y Después" visual de su Score para demostrar tu valor.</li>
                <li><strong className="text-[#262B27]">Gráficos de Tendencia & Fechas:</strong> Visualizá la curva del Score y el ROAS interactuando mes a mes con un selector de períodos.</li>
                <li><strong className="text-[#262B27]">Deltas Reales:</strong> Matemáticas exactas de incremento o caída porcentual en tus KPIs principales.</li>
              </ul>
            </div>

            {/* Grupo 4 */}
            <div className="bg-white/80 backdrop-blur-md border border-[#CFD6C4]/80 p-8 rounded-3xl shadow-sm hover:border-[#262B27] transition-colors">
              <h3 className="text-xl font-bold text-[#262B27] mb-6 flex items-center gap-3 border-b border-[#CFD6C4]/50 pb-4"><BrainCircuit size={24} className="text-[#262B27]"/> El Motor Gemini 3.1</h3>
              <ul className="space-y-4 text-[#657166] font-medium text-sm">
                <li><strong className="text-[#262B27]">Razonamiento Basado en Hechos:</strong> Cada sugerencia de la IA vendrá con una explicación técnica detallada del "porqué".</li>
                <li><strong className="text-[#262B27]">Salud Competitiva (Auction Insights):</strong> Alertas tempranas visuales de quién te está robando cuota de mercado.</li>
                <li><strong className="text-[#262B27]">Detector por Segmentación:</strong> Encuentra gasto ineficiente oculto en dispositivos, horarios o ubicaciones específicas.</li>
                <li><strong className="text-[#262B27]">Monitor de Impacto:</strong> Relación visual directa entre los cambios realizados y la subida de la salud de la cuenta.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}