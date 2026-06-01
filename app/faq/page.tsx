import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-5xl mx-auto px-8 md:px-10 py-24">
        <Link href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Preguntas Frecuentes</h1>
        <p className="text-xl text-[#657166] mb-16 font-medium text-center">Despejá todas tus dudas sobre Mora, la seguridad y las suscripciones.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Mora puede arruinar mis campañas si la IA se equivoca?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">No. Mora funciona con una "Cláusula de Copiloto". Somos una herramienta de asistencia y diagnóstico. Mora te sugiere qué cambiar, pero vos tenés el control total y sos quien aplica los ajustes. Además, las acciones implementadas mantienen un mecanismo de Deshacer (Undo).</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Qué necesito para que Mora funcione bien?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Para que nuestra inteligencia artificial pueda darte sugerencias precisas, necesitás tener una cuenta de Google Ads activa y con al menos 30 días de historial de datos de gasto y conversiones.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Qué es la marca blanca en PDF?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Con Mora Pro podés exportar reportes con el nombre de tu negocio y logo (si lo cargás en Configuración). En la evaluación gratuita el PDF incluye marca de agua Mora para que veas la calidad del informe.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Entrenan a la IA con los datos de mis clientes?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">De ninguna manera. El rendimiento de tus campañas pasa por APIs de IA (OpenAI y Anthropic) estrictamente para generar tu reporte en ese instante. Los datos no son utilizados para entrenar modelos fundacionales públicos según los términos de cada proveedor.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Puedo auditar campañas de Performance Max?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Sí, la IA de Mora está capacitada para auditar campañas de Búsqueda (Search), Performance Max, Display, Shopping y YouTube (Video), adaptando las métricas de análisis a la naturaleza de cada campaña.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Es seguro darle acceso a mis cuentas a Mora?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Totalmente seguro. Utilizamos el sistema oficial de autenticación de Google (OAuth). Solo solicitamos permisos de "Lectura". Mora no puede cambiar tu presupuesto de forma encubierta ni robar accesos.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Cómo funciona la evaluación gratuita?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Al conectar tu cuenta de Google Ads tenés 14 días para usar 2 auditorías completas, 1 generación de anuncios y 1 PDF de muestra (con marca Mora), sin tarjeta. Después podés activar Pro ($27/mes) para seguir optimizando. Un trial por email.</p>
          </div>

        </div>
      </div>
    </div>
  );
}