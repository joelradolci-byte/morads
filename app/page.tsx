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
// COMPONENTE: ICONOS SVG CUSTOM (Trazado Fino / Monoline)
// ==========================================
const TargetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5m0 3v1.5m3.5-3.5h3v-13.5m-3 13.5h-10.5m1.5 0v3m0 0v1.5m10.5-3.5h3m3-13.5h-16.5m16.5 0v1.5" /></svg>);
const TargetAuditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75l11.25-1.5m0 0l-1.5 11.25m1.5-11.25l-11.25 11.25M12 6.75l-1.5-1.5m0 0L2.25 6.75m1.5-1.5L2.25 6.75m0 0L2.25 6.75m0 0L6.75 6.75m-4.5 0l11.25 11.25" /></svg>);
const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v3m3-4.5v6m3-6.75v7.5m3-12.75l10.5 20.25H2.25l10.5-20.25z" /></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A4.126 4.126 0 0111.25 21a4.126 4.126 0 01-3.75-1.872v-.106M8.25 19.128v.003c.501-.91.786-1.957.786-3.07M8.25 19.128a9.38 9.38 0 012.625.372 9.337 9.337 0 014.121-.952 4.125 4.125 0 01-7.533-2.493M11.25 12a4.125 4.125 0 11-8.25 0 4.125 4.125 0 018.25 0zm0 0l-1.5-1.5M11.25 12a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0z" /></svg>);
const AgencyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18" /></svg>);
const ReportIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>);
const FeedbackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.89.478l2.193 2.68c1.33 1.623 3.992.684 3.992-1.428V15.75h-12z" /></svg>);
const ConfigIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1015 0 7.5 7.5 0 00-15 0zm6.75-2.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm3 2.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>);
const LightbulbIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-3m0 0a3.375 3.375 0 110-6.75c1.864 0 3.375 1.511 3.375 3.375m-3.375 3.375a3.375 3.375 0 110 6.75m0 0L12 12m-6 6l1.5-1.5M6 6l1.5 1.5m10.5 10.5L16.5 16.5m1.5-1.5L16.5 16.5" /></svg>);
const WarningIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 12.376zM12 17.25h.007v.008H12v-.008z" /></svg>);


function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🌍 SISTEMA BILINGÜE Y NUEVAS VISTAS
  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [vista, setVista] = useState<"dashboard" | "nueva" | "historial" | "perfil" | "feedback" | "configuracion">("dashboard"); // <-- Agregadas vistas de layout
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // 💳 ESTADOS DE PAGO, PERFIL Y UI
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false); // <-- NUEVO: Controla el menú desplegable de perfil

  // 🏢 ESTADOS PARA LA MARCA BLANCA
  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [uploading, setUploading] = useState(false);

  // 💬 ESTADOS PARA FEEDBACK
  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

