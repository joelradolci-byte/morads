import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2] px-6 py-20">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-[#CFD6C4]/60 p-10 md:p-16 rounded-[2rem] shadow-xl">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Términos y Condiciones</h1>
        <p className="text-[#657166] mb-8 font-bold">Sitio Web Oficial: <a href="https://mora-analytics.com" className="text-[#99CDD8] underline">https://mora-analytics.com</a></p>
        
        <div className="space-y-10 text-[#657166] leading-relaxed font-medium">
          <p className="text-sm uppercase tracking-widest font-bold text-[#99CDD8]">Última actualización: 1 de junio de 2026.</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>1. Transparencia y Control (Cláusula de Copiloto)</h2>
            <p>El uso de la plataforma <strong>Mora Analytics</strong> se rige bajo un modelo de &quot;Copiloto&quot;. Esto implica que:</p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li><strong>Supervisión Humana Obligatoria:</strong> Mora actúa como una herramienta de diagnóstico que sugiere optimizaciones. El usuario es el único responsable de validar, revisar y confirmar la pertinencia de dichos cambios antes de aplicarlos.</li>
              <li><strong>Responsabilidad del Propietario:</strong> La decisión estratégica final y la ejecución de ajustes en la plataforma de Google Ads recaen exclusivamente sobre el titular de la cuenta o el gestor autorizado.</li>
              <li><strong>Safe Apply (Mora Watchdog):</strong> Las funciones que aplican cambios en Google Ads solo lo hacen tras tu confirmación explícita en la interfaz. Sin esa confirmación no se ejecutan ajustes.</li>
              <li><strong>Red de Seguridad:</strong> Las acciones aplicadas mediante Safe Apply pueden revertirse cuando la plataforma de Google Ads lo permita; el usuario debe validar el impacto de cada cambio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>2. Descargo de Responsabilidad (ROAS y Rendimiento)</h2>
            <p>Mora Analytics proporciona sugerencias basadas en análisis de datos, pero <strong>no garantiza</strong> aumentos específicos en el Retorno de Inversión (ROAS), volumen de conversiones ni disminuciones en el costo por adquisición (CPA). Mora Analytics y sus desarrolladores quedan eximidos de cualquier reclamo por pérdidas financieras o resultados publicitarios negativos derivados de la aplicación de las sugerencias de la IA.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>3. Suscripciones y Gestión de Pagos</h2>
            <p><strong>Evaluación:</strong> 14 días sin tarjeta al conectar Google Ads (con email confirmado), con los límites publicados en la página de <Link href="/precios" className="text-[#99CDD8] underline hover:text-[#262B27]">Precios</Link> (2 auditorías, 1 generación de anuncios RSA, 1 PDF con marca Mora). Un solo periodo de evaluación por dirección de email. Tras finalizar la evaluación, el acceso queda limitado a la lectura de la última auditoría hasta activar Mora Watchdog.</p>
            <p className="mt-4"><strong>Mora Watchdog:</strong> suscripción mensual de <strong>USD 26.99</strong>, procesada por <strong>Lemon Squeezy</strong> como merchant of record. El acceso se activa con el mismo email utilizado en la compra. Podés cancelar en cualquier momento desde el portal de pagos de Lemon Squeezy; el acceso continúa hasta el final del período ya facturado.</p>
            <p className="mt-4"><strong>Precios:</strong> podemos actualizar los precios o límites de Mora Watchdog con aviso razonable en el sitio web.</p>
            <p className="mt-4"><strong>Reembolsos:</strong> salvo obligación legal aplicable en tu jurisdicción, no ofrecemos reembolsos prorrateados por cancelación a mitad de período. Las disputas de cargo y solicitudes de reembolso se gestionan según las políticas de Lemon Squeezy. Para consultas: <strong>contacto@mora-analytics.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>4. Propiedad Intelectual</h2>
            <p>Los usuarios de <strong>Mora Watchdog</strong> pueden exportar reportes PDF con <strong>marca blanca</strong> (logo de su agencia u organización). El software, código fuente, algoritmos de procesamiento y prompts propietarios de inteligencia artificial siguen siendo propiedad intelectual exclusiva de Mora Analytics.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>5. Cumplimiento de Políticas de Google Ads</h2>
            <p>Es responsabilidad exclusiva del usuario asegurar que sus campañas cumplan con las <a href="https://support.google.com/adspolicy/answer/6008942" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#262B27]">Políticas Oficiales de Publicidad de Google</a>. Mora Analytics no se responsabiliza por suspensiones de cuenta o rechazos de anuncios emitidos por Google.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>6. Suspensión del Servicio</h2>
            <p>Nos reservamos el derecho de terminar el acceso a la plataforma en caso de detectar uso abusivo de la API, intentos de ingeniería inversa de nuestros algoritmos, reventa no autorizada o impagos de la suscripción.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#262B27] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>7. Contacto</h2>
            <p>Para cualquier consulta legal o técnica sobre estos términos, por favor contáctanos en: <strong>contacto@mora-analytics.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}