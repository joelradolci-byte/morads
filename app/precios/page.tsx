import { CheckCircle2, Minus, ArrowLeft } from "lucide-react";

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-5xl md:text-6xl font-black mb-6 text-center tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Comparar Planes</h1>
        <p className="text-xl text-[#657166] mb-16 font-medium text-center">Encontrá el plan que mejor se adapte al tamaño de tus campañas o de tu agencia.</p>
        
        <div className="bg-white/80 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-[2rem] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#CFD6C4]/20 border-b border-[#CFD6C4]/50">
                <th className="p-6 font-serif text-2xl w-1/3">Funcionalidad</th>
                <th className="p-6 font-bold text-center w-2/9 border-l border-[#CFD6C4]/30">Starter <br/><span className="text-[#657166] font-medium text-sm">$0/mes</span></th>
                <th className="p-6 font-bold text-center w-2/9 border-l border-[#CFD6C4]/30 bg-[#99CDD8]/10">Individual <br/><span className="text-[#657166] font-medium text-sm">$19/mes</span></th>
                <th className="p-6 font-bold text-center w-2/9 border-l border-[#CFD6C4]/30">Agency <br/><span className="text-[#657166] font-medium text-sm">$49/mes</span></th>
              </tr>
            </thead>
            <tbody className="text-[#657166] font-medium">
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-white/50 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Límite de Cuentas (Google Ads)</td>
                <td className="p-6 text-center">1</td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Hasta 3</td>
                <td className="p-6 text-center font-bold">Ilimitadas</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-white/50 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Auditorías con IA (Gemini Pro)</td>
                <td className="p-6 text-center flex justify-center"><CheckCircle2 className="text-[#DAEBE3]" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5"><CheckCircle2 className="text-[#99CDD8] mx-auto" /></td>
                <td className="p-6 text-center"><CheckCircle2 className="text-[#F3C3B2] mx-auto" /></td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-white/50 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Exportación de Reportes PDF</td>
                <td className="p-6 text-center flex justify-center"><Minus className="text-[#657166]/30" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Con Logo de Mora</td>
                <td className="p-6 text-center font-bold text-[#262B27]">100% Marca Blanca</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-white/50 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Dashboard Multi-Cliente</td>
                <td className="p-6 text-center flex justify-center"><Minus className="text-[#657166]/30" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5"><Minus className="text-[#657166]/30 mx-auto" /></td>
                <td className="p-6 text-center"><CheckCircle2 className="text-[#F3C3B2] mx-auto" /></td>
              </tr>
              <tr className="hover:bg-white/50 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Soporte Técnico</td>
                <td className="p-6 text-center">Comunidad</td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Email (48hs)</td>
                <td className="p-6 text-center font-bold">Prioritario (1h)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}