// TEXTOS TRADUCIDOS (Actualizados para reflejar la Sidebar completa)
  const t = {
    es: {
      dashboard: "Dashboard",
      nueva: "Nueva Auditoría",
      clientes: "Clientes",
      agencia: "Mi Agencia",
      reportes: "Reportes",
      feedback: "Feedback",
      configuracion: "Configuración",
      about: "About Mora",
      terminos: "Términos de uso",
      contacto: "Contacto",
      salir: "Cerrar Sesión",
      score_ia: "IA Health Score",
      cuentas_auditadas: "Total Cuentas Auditadas",
      problemas_criticos: "Problemas Críticos Encontrados",
      roas_promedio: "ROAS Promedio Detallado",
      oportunidades_ia: "Oportunidades Detectadas por IA",
      estado_ia_optimizado: "Estado: Optimizado",
      score: "Score General",
      placeholderNombre: "Nombre del Cliente o Cuenta", // <-- ACÁ ESTÁN DE VUELTA
      placeholderDatos: "Pegá acá los datos de la campaña...", // <-- ACÁ ESTÁN DE VUELTA
      btnAnalizar: "Ejecutar Auditoría",
      btnAnalizando: "Analizando métricas...",
      exportar: "Exportar a PDF",
      problemas: "Problemas Graves",
      mejoras: "Áreas Débiles",
      aciertos: "Puntos Fuertes",
      enviarFeedback: "Enviar Sugerencia",
      feedbackExito: "¡Gracias por tu feedback! Nos ayuda a mejorar.",
    },
    en: {
      dashboard: "Dashboard",
      nueva: "New Audit",
      clientes: "Clients",
      agencia: "My Agency",
      reportes: "Reports",
      feedback: "Feedback",
      configuracion: "Settings",
      about: "About Mora",
      terminos: "Terms of use",
      contacto: "Contact",
      salir: "Sign Out",
      score_ia: "IA Health Score",
      cuentas_auditadas: "Total Accounts Audited",
      problemas_criticos: "Critical Issues Found",
      roas_promedio: "ROAS Detailed Average",
      oportunidades_ia: "AI Opportunities Detected",
      estado_ia_optimizado: "Status: Optimized",
      score: "Overall Score",
      placeholderNombre: "Client or Account Name", // <-- ACÁ ESTÁN DE VUELTA
      placeholderDatos: "Paste campaign data here...", // <-- ACÁ ESTÁN DE VUELTA
      btnAnalizar: "Run Audit",
      btnAnalizando: "Analyzing metrics...",
      exportar: "Export to PDF",
      problemas: "Critical Issues",
      mejoras: "Weak Areas",
      aciertos: "Strengths",
      enviarFeedback: "Send Suggestion",
      feedbackExito: "Thanks for your feedback! It helps us improve.",
    }
  };

  const descargarPDF = () => {
    window.print();
  };

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

  const procesarPago = async (tipo: 'credito' | 'pro') => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, tipo })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Error al ir a pagar:", error);
      alert("Hubo un problema al conectar con el banco.");
    }
  };

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
      alert("¡Perfil de agencia guardado! 🎉");
      obtenerPerfil();
    }
    setLoading(false);
  };

  const mandarFeedback = async () => {
    if (!mensajeFeedback.trim() || !session?.user?.email) return;
    setEnviandoFeedback(true);
    const { error } = await supabase.from('feedback').insert([{ usuario_email: session.user.email, mensaje: mensajeFeedback }]);
    if (!error) {
      alert(t[idioma].feedbackExito);
      setMensajeFeedback("");
      setVista("dashboard"); // Volvemos al inicio tras enviar
    } else {
      alert("Error enviando feedback.");
    }
    setEnviandoFeedback(false);
  };

  const analizarCampaña = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const { count } = await supabase.from('historial_auditorias').select('*', { count: 'exact', head: true }).eq('usuario_email', session.user.email);
      const esPro = perfil?.plan === 'pro';
      const tieneCreditos = (perfil?.creditos_extra || 0) > 0;
      const limiteGratisAlcanzado = (count || 0) >= 3;

      if (!esPro && !tieneCreditos && limiteGratisAlcanzado) {
        setMostrarPagos(true);
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const idiomaInstruccion = idioma === 'es' ? 'ESPAÑOL' : 'INGLÉS';
      
      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta.
      IMPORTANTE: Los valores de "titulo" y "descripcion" DEBEN estar redactados en ${idiomaInstruccion}. Las claves del JSON deben mantenerse igual:
      {
        "score_general": 45,
        "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40},
        "hallazgos": {
          "graves_rojo": [{"titulo": "Problema", "descripcion": "Detalle"}],
          "debiles_amarillo": [{"titulo": "Mejora", "descripcion": "Detalle"}],
          "bien_verde": [{"titulo": "Acierto", "descripcion": "Detalle"}]
        },
        "recomendaciones": ["Recomendación 1"]
      }
      Datos a analizar: ${data}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "");
      const parsedReporte = JSON.parse(text);
      
      setReporte(parsedReporte);
      await supabase.from('historial_auditorias').insert([{ usuario_email: session.user.email, score: parsedReporte.score_general, reporte_json: parsedReporte, nombre_cuenta: nombreCuenta || "Sin nombre" }]);

      if (!esPro && tieneCreditos && perfil) {
        await supabase.from('suscripciones').update({ creditos_extra: perfil.creditos_extra - 1 }).eq('email', session.user.email);
        obtenerPerfil();
      }
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error al analizar los datos. Revisá la consola.");
    }
    setLoading(false);
  };

  if (status === "loading") return <div className="h-full w-full flex justify-center items-center text-xl font-bold text-slate-500">Cargando...</div>;

  if (!session) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        {/* LOGIN CON ESTILO GLASS */}
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 text-center max-w-md w-full mx-4 relative overflow-hidden">
          <div className="bg-white w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200"><span className="text-4xl">🫐</span></div>
          <h1 className="text-4xl font-black mb-2 text-slate-800 tracking-tight">Mora</h1>
          <p className="text-slate-600 mb-8 font-medium">Auditorías IA de nivel corporativo.</p>
          <button onClick={() => signIn("google")} className="w-full bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg transition-all flex items-center justify-center gap-3">
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full font-sans text-slate-800">
      
      {/* ========================================== */}
      {/* MENU LATERAL (SIDEBAR) - DARK GLASS */}
      {/* ========================================== */}
      <aside className="w-64 bg-[#0f172a]/90 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between print:hidden">
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/10">
            <span className="text-3xl mr-3 filter drop-shadow-md">🫐</span>
            <span className="text-2xl font-black text-white tracking-wide">Mora</span>
          </div>

          {/* Nav Links Principales */}
          <div className="p-4 space-y-2 mt-4">
            {[ { icon: TargetAuditIcon, text: t[idioma].nueva, view: 'nueva' }, { icon: ChartIcon, text: t[idioma].dashboard, view: 'dashboard' }, { icon: UsersIcon, text: t[idioma].clientes, view: 'historial' }, { icon: AgencyIcon, text: t[idioma].agencia, view: 'perfil' }, { icon: ReportIcon, text: t[idioma].reportes, view: 'reportes' }, { icon: FeedbackIcon, text: t[idioma].feedback, view: 'feedback' }, { icon: ConfigIcon, text: t[idioma].configuracion, view: 'configuracion' } ].map((link, idx) => (
              <button 
                key={idx}
                onClick={() => { setVista(link.view as any); setMostrarPagos(false); setReporte(null); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${idx === 0 ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "" } ${ vista === link.view ? (idx === 0 ? "" : "bg-white/10 text-white shadow-sm") : "text-slate-300 hover:bg-white/5 hover:text-white" }`}
              >
                <link.icon /> {link.text}
              </button>
            ))}
          </div>
        </div>

        {/* Links Legales (Abajo de todo) */}
        <div className="p-6 text-xs text-slate-400 font-medium space-y-3">
          <p className="hover:text-slate-200 cursor-pointer transition-colors">{t[idioma].about}</p>
          <p className="hover:text-slate-200 cursor-pointer transition-colors">{t[idioma].terminos}</p>
          <p className="hover:text-slate-200 cursor-pointer transition-colors">{t[idioma].contacto}</p>
        </div>
      </aside>


      {/* ========================================== */}
      {/* PANEL CENTRAL (MAIN CONTENT) */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* HEADER SUPERIOR */}
        <header className="h-20 flex justify-between items-center px-8 print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {vista === 'nueva' && 'Auditor de Campaña'}
            {vista === 'historial' && t[idioma].clientes}
            {vista === 'perfil' && 'Configuración de Marca Blanca'}
            {vista === 'feedback' && 'Buzón de Sugerencias'}
            {vista === 'dashboard' && 'Panel Principal'}
          </h2>
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
              Language <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-slate-800 hover:text-blue-600 transition-colors">{idioma === "es" ? "ESP/ENG" : "ENG/ESP"}</button>
            </span>
            
            {/* DROPDOWN DEL PERFIL */}
            <div className="relative">
              <button onClick={() => setMenuPerfil(!menuPerfil)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={session.user?.image || ""} alt="Perfil" className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" />
                <div className="text-left">
                  <p className="text-sm font-bold leading-tight">{session.user?.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {perfil?.plan === 'pro' ? <span className="text-green-600">Pro</span> : 'Free'} <span className="text-[10px]">▼</span>
                  </p>
                </div>
              </button>
              
              {menuPerfil && (
                <div className="absolute right-0 mt-3 w-48 bg-white backdrop-blur-md border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Mi Cuenta</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 transition-colors">Mi Perfil</button>
                  <button className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 transition-colors flex justify-between items-center">
                    Plan <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">Pro</span>
                  </button>
                  <button onClick={() => setMostrarPagos(true)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-slate-50 transition-colors">Facturación</button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">{t[idioma].salir}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE LAS VISTAS */}
        <div className="p-8 max-w-6xl mx-auto w-full print:p-0">
          
          {/* VISTA: DASHBOARD (PANEL PRINCIPAL) */}
          {vista === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1 md:col-span-2 flex items-center gap-6">
                 <div className="w-32 h-32 rounded-full border-8 border-green-300 flex items-center justify-center text-4xl font-black text-green-700 shadow-inner">
                    78<span className="text-sm">/100</span>
                 </div>
                 <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">TargetIcon <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{t[idioma].estado_ia_optimizado}</span></h3>
                  <p className="text-sm text-slate-500">Mora analiza constantemente tu rendimiento para ofrecerte una visión general del estado de tus campañas.</p>
                 </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">TargetAuditIcon</div>
                  <div><p className="text-4xl font-black text-slate-900 leading-tight">142</p><p className="text-sm text-slate-500">{t[idioma].cuentas_auditadas}</p></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-xl text-red-600">WarningIcon</div>
                  <div><p className="text-4xl font-black text-slate-900 leading-tight">17</p><p className="text-sm text-slate-500">{t[idioma].problemas_criticos}</p></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 md:col-span-2">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">ChartIcon</div>
                  <div><p className="text-4xl font-black text-indigo-900 leading-tight">4.5x</p><p className="text-sm text-indigo-700 font-bold">{t[idioma].roas_promedio}</p></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 md:col-span-2 lg:col-span-2 flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">LightbulbIcon</div>
                  <div><p className="text-4xl font-black text-yellow-700 leading-tight">55</p><p className="text-sm text-slate-500">{t[idioma].oportunidades_ia}</p></div>
              </div>
              
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-4 mt-8">
                  <h3 className="text-2xl font-black mb-4">Últimas Auditorías</h3>
                  <div className="text-center py-10 text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-100">Sin datos / No data</div>
               </div>
            </div>
          )}

          {/* VISTA: NUEVA AUDITORÍA */}
          {vista === "nueva" && (
            <div className="print:hidden">
              {mostrarPagos ? (
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 text-center">
                  <div className="text-6xl mb-4">🛑</div>
                  <h2 className="text-4xl font-black mb-4 text-slate-900">Límite Gratuito Alcanzado</h2>
                  <p className="text-slate-600 mb-8 text-lg">Elegí un plan para seguir detectando fugas de dinero:</p>
                  <div className="flex gap-6 justify-center mt-6">
                    <button onClick={() => procesarPago('credito')} className="bg-[#0f172a] text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-transform">1 Reporte Extra ($5)</button>
                    <button onClick={() => procesarPago('pro')} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:-translate-y-1 transition-transform">Pase Pro ($29/m)</button>
                  </div>
                  <button onClick={() => setMostrarPagos(false)} className="mt-8 text-slate-500 hover:text-slate-800 font-bold underline">Volver atrás</button>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600">TargetAuditIcon</div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight">Auditor Inteligente</h1>
                  </div>
                  <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 border border-slate-200 rounded-xl mb-4 text-black focus:border-blue-500 focus:outline-none transition-all font-bold" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
                  <textarea className="w-full h-48 p-4 border border-slate-200 rounded-xl mb-6 text-black focus:border-blue-500 focus:outline-none transition-all" placeholder={t[idioma].placeholderDatos} value={data} onChange={(e) => setData(e.target.value)} />
                  <button onClick={analizarCampaña} disabled={loading || !data} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-xl hover:bg-blue-700 disabled:bg-slate-300 shadow-xl transition-all">
                    {loading ? t[idioma].btnAnalizando : t[idioma].btnAnalizar}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REPORTE Y PDF (Traducciones aplicadas a los títulos y puntajes) */}
          {reporte && !mostrarPagos && (
            <div className="mt-10 bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl print:border-none print:shadow-none print:mt-0 print:p-0">
              <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-6">
                <div>
                  {perfil?.agencia_logo ? <img src={perfil.agencia_logo} alt="Logo" className="h-16 object-contain" /> : <div className="flex items-center gap-2"><span className="text-3xl">🐾</span><span className="text-3xl font-black text-slate-800">Mora</span></div>}
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-slate-800">{perfil?.agencia_nombre ? perfil.agencia_nombre : "Reporte / Report"}</h2>
                  <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8 print:mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-sm">{nombreCuenta || '---'}</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-green-400 bg-green-50 text-xl font-black text-green-700 shadow-inner">
                      {reporte.score_general}
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{t[idioma].score}</h3>
                  </div>
                </div>
                <button onClick={descargarPDF} className="bg-[#0f172a] text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-md print:hidden flex items-center gap-2">
                  {t[idioma].exportar}
                </button>
              </div>
              
              <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100 shadow-inner"><b>Estructura</b> <br/> <span className="text-2xl font-black text-slate-900">{reporte.sub_scores?.estructura}/100</span></div>
                 <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100 shadow-inner"><b>Conversiones</b> <br/> <span className="text-2xl font-black text-slate-900">{reporte.sub_scores?.conversiones}/100</span></div>
                 <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100 shadow-inner"><b>Presupuesto</b> <br/> <span className="text-2xl font-black text-slate-900">{reporte.sub_scores?.presupuesto}/100</span></div>
                 <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100 shadow-inner"><b>Keywords</b> <br/> <span className="text-2xl font-black text-slate-900">{reporte.sub_scores?.keywords}/100</span></div>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-6 bg-red-50 p-6 rounded-r-2xl border-y border-r border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-red-700 mb-3 flex items-center gap-2"><div className="text-red-600">WarningIcon</div> {t[idioma].problemas}</h3>
                  {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-800"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
                <div className="border-l-4 border-yellow-500 pl-6 bg-yellow-50 p-6 rounded-r-2xl border-y border-r border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-yellow-700 mb-3 flex items-center gap-2"><div className="text-yellow-600">LightbulbIcon</div> {t[idioma].mejoras}</h3>
                  {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-800"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
                <div className="border-l-4 border-green-500 pl-6 bg-green-50 p-6 rounded-r-2xl border-y border-r border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-green-700 mb-3 flex items-center gap-2">🟢 {t[idioma].aciertos}</h3>
                  {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-800"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* VISTA: HISTORIAL (CLIENTES) */}
          {vista === "historial" && (
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 print:hidden animate-fade-in">
              <h2 className="text-3xl font-black mb-8 text-slate-900">{t[idioma].clientes}</h2>
              {cargandoHistorial ? <p className="text-slate-500 font-bold text-center py-10">Cargando base de datos...</p> : historial.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-bold mb-2">No hay auditorías guardadas.</p>
                  <button onClick={() => setVista("nueva")} className="text-blue-600 font-black hover:underline">¡Arrancar ahora!</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historial.map((item, index) => (
                    <div key={index} className="border border-slate-100 p-6 rounded-2xl hover:bg-slate-50 hover:shadow-lg transition-all cursor-pointer flex justify-between items-center group" onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta); setVista("nueva"); }}>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 truncate pr-4">{item.nombre_cuenta}</h3>
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-xs font-black">{item.score}/100 IA Score</span>
                      </div>
                      <div className="text-xl opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA: MI AGENCIA (MARCA BLANCA) */}
          {vista === "perfil" && (
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 print:hidden max-w-2xl mx-auto animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl text-indigo-700">AgencyIcon</div>
                <h2 className="text-3xl font-black text-slate-900 leading-tight">{t[idioma].agencia}</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nombre de la Agencia</label>
                  <input type="text" className="w-full p-4 border border-slate-200 rounded-xl text-black font-bold focus:border-indigo-500" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Logo (Aparecerá en el PDF)</label>
                  <div className="flex items-center gap-6 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-20 h-20 object-contain rounded-xl bg-white p-2 shadow-sm" /> : <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold text-center p-2 border border-dashed border-slate-300">Sube un logo</div>}
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                  </div>
                </div>
                <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full bg-[#0f172a] text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-all shadow-lg mt-4">
                  {loading ? "..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {/* VISTA: FEEDBACK */}
          {vista === "feedback" && (
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 print:hidden max-w-2xl mx-auto text-center animate-fade-in">
              <div className="text-6xl mb-6 filter drop-shadow-md">💡</div>
              <h2 className="text-3xl font-black mb-3 text-slate-900">{idioma === 'es' ? 'Ayudanos a mejorar Mora' : 'Help us improve Mora'}</h2>
              <p className="text-slate-500 mb-8 font-medium">{idioma === 'es' ? '¿Encontraste un bug o tenés una idea genial?' : 'Did you find a bug or have a great idea?'}</p>
              
              <textarea 
                className="w-full h-32 p-4 border border-slate-200 rounded-xl mb-6 text-black focus:border-blue-500"
                placeholder={idioma === 'es' ? 'Escribí tu sugerencia acá...' : 'Write your suggestion here...'}
                value={mensajeFeedback}
                onChange={(e) => setMensajeFeedback(e.target.value)}
              />
              <button 
                onClick={mandarFeedback} 
                disabled={enviandoFeedback || !mensajeFeedback}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 shadow-xl shadow-blue-500/20 w-full transition-all"
              >
                {enviandoFeedback ? "..." : t[idioma].enviarFeedback}
              </button>
            </div>
          )}

        </div>

        {/* BOTÓN FLOTANTE DE SUGERENCIA */}
        <button 
          onClick={() => { setVista("feedback"); setMostrarPagos(false); setReporte(null); }}
          className="fixed bottom-8 right-8 bg-[#0f172a] text-white px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-white/10 print:hidden"
        >
          💡 {t[idioma].feedback}
        </button>

      </main>
    </div>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}