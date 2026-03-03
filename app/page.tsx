"use client";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { 
  Target, Users, Building2, MessageSquare, LogOut, ChevronDown, 
  Zap, AlertTriangle, CheckCircle2, CreditCard, Settings, 
  Search, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, LayoutPanelLeft,
  FileText, BarChart3, ShieldCheck
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const melocotonGradient = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)" };
const melocotonText = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [inversion, setInversion] = useState("");
  const [conversiones, setConversiones] = useState("");
  const [cpaRoas, setCpaRoas] = useState("");
  const [tipoCampana, setTipoCampana] = useState("Búsqueda (Search)");
  const [notas, setNotas] = useState("");

  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [vista, setVista] = useState<"nueva" | "historial" | "perfil" | "feedback" | "reporte_lectura" | "facturacion">("nueva");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "critico" | "atencion" | "optimo">("todos");
  const [busqueda, setBusqueda] = useState(""); 
  
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false);

  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [agenciaWeb, setAgenciaWeb] = useState("");
  const [agenciaPie, setAgenciaPie] = useState("Auditoría generada con tecnología IA - Reporte Confidencial.");
  const [moneda, setMoneda] = useState("USD ($)");
  const [metrica, setMetrica] = useState("ROAS");
  const [uploading, setUploading] = useState(false);

  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const t = {
    es: {
      nueva: "Auditor IA", clientes: "Panel de Clientes",
      reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración General", facturacion: "Ver Facturación", salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta", btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF",
      score: "Score General", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes",
      tituloland: "Auditorías Nivel Agencia", h1land1: "Detectá fugas de dinero con", h1land2: "Inteligencia Artificial.",
      pland1: "Conectá tu cuenta de Google Ads y dejá que nuestra Inteligencia Artificial audite tus campañas y genere reportes marca blanca en segundos.",
      btncomenzar: "Comenzar Gratis", detalleCliente: "Detalle del Cliente", buzonSug: "Buzón de Sugerencias",
      suscripcion: "Suscripción", activa: "Activa", renueva: "Renueva:",
      ingresaDatos: "Ingresá los datos clave de la campaña para un análisis preciso.",
      invMensual: "Inversión Mensual", conversiones: "Conversiones", cparoas: "CPA o ROAS Actual", tipoCamp: "Tipo de Campaña", contexto: "Contexto y Notas del Cliente (Opcional)",
      placeholderConv: "Ej: 120", placeholderContexto: "Ej: El cliente quiere enfocarse en vender zapatos de invierno. Notamos muchos clics de países irrelevantes.",
      volver: "Volver al Panel", monitoreo: "Monitoreo de Cuentas", tenes: "Tenés", registradas: "auditorías registradas.",
      buscar: "Buscar cliente...", todos: "Todos", criticos: "Críticos", atencion: "Atención", optimos: "Óptimos",
      thCliente: "Cliente / Cuenta", thFecha: "Fecha", thEstado: "Estado IA", thTendencia: "Tendencia", thAccion: "Acción",
      abrirAud: "Abrir Auditoría", sinCuentas: "No se encontraron clientes.", cuentaSinNombre: "Cuenta sin nombre",
      persPdf: "Personalizá la identidad y las herramientas de tu agencia.", nomAgencia: "Nombre de la Agencia", logoPdf: "Logo (PDF)",
      subeLogo: "Sube un logo", guardando: "Guardando...", guardarAj: "Guardar Ajustes",
      ayudanos: "Ayudanos a mejorar Mora", bug: "¿Encontraste un bug o tenés una idea genial?", escribiSug: "Escribí tu sugerencia acá...", enviando: "Enviando...", enviarSug: "Enviar Sugerencia",
      facturacionTitulo: "Suscripción y Pagos", facturacionDesc: "Gestioná tu plan actual y métodos de pago de forma segura.", planActual: "Tu Plan Actual", gestionarStripe: "Gestionar en Stripe", pronto: "(Próximamente)",
      puntajeBasado: "Puntaje basado en rendimiento y estructura.",
      marcaBlanca: "Marca Blanca Visual", preferencias: "Preferencias de Trabajo",
      sitioWeb: "Sitio Web (Aparecerá en PDF)", piePagina: "Pie de página legal (PDF)", monedaDef: "Moneda por defecto", metricaDef: "Métrica por defecto",
      // Textos Landing Page
      feat1Tit: "Auditoría en Segundos", feat1Desc: "La IA procesa cientos de métricas y detecta fugas de presupuesto al instante.",
      feat2Tit: "Marca Blanca Total", feat2Desc: "Exportá PDFs impecables con tu logo, colores y sitio web listos para enviar al cliente.",
      feat3Tit: "Historial y Tendencias", feat3Desc: "Monitoreá el progreso de todas tus cuentas con scores evolutivos y alertas tempranas.",
      todoLoQueNecesitas: "Todo lo que tu agencia necesita",
      planes: "Planes simples y transparentes", planFree: "Plan Starter", planPro: "Plan Agency",
      btnUnete: "Unite a Mora hoy",
      login: "Iniciar sesión"
    },
    en: {
      nueva: "AI Auditor", clientes: "Client Dashboard",
      reportes: "Reports", feedback: "Feedback", configuracion: "General Settings", facturacion: "Billing", salir: "Sign Out",
      placeholderNombre: "Client or Account Name", btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF",
      score: "Overall Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths",
      tituloland: "Agency-Level Audits", h1land1: "Detect money leaks with", h1land2: "Artificial Intelligence.",
      pland1: "Connect your Google Ads account and let our AI audit your campaigns to generate white-label reports in seconds.",
      btncomenzar: "Start for Free", detalleCliente: "Client Details", buzonSug: "Suggestion Box",
      suscripcion: "Subscription", activa: "Active", renueva: "Renews:",
      ingresaDatos: "Enter key campaign data for a precise analysis.",
      invMensual: "Monthly Spend", conversiones: "Conversions", cparoas: "Current CPA or ROAS", tipoCamp: "Campaign Type", contexto: "Client Context & Notes (Optional)",
      placeholderConv: "E.g. 120", placeholderContexto: "E.g. The client wants to focus on selling winter shoes. We noticed many clicks from irrelevant countries.",
      volver: "Back to Dashboard", monitoreo: "Account Monitoring", tenes: "You have", registradas: "audits recorded.",
      buscar: "Search client...", todos: "All", criticos: "Critical", atencion: "Warning", optimos: "Optimal",
      thCliente: "Client / Account", thFecha: "Date", thEstado: "AI Status", thTendencia: "Trend", thAccion: "Action",
      abrirAud: "Open Audit", sinCuentas: "No clients found.", cuentaSinNombre: "Unnamed Account",
      persPdf: "Customize your agency's identity and workflow tools.", nomAgencia: "Agency Name", logoPdf: "Logo (PDF)",
      subeLogo: "Upload logo", guardando: "Saving...", guardarAj: "Save Settings",
      ayudanos: "Help us improve Mora", bug: "Found a bug or have a great idea?", escribiSug: "Write your suggestion here...", enviando: "Sending...", enviarSug: "Send Suggestion",
      facturacionTitulo: "Subscription & Billing", facturacionDesc: "Manage your current plan and payment methods securely.", planActual: "Your Current Plan", gestionarStripe: "Manage in Stripe", pronto: "(Coming Soon)",
      puntajeBasado: "Score based on performance and structure.",
      marcaBlanca: "Visual White Label", preferencias: "Workflow Preferences",
      sitioWeb: "Website (Appears on PDF)", piePagina: "Legal Footer (PDF)", monedaDef: "Default Currency", metricaDef: "Default Metric",
      // Textos Landing Page
      feat1Tit: "Audits in Seconds", feat1Desc: "Our AI processes hundreds of metrics and detects budget leaks instantly.",
      feat2Tit: "Full White Label", feat2Desc: "Export flawless PDFs with your logo, colors, and website ready for your clients.",
      feat3Tit: "History & Trends", feat3Desc: "Monitor the progress of all your accounts with evolutionary scores and early warnings.",
      todoLoQueNecesitas: "Everything your agency needs",
      planes: "Simple & transparent pricing", planFree: "Starter Plan", planPro: "Agency Plan",
      btnUnete: "Join Mora today",
      login: "Log In"
    }
  };

  const descargarPDF = () => window.print();

  const obtenerPerfil = async () => {
    if (!session?.user?.email) return;
    const { data: userProfile } = await supabase.from('suscripciones').select('*').eq('email', session.user.email).single();
    setPerfil(userProfile);
    if (userProfile) {
      if (userProfile.agencia_nombre) setAgenciaNombre(userProfile.agencia_nombre);
      if (userProfile.agencia_logo) setAgenciaLogo(userProfile.agencia_logo);
      if (userProfile.agencia_web) setAgenciaWeb(userProfile.agencia_web);
      if (userProfile.agencia_pie) setAgenciaPie(userProfile.agencia_pie);
      if (userProfile.moneda_default) setMoneda(userProfile.moneda_default);
      if (userProfile.metrica_default) setMetrica(userProfile.metrica_default);
    }
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
    const { error } = await supabase.from('suscripciones').update({ 
      agencia_nombre: agenciaNombre, 
      agencia_logo: agenciaLogo,
      agencia_web: agenciaWeb,
      agencia_pie: agenciaPie,
      moneda_default: moneda,
      metrica_default: metrica
    }).eq('email', session.user.email);
    
    if (!error) {
      alert("¡Ajustes guardados correctamente!");
      obtenerPerfil();
    } else {
      alert("Error guardando configuraciones.");
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
      setVista("nueva"); 
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
      
      const datosEstructurados = `
        Inversión Mensual: ${inversion}
        Conversiones: ${conversiones}
        CPA / ROAS actual: ${cpaRoas}
        Tipo de Campaña: ${tipoCampana}
        Contexto/Notas del cliente: ${notas}
      `;

      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos estructurados y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta. IMPORTANTE: Los valores de "titulo" y "descripcion" DEBEN estar redactados en ${idiomaInstruccion}. Evalúa críticamente la relación entre inversión, conversiones y tipo de campaña.
      { "score_general": 45, "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40}, "hallazgos": { "graves_rojo": [{"titulo": "Problema", "descripcion": "Detalle"}], "debiles_amarillo": [{"titulo": "Mejora", "descripcion": "Detalle"}], "bien_verde": [{"titulo": "Acierto", "descripcion": "Detalle"}] } }
      Datos a analizar: ${datosEstructurados}`;
      
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

  const getEstadoData = (score: number) => {
    if (score < 50) return { label: t[idioma].criticos, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle };
    if (score < 80) return { label: t[idioma].atencion, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Zap };
    return { label: t[idioma].optimos, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 };
  };

  const clientesFiltrados = historial.filter(item => {
    const coincideFiltro = filtroEstado === "todos" || 
                           (filtroEstado === "critico" && item.score < 50) || 
                           (filtroEstado === "atencion" && item.score >= 50 && item.score < 80) || 
                           (filtroEstado === "optimo" && item.score >= 80);
    const nombreSeguro = item.nombre_cuenta || t[idioma].cuentaSinNombre;
    const coincideBusqueda = nombreSeguro.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  if (status === "loading") return <div className="h-screen w-full flex justify-center items-center text-xl font-bold text-white">Cargando...</div>;

  // =========================================================================
  // LANDING PAGE PREMIUM
  // =========================================================================
  if (!session) {
    return (
      <div className="min-h-screen w-full font-sans text-slate-200 overflow-y-auto overflow-x-hidden bg-[#0a0a0c] selection:bg-[#FEAFAE] selection:text-black">
        
        {/* Nav Superior */}
        <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-2xl shadow-[0_0_15px_rgba(255,164,189,0.5)]" style={melocotonGradient}>M</div>
            <span className="font-bold text-2xl tracking-wide text-white">Mora</span>
          </div>
          <div className="flex items-center gap-6">
            {/* CORRECCIÓN 1: Botón de idioma ahora muestra el idioma actual */}
            <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center border border-slate-400 rounded-full text-[10px]">🌐</span> {idioma === "es" ? "ES" : "EN"}
            </button>
            <button onClick={() => signIn("google")} className="text-[#0a0a0c] px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,164,189,0.4)]" style={melocotonGradient}>
              {t[idioma].login}
            </button>
          </div>
        </nav>

        {/* Decoración de Fondo Brillante */}
        <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[600px] bg-[#FEAFAE] opacity-[0.07] blur-[120px] rounded-full pointer-events-none"></div>

        {/* SECCIÓN 1: HERO */}
        <header className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 max-w-4xl mx-auto relative z-10">
          <div className="border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 flex items-center gap-3 shadow-lg">
             <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={melocotonGradient}></span>
             {t[idioma].tituloland}
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold mb-8 tracking-tight leading-[1.1] text-white">
            {t[idioma].h1land1} <br />
            <span style={melocotonText}>{t[idioma].h1land2}</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            {t[idioma].pland1}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <button onClick={() => signIn("google")} className="w-full sm:w-auto text-[#0a0a0c] px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,164,189,0.3)] flex items-center justify-center gap-2" style={melocotonGradient}>
              {t[idioma].btncomenzar} <ArrowRight size={20} />
            </button>
          </div>
        </header>

        {/* SECCIÓN 2: MOCKUP VISUAL (La interfaz falsa B2B) */}
        <section className="max-w-6xl mx-auto px-4 mb-32 relative z-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0f0f13]/80 backdrop-blur-xl aspect-[16/9] md:aspect-[21/9] flex flex-col">
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-black/40">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex-1 p-8 flex flex-col md:flex-row gap-8 items-center justify-center opacity-60 pointer-events-none">
              <div className="w-full md:w-1/3 space-y-4">
                <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                <div className="h-12 bg-white/5 rounded-xl w-full border border-white/5"></div>
                <div className="h-12 bg-white/5 rounded-xl w-full border border-white/5"></div>
                <div className="h-12 rounded-xl" style={melocotonGradient}></div>
              </div>
              <div className="w-full md:w-2/3 h-full bg-white/5 rounded-2xl border border-white/5 p-6 space-y-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-white/10"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-white/10 rounded w-1/3"></div>
                    <div className="h-4 bg-white/5 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-24 bg-red-500/10 border border-red-500/20 rounded-xl"></div>
                <div className="h-24 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: BENEFICIOS (Features) */}
        <section className="max-w-6xl mx-auto px-4 mb-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t[idioma].todoLoQueNecesitas}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-[#FEAFAE] mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t[idioma].feat1Tit}</h3>
              <p className="text-slate-400 leading-relaxed">{t[idioma].feat1Desc}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-[#FEAFAE] mb-6">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t[idioma].feat2Tit}</h3>
              <p className="text-slate-400 leading-relaxed">{t[idioma].feat2Desc}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-[#FEAFAE] mb-6">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t[idioma].feat3Tit}</h3>
              <p className="text-slate-400 leading-relaxed">{t[idioma].feat3Desc}</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: PRECIOS (Pricing) */}
        <section className="max-w-5xl mx-auto px-4 mb-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t[idioma].planes}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t[idioma].planFree}</h3>
                <p className="text-slate-400 mb-8">Ideal para probar la herramienta.</p>
                <div className="text-5xl font-black text-white mb-8">$0<span className="text-lg text-slate-500 font-medium">/mes</span></div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-slate-500" /> 10 Auditorías mensuales</li>
                  <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-slate-500" /> Exportación PDF estándar</li>
                </ul>
              </div>
              {/* CORRECCIÓN 2: El botón de Log In traducido */}
              <button onClick={() => signIn("google")} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-colors">
                {t[idioma].login}
              </button>
            </div>

            <div className="bg-[#0f0f13] border border-[#FEAFAE]/30 p-10 rounded-[2rem] relative shadow-[0_0_30px_rgba(255,164,189,0.1)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1" style={melocotonGradient}></div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex justify-between items-center">
                  {t[idioma].planPro} <span className="text-xs font-black px-3 py-1 bg-[#FEAFAE]/20 text-[#FEAFAE] rounded-full uppercase tracking-wider">Popular</span>
                </h3>
                <p className="text-slate-400 mb-8">Para agencias que escalan en serio.</p>
                <div className="text-5xl font-black text-white mb-8">$49<span className="text-lg text-slate-500 font-medium">/mes</span></div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Auditorías ilimitadas</li>
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Marca Blanca Total (PDF)</li>
                  <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Historial de Clientes infinito</li>
                </ul>
              </div>
              <button onClick={() => signIn("google")} className="w-full text-[#0a0a0c] font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg" style={melocotonGradient}>
                {t[idioma].btnUnete}
              </button>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-black text-xs" style={melocotonGradient}>M</div>
            <span className="font-bold text-white">Mora Analytics</span>
          </div>
          <p>© {new Date().getFullYear()} Mora. All rights reserved.</p>
        </footer>

      </div>
    );
  }
  // =========================================================================

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; height: auto !important; }
          @page { margin: 15mm; }
          .print-container { height: auto !important; overflow: visible !important; position: static !important; }
        }
        @keyframes fadeInCustom { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-custom { animation: fadeInCustom 0.5s ease-out forwards; }
      `}} />

      <div className="flex h-screen w-full font-sans text-slate-200 overflow-hidden print-container">
        
        <aside className="w-64 bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 flex flex-col justify-between print:hidden z-20 shadow-2xl">
          <div>
            <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-lg" style={melocotonGradient}>M</div>
               <span className="text-xl font-black text-white tracking-wide">Mora</span>
            </div>

            <div className="p-4 space-y-2 mt-4">
              {[ 
                { icon: Target, text: t[idioma].nueva, view: 'nueva' }, 
                { icon: Users, text: t[idioma].clientes, view: 'historial' }
              ].map((link, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setVista(link.view as any); setReporte(null); setMostrarPagos(false); }} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${ (vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "bg-white/10 text-white shadow-sm border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white" }`}
                >
                  <div className={(vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "text-[#FFA4BD]" : ""}><link.icon size={20} strokeWidth={(vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? 2.5 : 2} /></div> 
                  {link.text}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative overflow-y-auto z-10 print:overflow-visible print:h-auto print:static">
          
          <header className="h-20 flex justify-between items-center px-8 print:hidden border-b border-white/5 bg-white/[0.01] backdrop-blur-md sticky top-0 z-30">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {vista === 'nueva' && t[idioma].nueva}
              {vista === 'historial' && t[idioma].clientes}
              {vista === 'reporte_lectura' && t[idioma].detalleCliente}
              {vista === 'perfil' && t[idioma].configuracion}
              {vista === 'feedback' && t[idioma].buzonSug}
              {vista === 'facturacion' && t[idioma].facturacionTitulo}
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

               {menuPerfil && (
                 <div className="absolute right-0 mt-2 w-64 bg-[#0f0f13]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-custom">
                    <div className="px-4 py-3 border-b border-white/5">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t[idioma].suscripcion}</p>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                         <span className="text-sm font-bold text-white">{t[idioma].activa} ({perfil?.plan === 'pro' ? 'Pro' : 'Free'})</span>
                       </div>
                    </div>

                    <div className="py-2">
                      <button onClick={() => { setVista("perfil"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Settings size={16} /> {t[idioma].configuracion}
                      </button>
                      <button onClick={() => { setVista("facturacion"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                        <CreditCard size={16} /> {t[idioma].facturacion}
                      </button>
                      <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                        <span className="w-4 h-4 flex items-center justify-center border border-slate-400 rounded-full text-[10px]">🌐</span> Idioma: {idioma === "es" ? "ES" : "EN"}
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

          <div className="p-8 pb-32 max-w-6xl mx-auto w-full print:p-0 print:pb-0">
            
            {vista === "nueva" && (
              <div className="print:hidden">
                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-[2rem] shadow-2xl mb-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-lg" style={melocotonGradient}><Zap size={24} /></div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">{t[idioma].nueva}</h1>
                      <p className="text-slate-400 mt-1">{t[idioma].ingresaDatos}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].placeholderNombre}</label>
                    <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].invMensual}</label>
                      <input type="text" placeholder={`Ej: 1,500 ${moneda.split(" ")[0]}`} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={inversion} onChange={(e) => setInversion(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].conversiones}</label>
                      <input type="text" placeholder={t[idioma].placeholderConv} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={conversiones} onChange={(e) => setConversiones(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].cparoas}</label>
                      <input type="text" placeholder={`Ej: ${metrica} objetivo...`} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={cpaRoas} onChange={(e) => setCpaRoas(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].tipoCamp}</label>
                      <div className="relative">
                        <select className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={tipoCampana} onChange={(e) => setTipoCampana(e.target.value)}>
                          <option value="Búsqueda (Search)" className="bg-[#0f0f13] text-white">Búsqueda (Search)</option>
                          <option value="Performance Max" className="bg-[#0f0f13] text-white">Performance Max</option>
                          <option value="Display" className="bg-[#0f0f13] text-white">Display</option>
                          <option value="Shopping" className="bg-[#0f0f13] text-white">Shopping</option>
                          <option value="Video (YouTube)" className="bg-[#0f0f13] text-white">Video (YouTube)</option>
                          <option value="Mix de Campañas" className="bg-[#0f0f13] text-white">Mix de Campañas</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].contexto}</label>
                    <textarea className="w-full h-24 p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all resize-none" placeholder={t[idioma].placeholderContexto} value={notas} onChange={(e) => setNotas(e.target.value)} />
                  </div>

                  <button 
                    onClick={analizarCampaña} 
                    disabled={loading || !nombreCuenta || !inversion || !conversiones} 
                    className="w-full text-black px-6 py-4 rounded-2xl font-bold text-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg flex justify-center items-center gap-2" 
                    style={melocotonGradient}
                  >
                    {loading ? <span className="animate-pulse">{t[idioma].btnAnalizando}</span> : <><Target size={20}/> {t[idioma].btnAnalizar}</>}
                  </button>
                </div>
              </div>
            )}

            {((vista === "nueva" && reporte) || (vista === "reporte_lectura" && reporte)) && (
              <div className="animate-fade-custom print:bg-white print:m-0 print:p-0">
                
                {vista === "reporte_lectura" && (
                  <button onClick={() => setVista("historial")} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors print:hidden">
                    <ArrowLeft size={18} /> {t[idioma].volver}
                  </button>
                )}

                <div className={`bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:mt-0 ${vista === "nueva" ? "mt-8" : ""}`}>
                  
                  <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-slate-200 pb-6">
                    <div>{perfil?.agencia_logo ? <img src={perfil.agencia_logo} alt="Logo Agencia" className="h-16 object-contain" /> : <div className="flex items-center gap-2"><span className="text-3xl">🐾</span><span className="text-3xl font-black text-slate-800">Mora</span></div>}</div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{perfil?.agencia_nombre ? perfil.agencia_nombre : "Auditoría Estratégica"}</h2>
                      {agenciaWeb && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{agenciaWeb}</p>}
                      <p className="text-sm font-medium text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-10 print:mb-12">
                    <div>
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 print:text-slate-500 print:text-xs">{nombreCuenta || t[idioma].cuentaSinNombre}</h2>
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border-[6px] border-black/20 text-3xl font-black text-[#0a0a0c] shadow-lg print:border-slate-100 print:text-slate-800" style={melocotonGradient}>{reporte.score_general}</div>
                        <div>
                           <h3 className="text-4xl font-black text-white print:text-slate-900">{t[idioma].score}</h3>
                           <p className="text-slate-400 text-sm mt-1 print:text-slate-500">{t[idioma].puntajeBasado}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={descargarPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all print:hidden shadow-sm">{t[idioma].exportar}</button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 pl-6 bg-red-500/5 p-6 rounded-2xl border border-red-500/10 print:bg-red-50 print:border-red-100 print:shadow-sm" style={{ borderLeftColor: '#ef4444' }}>
                      <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2 print:text-red-700"><AlertTriangle size={24}/> {t[idioma].problemas}</h3>
                      {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => (
                        <p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>
                      ))}
                    </div>
                    
                    <div className="border-l-4 pl-6 bg-yellow-500/5 p-6 rounded-2xl border border-yellow-500/10 print:bg-amber-50 print:border-amber-100 print:shadow-sm" style={{ borderLeftColor: '#eab308' }}>
                      <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2 print:text-amber-700"><Zap size={24}/> {t[idioma].mejoras}</h3>
                      {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => (
                        <p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>
                      ))}
                    </div>

                    <div className="border-l-4 pl-6 bg-green-500/5 p-6 rounded-2xl border border-green-500/10 print:bg-emerald-50 print:border-emerald-100 print:shadow-sm" style={{ borderLeftColor: '#22c55e' }}>
                      <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2 print:text-emerald-700"><CheckCircle2 size={24}/> {t[idioma].aciertos}</h3>
                      {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => (
                        <p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="hidden print:block mt-16 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-400 font-medium">{agenciaPie}</p>
                  </div>
                </div>
              </div>
            )}

            {vista === "historial" && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl animate-fade-custom flex flex-col min-h-[600px] print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Users size={24} /></div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{t[idioma].monitoreo}</h2>
                        <p className="text-sm text-slate-400">{t[idioma].tenes} {historial.length} {t[idioma].registradas}</p>
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder={t[idioma].buscar} className="pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#FEAFAE] transition-all w-48" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                      </div>
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                          <button onClick={() => setFiltroEstado("todos")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtroEstado === 'todos' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{t[idioma].todos}</button>
                          <button onClick={() => setFiltroEstado("critico")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${filtroEstado === 'critico' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-red-400'}`}><span className="w-2 h-2 rounded-full bg-red-400"></span> {t[idioma].criticos}</button>
                          <button onClick={() => setFiltroEstado("atencion")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${filtroEstado === 'atencion' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {t[idioma].atencion}</button>
                      </div>
                   </div>
                </div>
                
                <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-wider items-center">
                    <div className="col-span-3 pl-2">{t[idioma].thCliente}</div>
                    <div className="col-span-2 text-center">{t[idioma].thFecha}</div>
                    <div className="col-span-2 text-center">{t[idioma].thEstado}</div>
                    <div className="col-span-2 text-center">{t[idioma].thTendencia}</div>
                    <div className="col-span-3 text-right pr-4">{t[idioma].thAccion}</div>
                  </div>

                  {clientesFiltrados.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 font-medium">{t[idioma].sinCuentas}</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {clientesFiltrados.map((item, index) => {
                        const estado = getEstadoData(item.score);
                        const StatusIcon = estado.icon;
                        const fakeDate = new Date().toLocaleDateString();
                        const fakeTrend = item.score > 60 ? { icon: TrendingUp, val: "+3", color: "text-green-400" } : { icon: TrendingDown, val: "-5", color: "text-red-400" };

                        return (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                            <div className="col-span-3 flex items-center gap-3 pl-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${estado.bg} ${estado.color} border ${estado.border} flex-shrink-0`}>{item.score}</div>
                              <p className="font-bold text-white truncate pr-2">{item.nombre_cuenta || t[idioma].cuentaSinNombre}</p>
                            </div>
                            <div className="col-span-2 text-center"><p className="text-sm text-slate-400">{fakeDate}</p></div>
                            <div className="col-span-2 flex justify-center">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estado.bg} ${estado.color} ${estado.border}`}><StatusIcon size={12} /> {estado.label}</span>
                            </div>
                            <div className="col-span-2 flex justify-center items-center gap-1">
                               <fakeTrend.icon size={14} className={fakeTrend.color} />
                               <span className={`text-sm font-bold ${fakeTrend.color}`}>{fakeTrend.val} pts</span>
                            </div>
                            <div className="col-span-3 flex justify-end items-center pr-2">
                              <button onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta || t[idioma].cuentaSinNombre); setVista("reporte_lectura"); }} className="text-xs font-bold text-[#FFA4BD] hover:text-white flex items-center gap-1 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5">
                                {t[idioma].abrirAud} <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {vista === "perfil" && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl mx-auto animate-fade-custom print:hidden">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Settings size={24} /></div>
                   <div>
                      <h2 className="text-3xl font-bold text-white">{t[idioma].configuracion}</h2>
                      <p className="text-slate-400 mt-1">{t[idioma].persPdf}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-[#FEAFAE] flex items-center gap-2 border-b border-white/5 pb-2"><Building2 size={18}/> {t[idioma].marcaBlanca}</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].nomAgencia}</label>
                      <input type="text" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].sitioWeb}</label>
                      <input type="text" placeholder="Ej: www.tuagencia.com" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={agenciaWeb} onChange={(e) => setAgenciaWeb(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].logoPdf}</label>
                      <div className="flex items-center gap-6 p-4 border border-white/10 rounded-xl bg-black/20">
                        {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white p-2" /> : <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 text-xs text-center p-2 border border-dashed border-white/20">{t[idioma].subeLogo}</div>}
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-400 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].piePagina}</label>
                      <textarea className="w-full h-20 p-4 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#FEAFAE] focus:outline-none transition-all resize-none" value={agenciaPie} onChange={(e) => setAgenciaPie(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-[#FEAFAE] flex items-center gap-2 border-b border-white/5 pb-2"><LayoutPanelLeft size={18}/> {t[idioma].preferencias}</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].monedaDef}</label>
                      <div className="relative">
                        <select className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                          <option value="USD ($)" className="bg-[#0f0f13]">Dólares USD ($)</option>
                          <option value="EUR (€)" className="bg-[#0f0f13]">Euros EUR (€)</option>
                          <option value="ARS ($)" className="bg-[#0f0f13]">Pesos Argentinos ARS ($)</option>
                          <option value="MXN ($)" className="bg-[#0f0f13]">Pesos Mexicanos MXN ($)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].metricaDef}</label>
                      <div className="relative">
                        <select className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={metrica} onChange={(e) => setMetrica(e.target.value)}>
                          <option value="ROAS" className="bg-[#0f0f13]">ROAS (Retorno de Inversión)</option>
                          <option value="CPA" className="bg-[#0f0f13]">CPA (Costo por Adquisición)</option>
                          <option value="ROI" className="bg-[#0f0f13]">ROI</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-white/5 mt-10 pt-8">
                  <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full md:w-auto md:px-12 text-black px-8 py-4 rounded-xl font-bold hover:scale-[1.02] disabled:opacity-50 transition-all shadow-lg mx-auto block" style={melocotonGradient}>
                    {loading ? t[idioma].guardando : t[idioma].guardarAj}
                  </button>
                </div>
              </div>
            )}

            {vista === "facturacion" && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto animate-fade-custom print:hidden">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><CreditCard size={24} /></div>
                   <div>
                      <h2 className="text-3xl font-bold text-white">{t[idioma].facturacionTitulo}</h2>
                      <p className="text-slate-400 mt-1">{t[idioma].facturacionDesc}</p>
                   </div>
                </div>

                <div className="bg-black/20 border border-white/10 rounded-2xl p-6 mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">{t[idioma].planActual}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-white">{perfil?.plan === 'pro' ? 'Mora Pro' : 'Mora Free'}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/20">{t[idioma].activa}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full text-slate-300 bg-white/5 border border-white/10 px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all shadow-lg mt-2 flex justify-center items-center gap-2 cursor-not-allowed opacity-80">
                  <CreditCard size={20} /> {t[idioma].gestionarStripe} <span className="text-[#FFA4BD] text-xs font-black">{t[idioma].pronto}</span>
                </button>
              </div>
            )}

            {vista === "feedback" && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto text-center animate-fade-custom print:hidden">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><MessageSquare size={32} /></div></div>
                <h2 className="text-3xl font-bold mb-3 text-white">{t[idioma].ayudanos}</h2>
                <p className="text-slate-400 mb-8 font-medium">{t[idioma].bug}</p>
                <textarea className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-2xl mb-6 text-white focus:border-[#FEAFAE] focus:outline-none resize-none transition-all" placeholder={t[idioma].escribiSug} value={mensajeFeedback} onChange={(e) => setMensajeFeedback(e.target.value)} />
                <button onClick={mandarFeedback} disabled={enviandoFeedback || !mensajeFeedback} className="w-full text-black px-8 py-4 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02]" style={melocotonGradient}>
                  {enviandoFeedback ? t[idioma].enviando : t[idioma].enviarSug}
                </button>
              </div>
            )}

          </div>

          <button onClick={() => { setVista("feedback"); setReporte(null); setMenuPerfil(false); }} className="fixed bottom-8 right-8 bg-white/10 text-white px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-white/20 print:hidden backdrop-blur-md">
            <MessageSquare size={18} /> {t[idioma].feedback}
          </button>

        </main>
      </div>
    </>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}