import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terminos() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-[#FEAFAE] selection:text-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10 font-medium">
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/10 text-white">
            <FileText size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Términos y Condiciones</h1>
        </div>
        
        <div className="space-y-8 text-slate-400 leading-relaxed bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Última actualización: Marzo 2026</p>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar Mora Analytics, aceptas estar sujeto a estos términos. Si no estás de acuerdo con alguna parte, no debes utilizar la plataforma.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. Descripción del Servicio</h2>
            <p>Mora es una herramienta de software como servicio (SaaS) que proporciona análisis, auditorías y proyecciones para cuentas de Google Ads utilizando Inteligencia Artificial.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Responsabilidad del Usuario</h2>
            <p>Al conectar una cuenta de Google Ads a Mora, declaras y garantizas que tienes la autoridad legal y los permisos necesarios de tus clientes para analizar dichos datos. Mora no se hace responsable por el acceso no autorizado a cuentas de clientes por parte del usuario.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Exención de Responsabilidad (Recomendaciones IA)</h2>
            <p>Mora utiliza algoritmos de Inteligencia Artificial para sugerir optimizaciones y advertencias de presupuesto. Estas sugerencias son de carácter consultivo. <strong className="text-white">El usuario es el único responsable final</strong> de cualquier cambio, pausa o aumento de presupuesto que aplique en las campañas de Google Ads. Mora Analytics no se hace responsable por pérdidas financieras, caídas en el ROAS o variaciones en el rendimiento publicitario derivadas del uso de la plataforma.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Propiedad Intelectual</h2>
            <p>Todo el código, diseño y marca de la plataforma pertenece a Mora Analytics. Los reportes en PDF generados con la función de "Marca Blanca" son propiedad del usuario que los genera para uso exclusivo con sus clientes.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Cancelación y Reembolsos</h2>
            <p>Puedes cancelar tu suscripción en cualquier momento. Los pagos realizados no son reembolsables, pero mantendrás el acceso a las funciones premium hasta que finalice tu ciclo de facturación actual.</p>
          </div>
        </div>
      </div>
    </div>
  );
}