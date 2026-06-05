import Link from "next/link";
import { CheckCircle2, Minus, ArrowLeft } from "lucide-react";

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-5xl mx-auto px-8 md:px-10 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <h1
          className="text-5xl md:text-6xl font-black mb-6 text-center tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Planes Mora
        </h1>
        <p className="text-xl text-[#657166] mb-16 font-medium text-center max-w-2xl mx-auto">
          14 días de evaluación sin tarjeta al conectar Google Ads. Watchdog para optimizar tu cuenta cada
          semana.
        </p>

        <div className="bg-white border border-[#CFD6C4]/80 rounded-[2rem] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#262B27] text-[#FDE8D3]">
              <tr>
                <th className="p-6 font-serif text-xl w-1/3 font-medium">Funcionalidad</th>
                <th className="p-6 text-center w-1/3 border-l border-white/10">
                  <p className="font-bold text-xl text-[#DAEBE3] mb-1">Evaluación</p>
                  <span className="text-[#CFD6C4] font-medium text-sm">$0 · 14 días</span>
                </th>
                <th className="p-6 text-center w-1/3 border-l border-white/10 bg-white/5">
                  <p className="font-bold text-xl text-[#F3C3B2] mb-1">Watchdog</p>
                  <span className="text-[#CFD6C4] font-medium text-sm">$27/mes</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-[#657166] font-medium text-sm md:text-base">
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">Inicio del trial</td>
                <td className="p-5 text-center">Al elegir cuenta Google Ads</td>
                <td className="p-5 text-center bg-[#99CDD8]/5">—</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">Auditorías con IA</td>
                <td className="p-5 text-center">2 en total</td>
                <td className="p-5 text-center bg-[#99CDD8]/5 font-bold text-[#262B27]">
                  Hasta 30 / mes
                </td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">Generar anuncios (RSA)</td>
                <td className="p-5 text-center">1 en total</td>
                <td className="p-5 text-center bg-[#99CDD8]/5">Hasta 20 / mes</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">PDF auditoría</td>
                <td className="p-5 text-center">1 (marca Mora)</td>
                <td className="p-5 text-center bg-[#99CDD8]/5">Hasta 60 / mes · marca blanca</td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">PDF comparación</td>
                <td className="p-5 text-center">
                  <Minus className="mx-auto text-[#657166]/40" />
                </td>
                <td className="p-5 text-center bg-[#99CDD8]/5">
                  <CheckCircle2 className="mx-auto text-[#99CDD8]" />
                </td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">Aplicar cambios en Google Ads</td>
                <td className="p-5 text-center">
                  <Minus className="mx-auto text-[#657166]/40" />
                </td>
                <td className="p-5 text-center bg-[#99CDD8]/5">
                  <CheckCircle2 className="mx-auto text-[#99CDD8]" />
                </td>
              </tr>
              <tr className="border-b border-[#CFD6C4]/30">
                <td className="p-5 font-bold text-[#262B27]">Historial y comparación</td>
                <td className="p-5 text-center">Última auditoría</td>
                <td className="p-5 text-center bg-[#99CDD8]/5">Completo</td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-[#262B27]">Tarjeta para empezar</td>
                <td className="p-5 text-center">No</td>
                <td className="p-5 text-center bg-[#99CDD8]/5">Sí (Lemon Squeezy)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-[#657166] mt-10 font-medium">
          Un trial por email. Después del día 14, lectura de la última auditoría hasta activar Watchdog.
        </p>
      </div>
    </div>
  );
}
