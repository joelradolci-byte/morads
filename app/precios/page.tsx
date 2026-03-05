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
        
        <div className="bg-white border border-[#CFD6C4]/80 rounded-[2rem] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            
            {/* CABECERA OSCURA DE ALTO CONTRASTE */}
            <thead className="bg-[#262B27] text-[#FDE8D3]">
              <tr>
                <th className="p-6 font-serif text-2xl w-1/4 font-medium border-b border-[#262B27]">Funcionalidades</th>
                <th className="p-6 text-center w-1/4 border-l border-white/10 border-b border-[#262B27]">
                  <p className="font-bold text-xl text-[#DAEBE3] mb-1">Starter</p>
                  <span className="text-[#CFD6C4] font-medium text-sm">$0/mes</span>
                </th>
                <th className="p-6 text-center w-1/4 border-l border-white/10 border-b border-[#262B27] bg-white/5">
                  <p className="font-bold text-xl text-[#99CDD8] mb-1">Individual</p>
                  <span className="text-[#CFD6C4] font-medium text-sm">$19/mes</span>
                </th>
                <th className="p-6 text-center w-1/4 border-l border-white/10 border-b border-[#262B27]">
                  <p className="font-bold text-xl text-[#F3C3B2] mb-1">Agency</p>
                  <span className="text-[#CFD6C4] font-medium text-sm">$49/mes</span>
                </th>
              </tr>
            </thead>

            <tbody className="text-[#657166] font-medium text-sm md:text-base">
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold bg-[#CFD6C4]/10">Perfil Ideal</td>
                <td className="p-6 text-center">Curiosos / Testing</td>
                <td className="p-6 text-center bg-[#99CDD8]/5 font-bold text-[#262B27]">Emprendedores</td>
                <td className="p-6 text-center font-bold text-[#262B27]">Agencias / Equipos</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Límite de Cuentas</td>
                <td className="p-6 text-center">1</td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Hasta 3</td>
                <td className="p-6 text-center font-bold text-[#262B27]">Ilimitadas</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Inversión Analizada</td>
                <td className="p-6 text-center">Hasta $1,000/mes</td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Hasta $10,000/mes</td>
                <td className="p-6 text-center font-bold text-[#262B27]">Ilimitado</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Auditorías con IA (Gemini Pro)</td>
                <td className="p-6 text-center flex justify-center"><CheckCircle2 className="text-[#DAEBE3]" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5"><CheckCircle2 className="text-[#99CDD8] mx-auto" /></td>
                <td className="p-6 text-center"><CheckCircle2 className="text-[#F3C3B2] mx-auto" /></td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Exportación de Reportes PDF</td>
                <td className="p-6 text-center flex justify-center"><Minus className="text-[#657166]/30" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Con Logo de Mora</td>
                <td className="p-6 text-center font-black text-[#262B27]">100% Marca Blanca</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30 hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Dashboard Multi-Cliente</td>
                <td className="p-6 text-center flex justify-center"><Minus className="text-[#657166]/30" /></td>
                <td className="p-6 text-center bg-[#99CDD8]/5"><Minus className="text-[#657166]/30 mx-auto" /></td>
                <td className="p-6 text-center"><CheckCircle2 className="text-[#F3C3B2] mx-auto" /></td>
              </tr>
              <tr className="hover:bg-[#FDE8D3]/30 transition-colors">
                <td className="p-6 text-[#262B27] font-bold">Soporte Técnico</td>
                <td className="p-6 text-center">Comunidad</td>
                <td className="p-6 text-center bg-[#99CDD8]/5">Email (48hs)</td>
                <td className="p-6 text-center font-bold text-[#262B27]">Prioritario (1h)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}