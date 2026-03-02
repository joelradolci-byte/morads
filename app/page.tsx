"use client";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

// 🔌 CONECTAMOS TU BASE DE DATOS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🌍 SISTEMA BILINGÜE Y NUEVAS VISTAS
  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [vista, setVista] = useState<"nueva" | "historial" | "perfil" | "feedback">("nueva");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // 💳 ESTADOS DE PAGO, PERFIL Y UI
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false); // <-- NUEVO: Controla el menú desplegable

  // 🏢 ESTADOS PARA LA MARCA BLANCA
  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [uploading, setUploading] = useState(false);

  // 💬 ESTADOS PARA FEEDBACK
  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  // TEXTOS TRADUCIDOS
  const t = {
    es: {
      nueva: "Nueva Auditoría",
      historial: "Mis Clientes",
      agencia: "Mi Agencia",
      feedback: "Feedback",
      salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta",
      placeholderDatos: "Pegá acá los datos de la campaña...",
      btnAnalizar: "Ejecutar Auditoría",
      btnAnalizando: "Analizando métricas...",
      exportar: "Exportar a PDF",
      problemas: "Problemas Graves",
      mejoras: "Áreas Débiles",
      aciertos: "Puntos Fuertes",
      score: "Score General",
      enviarFeedback: "Enviar Sugerencia",
      feedbackExito: "¡Gracias por tu feedback! Nos ayuda a mejorar.",
    },
    en: {
      nueva: "New Audit",
      historial: "My Clients",
      agencia: "My Agency",
      feedback: "Feedback",
      salir: "Sign Out",
      placeholderNombre: "Client or Account Name",
      placeholderDatos: "Paste campaign data here...",
      btnAnalizar: "Run Audit",
      btnAnalizando: "Analyzing metrics...",
      exportar: "Export to PDF",
      problemas: "Critical Issues",
      mejoras: "Weak Areas",
      aciertos: "Strengths",
      score: "Overall Score",
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
      setVista("nueva"); // Volvemos al inicio tras enviar
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
        <div className="bg-white/40 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 text-center max-w-md w-full mx-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="bg-white/60 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/50"><span className="text-4xl">🫐</span></div>
          <h1 className="text-4xl font-black mb-2 text-slate-800 tracking-tight">Mora</h1>
          <p className="text-slate-600 mb-8 font-medium">Auditorías IA de nivel corporativo.</p>
          <button onClick={() => signIn("google")} className="w-full bg-white/80 backdrop-blur-sm border border-white text-slate-700 px-6 py-4 rounded-xl font-bold text-lg hover:bg-white hover:shadow-lg transition-all flex items-center justify-center gap-3">
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
      <aside className="w-64 bg-[#0f172a]/70 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between print:hidden">
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <span className="text-3xl mr-3 filter drop-shadow-md">🫐</span>
            <span className="text-2xl font-black text-white tracking-wide">Mora</span>
          </div>

          {/* Nav Links Principales */}
          <div className="p-4 space-y-2 mt-4">
            <button 
              onClick={() => { setVista("nueva"); setMostrarPagos(false); setReporte(null); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${vista === "nueva" ? "bg-blue-600 text-white shadow-blue-500/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              ➕ {t[idioma].nueva}
            </button>
            
            <button 
              onClick={() => { setVista("historial"); setMostrarPagos(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${vista === "historial" ? "bg-white/10 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              🗂️ {t[idioma].historial}
            </button>
            
            <button 
              onClick={() => { setVista("perfil"); setMostrarPagos(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${vista === "perfil" ? "bg-white/10 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              ⚙️ {t[idioma].agencia}
            </button>
          </div>
        </div>

        {/* Links Legales (Abajo de todo) */}
        <div className="p-6 text-xs text-slate-400 font-medium space-y-3">
          <p className="hover:text-slate-200 cursor-pointer transition-colors">About Mora</p>
          <p className="hover:text-slate-200 cursor-pointer transition-colors">Términos de uso</p>
          <p className="hover:text-slate-200 cursor-pointer transition-colors">Contacto</p>
        </div>
      </aside>


      {/* ========================================== */}
      {/* PANEL CENTRAL (MAIN CONTENT) */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* HEADER SUPERIOR */}
        <header className="h-20 flex justify-between items-center px-8 print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {vista === 'nueva' && 'Panel Principal'}
            {vista === 'historial' && t[idioma].historial}
            {vista === 'perfil' && 'Configuración'}
            {vista === 'feedback' && 'Buzón de Sugerencias'}
          </h2>
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
              Language <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-slate-800 hover:text-blue-600 transition-colors">{idioma === "es" ? "ESP/ENG" : "ENG/ESP"}</button>
            </span>
            
            {/* DROPDOWN DEL PERFIL */}
            <div className="relative">
              <button onClick={() => setMenuPerfil(!menuPerfil)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={session.user?.image || ""} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold leading-tight">{session.user?.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {perfil?.plan === 'pro' ? <span className="text-green-600">Pro</span> : 'Free'} 
                    <span className="text-[10px]">▼</span>
                  </p>
                </div>
              </button>
              
              {menuPerfil && (
                <div className="absolute right-0 mt-3 w-48 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
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
          
          {/* VISTA: NUEVA AUDITORÍA */}
          {vista === "nueva" && (
            <div className="print:hidden">
              {mostrarPagos ? (
                <div className="bg-white/50 backdrop-blur-lg border border-white/60 p-10 rounded-3xl shadow-xl text-center">
                  <div className="text-6xl mb-4">🛑</div>
                  <h2 className="text-4xl font-black mb-4">Límite Alcanzado</h2>
                  <p className="text-slate-600 mb-8 text-lg">Elegí un plan para seguir detectando fugas de dinero:</p>
                  <div className="flex gap-6 justify-center mt-6">
                    <button onClick={() => procesarPago('credito')} className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:-translate-y-1 transition-transform">1 Reporte ($5)</button>
                    <button onClick={() => procesarPago('pro')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-transform border border-blue-400">Pase Pro ($29/m)</button>
                  </div>
                  <button onClick={() => setMostrarPagos(false)} className="mt-8 text-slate-500 hover:text-slate-800 font-bold underline">Volver atrás</button>
                </div>
              ) : (
                <div className="bg-white/40 backdrop-blur-lg p-10 rounded-3xl shadow-xl border border-white/60 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🎯</div>
                    <h1 className="text-3xl font-black">Auditor IA</h1>
                  </div>
                  <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 bg-white/60 border border-white/50 rounded-2xl mb-4 text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
                  <textarea className="w-full h-48 p-4 bg-white/60 border border-white/50 rounded-2xl mb-6 text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none" placeholder={t[idioma].placeholderDatos} value={data} onChange={(e) => setData(e.target.value)} />
                  <button onClick={analizarCampaña} disabled={loading || !data} className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-xl hover:bg-blue-700 disabled:bg-slate-400/50 disabled:text-slate-200 shadow-xl shadow-blue-500/20 transition-all">
                    {loading ? t[idioma].btnAnalizando : t[idioma].btnAnalizar}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REPORTE Y PDF (Mantiene el diseño limpio para la impresora pero vidriado en pantalla) */}
          {reporte && !mostrarPagos && (
            <div className="mt-10 bg-white/50 backdrop-blur-md p-10 rounded-3xl border border-white/60 shadow-xl print:bg-white print:border-none print:shadow-none print:mt-0 print:p-0">
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
                <button onClick={descargarPDF} className="bg-[#0f172a] text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg print:hidden flex items-center gap-2">
                  {t[idioma].exportar}
                </button>
              </div>
              
              <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl text-center border border-white/60 shadow-sm"><b>Estructura</b> <br/> <span className="text-2xl font-black text-blue-600">{reporte.sub_scores?.estructura}/100</span></div>
                 <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl text-center border border-white/60 shadow-sm"><b>Conversiones</b> <br/> <span className="text-2xl font-black text-blue-600">{reporte.sub_scores?.conversiones}/100</span></div>
                 <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl text-center border border-white/60 shadow-sm"><b>Presupuesto</b> <br/> <span className="text-2xl font-black text-blue-600">{reporte.sub_scores?.presupuesto}/100</span></div>
                 <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl text-center border border-white/60 shadow-sm"><b>Keywords</b> <br/> <span className="text-2xl font-black text-blue-600">{reporte.sub_scores?.keywords}/100</span></div>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-6 bg-red-50/50 backdrop-blur-sm p-6 rounded-r-2xl border-y border-r border-white/60">
                  <h3 className="text-xl font-black text-red-700 mb-3 flex items-center gap-2">🔴 {t[idioma].problemas}</h3>
                  {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
                <div className="border-l-4 border-yellow-500 pl-6 bg-yellow-50/50 backdrop-blur-sm p-6 rounded-r-2xl border-y border-r border-white/60">
                  <h3 className="text-xl font-black text-yellow-700 mb-3 flex items-center gap-2">🟡 {t[idioma].mejoras}</h3>
                  {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
                <div className="border-l-4 border-green-500 pl-6 bg-green-50/50 backdrop-blur-sm p-6 rounded-r-2xl border-y border-r border-white/60">
                  <h3 className="text-xl font-black text-green-700 mb-3 flex items-center gap-2">🟢 {t[idioma].aciertos}</h3>
                  {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => <p key={i} className="mb-2 text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* VISTA: HISTORIAL */}
          {vista === "historial" && (
            <div className="bg-white/40 backdrop-blur-lg p-10 rounded-3xl shadow-xl border border-white/60 print:hidden">
              <h2 className="text-3xl font-black mb-8">{t[idioma].historial}</h2>
              {cargandoHistorial ? <p className="text-slate-500 font-bold text-center py-10">Cargando base de datos...</p> : historial.length === 0 ? (
                <div className="text-center py-16 bg-white/50 rounded-2xl border-2 border-dashed border-white/80">
                  <p className="text-slate-500 font-bold mb-2">No hay auditorías guardadas.</p>
                  <button onClick={() => setVista("nueva")} className="text-blue-600 font-black hover:underline">¡Arrancar ahora!</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historial.map((item, index) => (
                    <div key={index} className="bg-white/60 border border-white/60 p-6 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer" onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta); setVista("nueva"); }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-slate-800 truncate pr-4">{item.nombre_cuenta}</h3>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-black">{item.score}/100</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Ver reporte completo →</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA: MI AGENCIA (MARCA BLANCA) */}
          {vista === "perfil" && (
            <div className="bg-white/40 backdrop-blur-lg p-10 rounded-3xl shadow-xl border border-white/60 print:hidden max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🏢</div>
                <h2 className="text-3xl font-black">{t[idioma].agencia}</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre de la Agencia</label>
                  <input type="text" className="w-full p-4 bg-white/60 border border-white/50 rounded-2xl text-black font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Logo (Aparecerá en el PDF)</label>
                  <div className="flex items-center gap-6 p-4 border border-white/60 rounded-2xl bg-white/40">
                    {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-20 h-20 object-contain rounded-xl bg-white p-2 shadow-sm" /> : <div className="w-20 h-20 bg-white/50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold text-center p-2 border border-dashed border-slate-300">Sube un logo</div>}
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                  </div>
                </div>
                <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:bg-slate-300 shadow-lg mt-4 transition-all">
                  {loading ? "..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {/* VISTA: FEEDBACK */}
          {vista === "feedback" && (
            <div className="bg-white/40 backdrop-blur-lg p-10 rounded-3xl shadow-xl border border-white/60 print:hidden max-w-2xl mx-auto text-center animate-fade-in">
              <div className="text-6xl mb-6 filter drop-shadow-md">💡</div>
              <h2 className="text-3xl font-black mb-3">{idioma === 'es' ? 'Ayudanos a mejorar Mora' : 'Help us improve Mora'}</h2>
              <p className="text-slate-500 mb-8 font-medium">{idioma === 'es' ? '¿Encontraste un bug o tenés una idea genial?' : 'Did you find a bug or have a great idea?'}</p>
              
              <textarea 
                className="w-full h-32 p-4 bg-white/60 border border-white/50 rounded-2xl mb-6 text-black focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-medium"
                placeholder={idioma === 'es' ? 'Escribí tu sugerencia acá...' : 'Write your suggestion here...'}
                value={mensajeFeedback}
                onChange={(e) => setMensajeFeedback(e.target.value)}
              />
              <button 
                onClick={mandarFeedback} 
                disabled={enviandoFeedback || !mensajeFeedback}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:bg-slate-300 shadow-xl shadow-blue-500/20 w-full transition-all"
              >
                {enviandoFeedback ? "..." : t[idioma].enviarFeedback}
              </button>
            </div>
          )}

        </div>

        {/* BOTÓN FLOTANTE DE SUGERENCIA */}
        <button 
          onClick={() => { setVista("feedback"); setMostrarPagos(false); setReporte(null); }}
          className="fixed bottom-8 right-8 bg-[#0f172a] text-white px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-white/10 print:hidden z-50"
        >
          💡 Sugerencia
        </button>

      </main>
    </div>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}