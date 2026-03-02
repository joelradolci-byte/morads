"use client";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
// IMPORTAMOS LOS ÍCONOS PREMIUM DE LUCIDE
import { Target, Users, Building2, MessageSquare, LogOut, ChevronDown, Zap, AlertTriangle, CheckCircle2, CreditCard, Settings } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Gradientes Melocotón
const melocotonGradient = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)" };
const melocotonText = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [idioma, setIdioma] = useState<"es" | "en">("es");
  // ELIMINAMOS DASHBOARD. La vista por defecto es "nueva" (Auditor)
  const [vista, setVista] = useState<"nueva" | "historial" | "perfil" | "feedback">("nueva");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false); // Dropdown

  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [uploading, setUploading] = useState(false);

  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const t = {
    es: {
      nueva: "Auditor IA", clientes: "Mis Clientes", agencia: "Mi Agencia",
      reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración", salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta", placeholderDatos: "Pegá acá los datos de la campaña...",
      btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF",
      score: "Score General", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes",
    },
    en: {
      nueva: "AI Auditor", clientes: "My Clients", agencia: "My Agency",
      reportes: "Reports", feedback: "Feedback", configuracion: "Settings", salir: "Sign Out",
      placeholderNombre: "Client or Account Name", placeholderDatos: "Paste campaign data here...",
      btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF",
      score: "Overall Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths",
    }
  };

  const descargarPDF = () => window.print();

  const obtenerPerfil = async () => {
    if (!session?.user?.email) return;
    const { data: userProfile } = await supabase.from('suscripciones').select('*').eq('email', session.user.email).single();
    setPerfil(userProfile);
    if (userProfile?.agencia_nombre) setAgenciaNombre(userProfile.agencia_nombre);
    if (userProfile?.agencia_logo) setAgenciaLogo(userProfile.agencia_logo);
  };

  const cargarHistorial = async () => {
    if (!session?.user?.email) return;
    setCargandoHistorial(true);
    const { data: registros, error } = await supabase.from('historial_auditorias').select('*').eq('usuario_email', session.user.email);
    if (!error && registros) setHistorial(registros.reverse()); 
    setCargandoHistorial(false);
  };

  useEffect(() => {
    if (session) obtenerPerfil();
    if (vista === "historial") cargarHistorial();
  }, [vista, session, reporte]);
