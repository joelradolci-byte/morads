import { ArrowLeft } from "lucide-react";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Centro de Ayuda</h1>
        <p className="text-xl text-[#657166] mb-12 font-medium">Todo lo que necesitás saber sobre cómo Mora protege y optimiza tus cuentas.</p>
        
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Mora hace cambios automáticos en mis campañas?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">No. Mora es una herramienta de auditoría y diagnóstico. La IA analiza los datos y te sugiere qué cambiar (ej: "Pausar keyword X"), pero vos tenés el control total y final para aplicar o ignorar esos cambios directamente en tu panel de Google Ads.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Es seguro darle acceso a mis cuentas a Mora?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Totalmente. Utilizamos el sistema oficial de autenticación de Google (OAuth). Solo solicitamos permisos de "Lectura". Mora no puede cambiar tu presupuesto ni eliminar tus anuncios, porque no tiene los permisos técnicos para hacerlo.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Entrenan a la IA con los datos de mis clientes?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">No. El rendimiento de tus campañas pasa por la API de Google Gemini estrictamente para generar tu reporte en el momento, pero Google y Mora se comprometen a no utilizar esos datos privados para entrenar modelos fundacionales públicos.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Qué significa el "Plan Agency" con Marca Blanca?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Significa que podés generar los reportes de auditoría en formato PDF eliminando por completo el logo de Mora. Podés subir el logo de tu propia agencia, elegir los colores y poner el enlace a tu sitio web. Tu cliente pensará que vos desarrollaste la tecnología.</p>
          </div>
        </div>
      </div>
    </div>
  );
}