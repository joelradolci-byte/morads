import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-[#FEAFAE] selection:text-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10 font-medium">
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/10 text-white">
            <Shield size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Política de Privacidad</h1>
        </div>
        
        <div className="space-y-8 text-slate-400 leading-relaxed bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Última actualización: Marzo 2026</p>
          
          <p>En Mora Analytics ("nosotros", "nuestro", "la plataforma"), respetamos y protegemos la privacidad de nuestros usuarios. Esta política explica cómo recopilamos, utilizamos y protegemos la información cuando utilizas nuestro software B2B para agencias.</p>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Información que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Datos de la cuenta:</strong> Al registrarte mediante Google (OAuth), recopilamos tu nombre, dirección de correo electrónico y foto de perfil.</li>
              <li><strong>Datos de Google Ads:</strong> Cuando vinculas tu cuenta de Google Ads a través de nuestra integración oficial, accedemos a métricas de rendimiento, presupuestos, nombres de campañas y estructura de anuncios.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. Cómo utilizamos la información</h2>
            <p className="mb-3">Utilizamos la información recopilada exclusivamente para proporcionar y mejorar nuestro servicio:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Generar auditorías automatizadas mediante Inteligencia Artificial.</li>
              <li>Proyectar el ritmo de gasto (Pacing) de las cuentas publicitarias.</li>
              <li>Proporcionar recomendaciones de optimización.</li>
            </ul>
            <p className="mt-3 text-white font-medium">No utilizamos tus datos de Google Ads para entrenar modelos de IA públicos ni vendemos esta información a terceros bajo ninguna circunstancia.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Cumplimiento con la Política de Google API</h2>
            <p>El uso y la transferencia por parte de Mora Analytics de cualquier información recibida de las API de Google a cualquier otra aplicación se ajustará a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#FEAFAE] hover:underline">Política de datos de usuario de los servicios API de Google</a>, incluidos los requisitos de Uso Limitado (Limited Use requirements).</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Almacenamiento y Seguridad</h2>
            <p>Los datos se almacenan de forma segura utilizando proveedores de infraestructura en la nube líderes en la industria. Puedes eliminar el historial de tus auditorías y revocar el acceso a Google Ads en cualquier momento desde tu panel de configuración o directamente desde tu cuenta de Google.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. Contacto</h2>
            <p>Si tienes dudas sobre tu privacidad, puedes contactarnos en: <span className="text-[#FEAFAE] font-medium">soporte@tuagencia.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}