const subirLogo = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${session?.user?.email}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      setAgenciaLogo(data.publicUrl);
    } catch (error) {
      console.error("Error subiendo logo:", error);
      alert("Error al subir imagen.");
    } finally {
      setUploading(false);
    }
  };

  const guardarAjustesAgencia = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    const { error } = await supabase.from('suscripciones').update({ agencia_nombre: agenciaNombre, agencia_logo: agenciaLogo }).eq('email', session.user.email);
    if (!error) {
      alert("¡Ajustes guardados correctamente!");
      obtenerPerfil();
    }
    setLoading(false);
  };

  const mandarFeedback = async () => {
    if (!mensajeFeedback.trim() || !session?.user?.email) return;
    setEnviandoFeedback(true);
    const { error } = await supabase.from('feedback').insert([{ usuario_email: session.user.email, mensaje: mensajeFeedback }]);
    if (!error) {
      alert("¡Gracias por tu sugerencia!");
      setMensajeFeedback("");
      setVista("nueva"); // Te devuelve al inicio después de enviarlo
    } else {
      alert("Error enviando feedback.");
    }
    setEnviandoFeedback(false);
  };
  const analizarCampaña = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const idiomaInstruccion = idioma === 'es' ? 'ESPAÑOL' : 'INGLÉS';
      
      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta. IMPORTANTE: Los valores de "titulo" y "descripcion" DEBEN estar redactados en ${idiomaInstruccion}.
      { "score_general": 45, "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40}, "hallazgos": { "graves_rojo": [{"titulo": "Problema", "descripcion": "Detalle"}], "debiles_amarillo": [{"titulo": "Mejora", "descripcion": "Detalle"}], "bien_verde": [{"titulo": "Acierto", "descripcion": "Detalle"}] } }
      Datos a analizar: ${data}`;
      
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().replace(/```json|```/g, "");
      const parsedReporte = JSON.parse(text);
      
      setReporte(parsedReporte);
      await supabase.from('historial_auditorias').insert([{ usuario_email: session.user.email, score: parsedReporte.score_general, reporte_json: parsedReporte, nombre_cuenta: nombreCuenta || "Sin nombre" }]);
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error al analizar los datos. Revisá la consola.");
    }
    setLoading(false);
  };

  if (status === "loading") return <div className="h-screen w-full flex justify-center items-center text-xl font-bold text-white">Cargando...</div>;

  // ==========================================
  // LANDING PAGE (DESLOGUEADO)
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen w-full font-sans text-slate-200 relative overflow-hidden flex flex-col items-center">
        <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-lg" style={melocotonGradient}>M</div>
            <span className="font-bold text-xl tracking-wide">Mora</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <span className="text-white cursor-pointer">Home</span>
            <span className="hover:text-white cursor-pointer transition-colors">About</span>
            <span className="hover:text-white cursor-pointer transition-colors">Product</span>
            <span className="hover:text-white cursor-pointer transition-colors">Pricing</span>
          </div>
          <button onClick={() => signIn("google")} className="text-[#0a0a0c] px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,164,189,0.5)]" style={melocotonGradient}>
            Get Started
          </button>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 z-20 mt-10 max-w-3xl mx-auto">
          <div className="border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full" style={melocotonGradient}></span>
             Auditorías Nivel Agencia
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
            Detectá fugas de dinero con <br />
            <span style={melocotonText}>Inteligencia Artificial.</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Conectá tu cuenta de Google Ads y dejá que nuestra Inteligencia Artificial audite tus campañas y genere reportes marca blanca en segundos.
          </p>
          <button onClick={() => signIn("google")} className="text-[#0a0a0c] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,164,189,0.4)]" style={melocotonGradient}>
            Comenzar Gratis
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD APP (LOGUEADO) - TRUE GLASSMORPHISM
  // ==========================================
  return (
    <div className="flex h-screen w-full font-sans text-slate-200 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 flex flex-col justify-between print:hidden z-20 shadow-2xl">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
             <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-lg" style={melocotonGradient}>M</div>
             <span className="text-xl font-black text-white tracking-wide">Mora</span>
          </div>

          <div className="p-4 space-y-2 mt-4">
            {[ 
              { icon: Target, text: t[idioma].nueva, view: 'nueva' }, 
              { icon: Users, text: t[idioma].clientes, view: 'historial' }, 
              { icon: Building2, text: t[idioma].agencia, view: 'perfil' }
            ].map((link, idx) => (
              <button 
                key={idx}
                onClick={() => { setVista(link.view as any); setReporte(null); setMostrarPagos(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${ vista === link.view ? "bg-white/10 text-white shadow-sm border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white" }`}
              >
                <div className={vista === link.view ? "text-[#FFA4BD]" : ""}><link.icon size={20} strokeWidth={vista === link.view ? 2.5 : 2} /></div> 
                {link.text}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-y-auto z-10">
        
        {/* HEADER SUPERIOR CON DROPDOWN PERFIL */}
        <header className="h-20 flex justify-between items-center px-8 print:hidden border-b border-white/5 bg-white/[0.01] backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {vista === 'nueva' && t[idioma].nueva}
            {vista === 'historial' && t[idioma].clientes}
            {vista === 'perfil' && 'Marca Blanca'}
            {vista === 'feedback' && 'Buzón de Sugerencias'}
          </h2>
          
          <div className="relative">
             <button onClick={() => setMenuPerfil(!menuPerfil)} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors border border-transparent hover:border-white/10">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-white leading-tight">{session.user?.name}</p>
                  <p className="text-xs text-[#FFA4BD] font-medium">{perfil?.plan === 'pro' ? 'Plan Pro' : 'Plan Free'}</p>
                </div>
                <img src={session.user?.image || ""} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-[#FEAFAE] shadow-sm" />
                <ChevronDown size={16} className="text-slate-400" />
             </button>

             {/* MENÚ DESPLEGABLE DE CRISTAL */}
             {menuPerfil && (
               <div className="absolute right-0 mt-2 w-64 bg-[#0f0f13]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-white/5">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Suscripción</p>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                       <span className="text-sm font-bold text-white">Activa ({perfil?.plan === 'pro' ? 'Pro' : 'Free'})</span>
                     </div>
                     {perfil?.plan === 'pro' && <p className="text-xs text-slate-400">Renueva: 15 Abril 2026</p>}
                  </div>

                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Settings size={16} /> Configuración General
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <CreditCard size={16} /> Ver Facturación
                    </button>
                    <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <GlobeIcon /> Idioma: {idioma === "es" ? "Español" : "English"}
                    </button>
                  </div>

                  <div className="border-t border-white/5 mt-1 pt-2">
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                      <LogOut size={16} /> {t[idioma].salir}
                    </button>
                  </div>
               </div>
             )}
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full print:p-0">
          
          {/* NUEVA AUDITORÍA */}
          {vista === "nueva" && (
            <div className="print:hidden">
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-[2rem] shadow-2xl mb-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-lg" style={melocotonGradient}><Zap size={24} /></div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Auditor Inteligente</h1>
                    <p className="text-slate-400 mt-1">Pegá los datos de la campaña y detectá oportunidades de mejora.</p>
                  </div>
                </div>
                <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl mb-4 text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
                <textarea className="w-full h-48 p-4 bg-black/20 border border-white/10 rounded-2xl mb-6 text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all resize-none" placeholder={t[idioma].placeholderDatos} value={data} onChange={(e) => setData(e.target.value)} />
                <button onClick={analizarCampaña} disabled={loading || !data} className="w-full text-black px-6 py-4 rounded-2xl font-bold text-lg hover:scale-[1.01] disabled:opacity-50 transition-all shadow-lg flex justify-center items-center gap-2" style={melocotonGradient}>
                  {loading ? <span className="animate-pulse">{t[idioma].btnAnalizando}</span> : <><Target size={20}/> {t[idioma].btnAnalizar}</>}
                </button>
              </div>

              {/* REPORTE (AQUÍ ESTÁ EL ARREGLO: SOLO APARECE SI VISTA ES 'NUEVA' Y HAY REPORTE) */}
              {reporte && !mostrarPagos && (
                <div className="mt-8 bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:mt-0 animate-fade-in">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-sm">{nombreCuenta || '---'}</h2>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border-[6px] border-black/20 text-3xl font-black text-[#0a0a0c] shadow-lg" style={melocotonGradient}>{reporte.score_general}</div>
                        <h3 className="text-4xl font-bold text-white">{t[idioma].score}</h3>
                      </div>
                    </div>
                    <button onClick={descargarPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all print:hidden shadow-sm">Exportar PDF</button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 pl-6 bg-red-500/5 p-6 rounded-2xl border border-red-500/10" style={{ borderLeftColor: '#ef4444' }}>
                      <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle size={24}/> {t[idioma].problemas}</h3>
                      {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => <p key={i} className="mb-3 text-slate-300 leading-relaxed"><b className="text-white text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>)}
                    </div>
                    <div className="border-l-4 pl-6 bg-yellow-500/5 p-6 rounded-2xl border border-yellow-500/10" style={{ borderLeftColor: '#eab308' }}>
                      <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2"><Zap size={24}/> {t[idioma].mejoras}</h3>
                      {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => <p key={i} className="mb-3 text-slate-300 leading-relaxed"><b className="text-white text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>)}
                    </div>
                    <div className="border-l-4 pl-6 bg-green-500/5 p-6 rounded-2xl border border-green-500/10" style={{ borderLeftColor: '#22c55e' }}>
                      <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2"><CheckCircle2 size={24}/> {t[idioma].aciertos}</h3>
                      {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => <p key={i} className="mb-3 text-slate-300 leading-relaxed"><b className="text-white text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA: HISTORIAL */}
          {vista === "historial" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Users size={24} /></div>
                 <h2 className="text-3xl font-bold text-white">{t[idioma].clientes}</h2>
              </div>
              
              {historial.length === 0 ? (
                 <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02]">
                    <p className="text-slate-400 font-medium">Aún no auditaste ninguna cuenta.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historial.map((item, index) => (
                    <div key={index} className="border border-white/10 bg-black/20 p-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center group" onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta); setVista("nueva"); }}>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{item.nombre_cuenta}</h3>
                        <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Ver reporte completo →</p>
                      </div>
                      <span className="text-[#0a0a0c] px-4 py-2 rounded-xl text-sm font-black shadow-md" style={melocotonGradient}>{item.score} / 100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA: MI AGENCIA */}
          {vista === "perfil" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto animate-fade-in">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Building2 size={24} /></div>
                 <div>
                    <h2 className="text-3xl font-bold text-white">{t[idioma].agencia}</h2>
                    <p className="text-slate-400 mt-1">Personalizá los PDFs que le enviás a tus clientes.</p>
                 </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Nombre de la Agencia</label>
                  <input type="text" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Logo (Aparecerá en el PDF)</label>
                  <div className="flex items-center gap-6 p-4 border border-white/10 rounded-xl bg-black/20">
                    {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-20 h-20 object-contain rounded-xl bg-white p-2" /> : <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 text-xs text-center p-2 border border-dashed border-white/20">Sube un logo</div>}
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-400 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all" />
                    </div>
                  </div>
                </div>
                <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full text-black px-8 py-4 rounded-xl font-bold hover:scale-[1.02] disabled:opacity-50 transition-all shadow-lg mt-4" style={melocotonGradient}>
                  {loading ? "Guardando..." : "Guardar Ajustes"}
                </button>
              </div>
            </div>
          )}

          {/* VISTA: FEEDBACK */}
          {vista === "feedback" && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto text-center animate-fade-in">
              <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><MessageSquare size={32} /></div></div>
              <h2 className="text-3xl font-bold mb-3 text-white">Ayudanos a mejorar Mora</h2>
              <p className="text-slate-400 mb-8 font-medium">¿Encontraste un bug o tenés una idea genial?</p>
              <textarea className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-2xl mb-6 text-white focus:border-[#FEAFAE] focus:outline-none resize-none transition-all" placeholder="Escribí tu sugerencia acá..." value={mensajeFeedback} onChange={(e) => setMensajeFeedback(e.target.value)} />
              <button onClick={mandarFeedback} disabled={enviandoFeedback || !mensajeFeedback} className="w-full text-black px-8 py-4 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02]" style={melocotonGradient}>
                {enviandoFeedback ? "Enviando..." : "Enviar Sugerencia"}
              </button>
            </div>
          )}

        </div>

        {/* BOTÓN FLOTANTE DE SUGERENCIA */}
        <button onClick={() => setVista("feedback")} className="fixed bottom-8 right-8 bg-white/10 text-white px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-white/20 print:hidden backdrop-blur-md">
          <MessageSquare size={18} /> {t[idioma].feedback}
        </button>

      </main>
    </div>
  );
}

// Icono global para el idioma
const GlobeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>)

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}