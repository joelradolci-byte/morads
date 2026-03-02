"use client";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

// 🔌 CONECTAMOS TU BASE DE DATOS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// PALETA CUSTOM DESDE FIGMA
// ==========================================
const melocotonGradient = {
  background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)",
};

const melocotonText = {
  background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// ==========================================
// ICONOS SVG (Minimalistas y limpios)
// ==========================================
const TargetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5m0 3v1.5m3.5-3.5h3v-13.5m-3 13.5h-10.5m1.5 0v3m0 0v1.5m10.5-3.5h3m3-13.5h-16.5m16.5 0v1.5" /></svg>);
const TargetAuditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75l11.25-1.5m0 0l-1.5 11.25m1.5-11.25l-11.25 11.25M12 6.75l-1.5-1.5m0 0L2.25 6.75m1.5-1.5L2.25 6.75m0 0L2.25 6.75m0 0L6.75 6.75m-4.5 0l11.25 11.25" /></svg>);
const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v3m3-4.5v6m3-6.75v7.5m3-12.75l10.5 20.25H2.25l10.5-20.25z" /></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A4.126 4.126 0 0111.25 21a4.126 4.126 0 01-3.75-1.872v-.106M8.25 19.128v.003c.501-.91.786-1.957.786-3.07M8.25 19.128a9.38 9.38 0 012.625.372 9.337 9.337 0 014.121-.952 4.125 4.125 0 01-7.533-2.493M11.25 12a4.125 4.125 0 11-8.25 0 4.125 4.125 0 018.25 0zm0 0l-1.5-1.5M11.25 12a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0z" /></svg>);
const AgencyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18" /></svg>);
const WarningIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 12.376zM12 17.25h.007v.008H12v-.008z" /></svg>);

