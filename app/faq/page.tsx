import { ArrowLeft } from "lucide-react";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-center gap-2 mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Preguntas Frecuentes</h1>
        <p className="text-xl text-[#657166] mb-16 font-medium text-center">Despejá todas tus dudas sobre Mora, la seguridad y las suscripciones.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Mora puede arruinar mis campañas si la IA se equivoca?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">No. Mora funciona con una "Cláusula de Copiloto". Somos una herramienta de asistencia y diagnóstico. Mora te sugiere qué cambiar, pero el usuario es el que tiene la decisión final y quien aplica los ajustes. Además, todas las acciones cuentan con un mecanismo de Undo (Deshacer) de seguridad.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Qué necesito para que Mora funcione bien?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Para que nuestra inteligencia artificial pueda darte sugerencias precisas, necesitás tener una cuenta de Google Ads activa y con al menos 30 días de historial de datos de gasto y conversiones.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Qué significa el "Plan Agency" con Marca Blanca?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Te permite exportar los reportes en PDF eliminando el branding de Mora para aplicar el logotipo y los colores de tu propia agencia. Esto te ayuda a entregar auditorías de calidad corporativa manteniendo una presencia de marca profesional frente a tus clientes.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Entrenan a la IA con los datos de mis clientes?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">De ninguna manera. El rendimiento de tus campañas pasa por la API de Google Gemini estrictamente para generar tu reporte en ese instante. Los datos no son utilizados para entrenar modelos fundacionales públicos.</p>
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
            <h3 className="text-xl font-bold text-[#262B27] mb-3">¿Cómo funciona el período de prueba?</h3>
            <p className="text-[#657166] font-medium leading-relaxed">Todos los planes pagos vienen con 14 días de prueba gratuita y acceso total a sus funciones. Podés cancelar en cualquier momento desde tu panel de facturación con un solo clic. Sin correos ni demoras.</p>
          </div>

        </div>
      </div>
    </div>
  );
}