function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [vista, setVista] = useState<"dashboard" | "nueva" | "historial" | "perfil" | "feedback" | "configuracion">("dashboard");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false);

  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [uploading, setUploading] = useState(false);

  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const t = {
    es: {
      dashboard: "Dashboard", nueva: "Nueva Auditoría", clientes: "Clientes", agencia: "Mi Agencia",
      reportes: "Reportes", feedback: "Feedback", configuracion: "Configuración", salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta", placeholderDatos: "Pegá acá los datos de la campaña...",
      btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF",
      score: "Score General", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes",
    },
    en: {
      dashboard: "Dashboard", nueva: "New Audit", clientes: "Clients", agencia: "My Agency",
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
  // ESTADO DESLOGUEADO: LA LANDING PAGE DE FIGMA
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen w-full font-sans text-slate-200 relative overflow-hidden flex flex-col items-center">
        
        {/* NAVBAR */}
        <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
            {/* Logo estilo Figma */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl" style={melocotonGradient}>M</div>
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

        {/* HERO SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 z-20 mt-10 max-w-3xl mx-auto">
          
          <div className="border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full" style={melocotonGradient}></span>
             Amazing features
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
            Manage Your Data For <br />
            <span style={melocotonText}>Simplified Dashboard.</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Conectá tu cuenta de Google Ads y dejá que nuestra Inteligencia Artificial audite tus campañas, detecte fugas de dinero y genere reportes de nivel agencia en segundos.
          </p>

          <button onClick={() => signIn("google")} className="text-[#0a0a0c] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,164,189,0.4)]" style={melocotonGradient}>
            Get Started Free
          </button>

          {/* TARJETAS GLASS DECORATIVAS ABAJO (Estilo Figma) */}
          <div className="mt-20 flex gap-6 opacity-80 pointer-events-none scale-90 md:scale-100">
             <div className="w-64 h-48 bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6 text-left shadow-2xl flex flex-col justify-center items-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 w-full">AI Audit Score</p>
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: '#FEAFAE' }}>
                  <span className="text-3xl font-black text-white">85</span>
                </div>
             </div>
             
             <div className="w-80 h-48 bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6 text-left shadow-2xl">
                <p className="text-xs text-slate-500 font-bold mb-1">Spendings</p>
                <p className="text-xl font-bold text-white mb-4">Campañas Activas</p>
                <div className="flex items-end gap-2 h-16">
                   <div className="w-4 h-8 rounded-sm bg-white/20"></div>
                   <div className="w-4 h-12 rounded-sm" style={melocotonGradient}></div>
                   <div className="w-4 h-6 rounded-sm bg-white/20"></div>
                   <div className="w-4 h-16 rounded-sm" style={melocotonGradient}></div>
                   <div className="w-4 h-10 rounded-sm bg-white/20"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ESTADO LOGUEADO: EL DASHBOARD EN MODO DARK GLASS
  // ==========================================
  return (
    <div className="flex h-screen w-full font-sans text-slate-200 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between print:hidden z-20">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
             <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl" style={melocotonGradient}>M</div>
             <span className="text-xl font-black text-white tracking-wide">Mora</span>
          </div>

          <div className="p-4 space-y-2 mt-4">
            {[ { icon: TargetAuditIcon, text: t[idioma].nueva, view: 'nueva' }, { icon: ChartIcon, text: t[idioma].dashboard, view: 'dashboard' }, { icon: UsersIcon, text: t[idioma].clientes, view: 'historial' }, { icon: AgencyIcon, text: t[idioma].agencia, view: 'perfil' }].map((link, idx) => (
              <button 
                key={idx}
                onClick={() => setVista(link.view as any)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${ vista === link.view ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-slate-400 hover:bg-white/5 hover:text-white" }`}
              >
                <div className={vista === link.view ? "text-[#FFA4BD]" : ""}><link.icon /></div> {link.text}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
           <button onClick={() => signOut()} className="w-full text-left text-sm font-bold text-slate-500 hover:text-white transition-colors">Cerrar Sesión</button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-y-auto z-10">
        
        <header className="h-20 flex justify-between items-center px-8 print:hidden border-b border-white/5 bg-black/20 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {vista === 'nueva' && 'Auditor de Campaña'}
            {vista === 'dashboard' && 'Panel Principal'}
            {vista === 'historial' && t[idioma].clientes}
            {vista === 'perfil' && 'Mi Agencia'}
          </h2>
          <div className="flex items-center gap-4">
             <span className="text-sm font-bold text-slate-400">Language <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-white">{idioma === "es" ? "ESP" : "ENG"}</button></span>
             <img src={session.user?.image || ""} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-[#FEAFAE] shadow-sm" />
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full print:p-0">
          
          {/* NUEVA AUDITORÍA */}
          {vista === "nueva" && (
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl mb-8 print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-black" style={melocotonGradient}><TargetAuditIcon/></div>
                <h1 className="text-3xl font-bold text-white">Auditor IA</h1>
              </div>
              <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl mb-4 text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
              <textarea className="w-full h-48 p-4 bg-black/40 border border-white/10 rounded-2xl mb-6 text-white focus:border-[#FEAFAE] focus:outline-none transition-all resize-none" placeholder={t[idioma].placeholderDatos} value={data} onChange={(e) => setData(e.target.value)} />
              <button onClick={analizarCampaña} disabled={loading || !data} className="w-full text-black px-6 py-4 rounded-2xl font-bold text-xl hover:scale-[1.02] disabled:opacity-50 transition-all shadow-lg" style={melocotonGradient}>
                {loading ? t[idioma].btnAnalizando : t[idioma].btnAnalizar}
              </button>
            </div>
          )}

          {/* REPORTE */}
          {reporte && (
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-sm">{nombreCuenta || '---'}</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 text-xl font-black text-[#0a0a0c]" style={melocotonGradient}>{reporte.score_general}</div>
                    <h3 className="text-3xl font-bold text-white">{t[idioma].score}</h3>
                  </div>
                </div>
                <button onClick={descargarPDF} className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all print:hidden">Exportar PDF</button>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 pl-6 bg-red-500/10 p-6 rounded-r-2xl border-y border-r border-red-500/20" style={{ borderLeftColor: '#ef4444' }}>
                  <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2"><WarningIcon/> {t[idioma].problemas}</h3>
                  {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-300"><b className="text-white">{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
                <div className="border-l-4 pl-6 bg-yellow-500/10 p-6 rounded-r-2xl border-y border-r border-yellow-500/20" style={{ borderLeftColor: '#eab308' }}>
                  <h3 className="text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2"><WarningIcon/> {t[idioma].mejoras}</h3>
                  {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-300"><b className="text-white">{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* VISTA: HISTORIAL */}
          {vista === "historial" && (
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 text-white">{t[idioma].clientes}</h2>
              {historial.map((item, index) => (
                <div key={index} className="border border-white/10 bg-black/20 p-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center mb-4" onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta); setVista("nueva"); }}>
                  <h3 className="text-lg font-bold text-white">{item.nombre_cuenta}</h3>
                  <span className="text-[#0a0a0c] px-3 py-1 rounded-lg text-xs font-black" style={melocotonGradient}>{item.score}/100</span>
                </div>
              ))}
            </div>
          )}

          {/* VISTA: DASHBOARD */}
          {vista === "dashboard" && (
             <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <ChartIcon />
                <p className="mt-4 font-bold text-xl text-white">Estadísticas próximamente</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}