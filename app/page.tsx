"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { 
  Target, Users, Building2, MessageSquare, LogOut, ChevronDown, 
  Zap, AlertTriangle, CheckCircle2, CreditCard, Settings, 
  Search, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, LayoutPanelLeft,
  FileText, BarChart3, ShieldCheck, Plus, Clock, Activity, Trash2, Lock, 
  Bell, ListChecks, LayoutGrid, CheckSquare, Sparkles, Undo2, RefreshCcw
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const melocotonGradient = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)" };
const melocotonText = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

function FadeInOnScroll({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisible(true);
        observer.unobserve(domRef.current!);
      }
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={domRef} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: {x: number, y: number, vx: number, vy: number, radius: number}[] = [];
    const numParticles = Math.floor((width * height) / 12000); 

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4, 
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(254, 175, 174, 0.6)'; 
      ctx.strokeStyle = 'rgba(254, 175, 174, 0.12)'; 

      for (let i = 0; i < numParticles; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < numParticles; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) { 
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 1 - dist / 130;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 print:hidden opacity-50 mix-blend-screen" />;
};

function AuditorDashboard() {
  const { data: session, status } = useSession();
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [presupuestoObjetivo, setPresupuestoObjetivo] = useState("");
  const [gastoActual, setGastoActual] = useState("");
  
  const [conversiones, setConversiones] = useState("");
  const [cpaRoas, setCpaRoas] = useState("");
  const [tipoCampana, setTipoCampana] = useState("Búsqueda (Search)");
  const [notas, setNotas] = useState("");

  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [vista, setVista] = useState<"dashboard" | "nueva" | "historial" | "perfil" | "feedback" | "reporte_lectura" | "facturacion">("dashboard");
  const [subVistaReporte, setSubVistaReporte] = useState<"diagnostico" | "checklist" | "avanzado">("diagnostico");
  
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "critico" | "atencion" | "optimo">("todos");
  const [busqueda, setBusqueda] = useState(""); 
  
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [menuPerfil, setMenuPerfil] = useState(false);
  const [menuNotificaciones, setMenuNotificaciones] = useState(false);

  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [agenciaWeb, setAgenciaWeb] = useState("");
  const [agenciaPie, setAgenciaPie] = useState("Auditoría generada con tecnología IA - Reporte Confidencial.");
  const [moneda, setMoneda] = useState("USD ($)");
  const [metrica, setMetrica] = useState("ROAS");
  const [uploading, setUploading] = useState(false);

  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  
  const [tareasCompletadas, setTareasCompletadas] = useState<number[]>([]);
  
  // NUEVO ESTADO: Modal Destructivo y Toast de Deshacer
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [toastState, setToastState] = useState<{show: boolean, status: 'success' | 'undoing' | 'reverted', timeLeft: number}>({show: false, status: 'success', timeLeft: 15});

  const t = {
    es: {
      dashboard: "Dashboard", panelPrin: "Panel Principal", panelDesc: "Resumen del rendimiento global de tu agencia.",
      saludG: "Salud Promedio", totAud: "Total Cuentas", fugasDet: "Fugas Críticas", oporMej: "Oportunidades",
      ultAud: "Últimas Auditorías", actRec: "Actividad Reciente", verTodas: "Ver todas", generada: "Se auditó la cuenta", hace: "Hace",
      afectaA: "Afecta principalmente a:", buscarGlobal: "Buscar cuenta por nombre...",
      nueva: "Auditor IA", clientes: "Panel de Clientes",
      reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración General", facturacion: "Ver Facturación", salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta", btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF",
      score: "Score General", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes",
      tituloland: "Auditorías Nivel Agencia", h1land1: "Detectá fugas de dinero con", h1land2: "Inteligencia Artificial.",
      pland1: "Conectá tu cuenta de Google Ads y dejá que nuestra Inteligencia Artificial audite tus campañas y genere reportes marca blanca en segundos.",
      btncomenzar: "Comenzar Gratis", detalleCliente: "Detalle del Cliente", buzonSug: "Buzón de Sugerencias",
      suscripcion: "Suscripción", activa: "Activa", renueva: "Renueva:",
      ingresaDatos: "Ingresá los datos clave de la campaña para un análisis preciso.",
      presupuestoObj: "Presupuesto Mensual", placeholderPres: "Ej: 1000",
      gastoAct: "Gasto Actual (Hasta hoy)", placeholderGasto: "Ej: 450",
      conversiones: "Conversiones", cparoas: "CPA o ROAS Actual", tipoCamp: "Tipo de Campaña", contexto: "Contexto y Notas del Cliente (Opcional)",
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
      sitioWeb: "Website (Appears on PDF)", piePagina: "Pie de página legal (PDF)", monedaDef: "Moneda por defecto", metricaDef: "Métrica por defecto",
      feat1Tit: "Auditoría en Segundos", feat1Desc: "La IA procesa cientos de métricas y detecta fugas de presupuesto al instante.",
      feat2Tit: "Marca Blanca Total", feat2Desc: "Exportá PDFs impecables con tu logo, colores y sitio web listos para enviar al cliente.",
      feat3Tit: "Historial y Tendencias", feat3Desc: "Monitoreá el progreso de todas tus cuentas con scores evolutivos y alertas tempranas.",
      todoLoQueNecesitas: "Everything tu agencia necesita", planes: "Planes simples y transparentes", planFree: "Plan Starter", planPro: "Plan Agency",
      btnUnete: "Unite a Mora hoy", login: "Iniciar sesión",
      mockupTit: "Auditoría Finalizada", mockupScore: "Score de Salud", mockupCritico: "Fuga de Presupuesto", mockupCriticoDesc: "Detectamos $450/mes gastados en términos de búsqueda irrelevantes sin conversiones.", mockupOptimo: "Estructura Correcta", mockupOptimoDesc: "El seguimiento de conversiones está correctamente implementado en todas las campañas.",
      confirmarBorrar: "¿Seguro que querés eliminar esta auditoría? Esta acción no se puede deshacer.",
      notifTit: "Alertas del Guardián IA", notifVacio: "Todo en orden. No hay anomalías recientes.",
      tabDiag: "Diagnóstico IA", tabCheck: "Plan de Acción", tabAvanzado: "Análisis Avanzado",
      autoApply: "Corregir Ahora", msgAutoApply: "Para usar la ejecución en piloto automático (Auto-Apply), vinculá tu API de Google Ads en la sección de Integraciones. (Disponible próximamente)",
      pacingTit: "Pacing de Presupuesto", pacingDesc: "Ritmo de gasto proyectado",
      matrizTit: "Matriz de Campañas", matrizDesc: "Distribución del gasto vs rendimiento",
      escalar: "ESTRELLAS (Escalar)", apagar: "BASURA (Apagar)", observar: "DUDOSOS (Observar)", potenciales: "POTENCIALES (Testear)"
    },
    en: {
      dashboard: "Dashboard", panelPrin: "Main Dashboard", panelDesc: "Global overview of your agency's performance.",
      saludG: "Avg Health Score", totAud: "Total Accounts", fugasDet: "Critical Leaks", oporMej: "Opportunities",
      ultAud: "Recent Audits", actRec: "Recent Activity", verTodas: "View all", generada: "Audit generated for", hace: "Ago",
      afectaA: "Mainly affecting:", buscarGlobal: "Search account by name...",
      nueva: "AI Auditor", clientes: "Client Dashboard",
      reportes: "Reports", feedback: "Feedback", configuracion: "General Settings", facturacion: "Billing", salir: "Sign Out",
      placeholderNombre: "Client or Account Name", btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF",
      score: "Overall Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths",
      tituloland: "Agency-Level Audits", h1land1: "Detect money leaks with", h1land2: "Artificial Intelligence.",
      pland1: "Connect your Google Ads account and let our AI audit your campaigns to generate white-label reports in seconds.",
      btncomenzar: "Start for Free", detalleCliente: "Client Details", buzonSug: "Suggestion Box",
      suscripcion: "Subscription", activa: "Active", renueva: "Renews:",
      ingresaDatos: "Enter key campaign data for a precise analysis.",
      presupuestoObj: "Target Monthly Budget", placeholderPres: "E.g. 1000",
      gastoAct: "Current Spend (To date)", placeholderGasto: "E.g. 450",
      conversiones: "Conversions", cparoas: "Current CPA or ROAS", tipoCamp: "Campaign Type", contexto: "Client Context & Notes (Optional)",
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
      feat1Tit: "Audits in Seconds", feat1Desc: "Our AI processes hundreds of metrics and detects budget leaks instantly.",
      feat2Tit: "Full White Label", feat2Desc: "Export flawless PDFs with your logo, colors, and website ready for your clients.",
      feat3Tit: "History & Trends", feat3Desc: "Monitor the progress of all your accounts with evolutionary scores and early warnings.",
      todoLoQueNecesitas: "Everything your agency needs", planes: "Simple & transparent pricing", planFree: "Starter Plan", planPro: "Agency Plan",
      btnUnete: "Join Mora today", login: "Log In",
      mockupTit: "Audit Completed", mockupScore: "Health Score", mockupCritico: "Budget Leak", mockupCriticoDesc: "We detected $450/mo spent on irrelevant search terms with 0 conversions.", mockupOptimo: "Correct Structure", mockupOptimoDesc: "Conversion tracking is correctly implemented across all active campaigns.",
      confirmarBorrar: "Are you sure you want to delete this audit? This action cannot be undone.",
      notifTit: "AI Guardian Alerts", notifVacio: "All clear. No recent anomalies.",
      tabDiag: "AI Diagnosis", tabCheck: "Action Plan", tabAvanzado: "Advanced Analysis",
      autoApply: "Auto-Apply", msgAutoApply: "To use the Auto-Apply execution, link your Google Ads API in the Integrations section. (Coming soon)",
      pacingTit: "Budget Pacing", pacingDesc: "Projected spend rhythm",
      matrizTit: "Campaign Matrix", matrizDesc: "Spend distribution vs performance",
      escalar: "STARS (Scale)", apagar: "TRASH (Pause)", observar: "DOUBTFUL (Observe)", potenciales: "POTENTIAL (Test)"
    }
  };

  // LOGICA DEL TIMER DEL TOAST
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (toastState.show && toastState.status === 'success' && toastState.timeLeft > 0) {
      timer = setInterval(() => {
        setToastState(prev => ({...prev, timeLeft: prev.timeLeft - 1}));
      }, 1000);
    } else if (toastState.show && toastState.status === 'success' && toastState.timeLeft <= 0) {
      // Se acabó el tiempo y no deshizo nada, el cambio queda firme.
      setToastState(prev => ({...prev, show: false}));
    }
    return () => clearInterval(timer);
  }, [toastState.show, toastState.status, toastState.timeLeft]);

  const aplicarCambios = () => {
    setMostrarConfirmacion(false);
    // Reinicia el toast a 15 segundos
    setToastState({show: true, status: 'success', timeLeft: 15});
  };

  const deshacerCambios = () => {
    setToastState(prev => ({...prev, status: 'undoing'}));
    // Simulamos que la API tarda 1.5s en revertir
    setTimeout(() => {
      setToastState(prev => ({...prev, status: 'reverted'}));
      // Cerramos el toast 3 segundos después de confirmar que se deshizo
      setTimeout(() => {
        setToastState(prev => ({...prev, show: false}));
      }, 3000);
    }, 1500);
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

  const borrarAuditoria = async (id: number) => {
    if (!window.confirm(t[idioma].confirmarBorrar)) return;
    const { error } = await supabase.from('historial_auditorias').delete().eq('id', id);
    if (!error) {
      setHistorial(historial.filter(item => item.id !== id));
      if (vista === "reporte_lectura") setVista("historial");
    } else {
      alert("Error al eliminar la auditoría.");
    }
  };

  const toggleTarea = (index: number) => {
    if (tareasCompletadas.includes(index)) {
      setTareasCompletadas(tareasCompletadas.filter(i => i !== index));
    } else {
      setTareasCompletadas([...tareasCompletadas, index]);
    }
  };

  useEffect(() => {
    if (session) obtenerPerfil();
    if (vista === "historial" || vista === "dashboard") cargarHistorial();
  }, [vista, session]);

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
      agencia_nombre: agenciaNombre, agencia_logo: agenciaLogo, agencia_web: agenciaWeb,
      agencia_pie: agenciaPie, moneda_default: moneda, metrica_default: metrica
    }).eq('email', session.user.email);
    if (!error) {
      alert("¡Ajustes guardados correctamente!"); obtenerPerfil();
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
      alert("¡Gracias por tu sugerencia!"); setMensajeFeedback(""); setVista("dashboard"); 
    } else {
      alert("Error enviando feedback.");
    }
    setEnviandoFeedback(false);
  };

  const analizarCampaña = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const presObj = parseFloat(presupuestoObjetivo) || 0;
      const gastoAct = parseFloat(gastoActual) || 0;
      const today = new Date();
      const currentDay = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      const dailySpend = currentDay > 1 ? gastoAct / currentDay : gastoAct; 
      const projectedSpend = Math.round(dailySpend * daysInMonth);
      const spendPercentage = presObj > 0 ? Math.round((projectedSpend / presObj) * 100) : 0;
      const currentPercentage = presObj > 0 ? Math.min(Math.round((gastoAct / presObj) * 100), 100) : 0;

      let pacingStatus = "optimo";
      let pacingColor = "text-green-400";
      let pacingBg = "bg-green-400";
      let pacingMsg = idioma === 'es' ? `🟢 Pacing Perfecto: Proyecta gastar $${projectedSpend}` : `🟢 Perfect Pacing: Projected spend $${projectedSpend}`;

      if (spendPercentage > 110) {
          pacingStatus = "overspend";
          pacingColor = "text-red-400";
          pacingBg = "bg-red-500";
          pacingMsg = idioma === 'es' ? `🔴 Peligro Overspend: Proyecta gastar $${projectedSpend} (${spendPercentage}%)` : `🔴 Overspend Warning: Projected spend $${projectedSpend} (${spendPercentage}%)`;
      } else if (spendPercentage < 90) {
          pacingStatus = "underspend";
          pacingColor = "text-yellow-400";
          pacingBg = "bg-yellow-400";
          pacingMsg = idioma === 'es' ? `🟡 Peligro Underspend: Proyecta gastar solo $${projectedSpend}` : `🟡 Underspend Warning: Projected spend only $${projectedSpend}`;
      }

      const pacingData = {
          presupuesto: presObj,
          gasto: gastoAct,
          proyectado: projectedSpend,
          porcentajeProyectado: spendPercentage,
          porcentajeActual: currentPercentage,
          estado: pacingStatus,
          color: pacingColor,
          bg: pacingBg,
          mensaje: pacingMsg
      };

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const idiomaInstruccion = idioma === 'es' ? 'ESPAÑOL' : 'INGLÉS';
      
      const datosEstructurados = `
        Presupuesto Objetivo: ${presObj}
        Gasto Actual: ${gastoAct}
        Conversiones: ${conversiones}
        CPA / ROAS actual: ${cpaRoas}
        Tipo de Campaña: ${tipoCampana}
        Contexto/Notas del cliente: ${notas}
      `;

      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos y devuelve ÚNICAMENTE un JSON con esta estructura exacta, redactado en ${idiomaInstruccion}. No digas nada antes ni después.
      { 
        "score_general": 45, 
        "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40}, 
        "hallazgos": { 
          "graves_rojo": [{"titulo": "...", "descripcion": "..."}], 
          "debiles_amarillo": [{"titulo": "...", "descripcion": "..."}], 
          "bien_verde": [{"titulo": "...", "descripcion": "..."}] 
        },
        "checklist": [
          {"tarea": "...", "impacto": "Alto", "color": "rojo"},
          {"tarea": "...", "impacto": "Medio", "color": "amarillo"}
        ]
      }
      Datos a analizar: ${datosEstructurados}`;
      
      const result = await model.generateContent(prompt);
      let text = (await result.response).text();
      
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      const jsonLimpio = text.substring(startIndex, endIndex + 1);
      const parsedReporte = JSON.parse(jsonLimpio);
      
      parsedReporte.pacing = pacingData;
      
      setReporte(parsedReporte);
      await supabase.from('historial_auditorias').insert([{ 
        usuario_email: session.user.email, 
        score: parsedReporte.score_general, 
        reporte_json: parsedReporte, 
        nombre_cuenta: nombreCuenta || "Sin nombre" 
      }]);
      
      cargarHistorial(); 
      setTareasCompletadas([]);
      setSubVistaReporte("avanzado"); 
      setVista("reporte_lectura");
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error al analizar. Verificá tu API Key y la consola.");
    }
    setLoading(false);
  };

  const getEstadoData = (score: number) => {
    if (score < 50) return { label: t[idioma].criticos, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle };
    if (score < 80) return { label: t[idioma].atencion, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Zap };
    return { label: t[idioma].optimos, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 };
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString();
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

  const totalAuditorias = historial.length;
  const promedioScore = totalAuditorias > 0 ? Math.round(historial.reduce((acc, curr) => acc + curr.score, 0) / totalAuditorias) : 0;
  let totalFugas = 0;
  let totalOportunidades = 0;
  
  const cuentasRojas: {nombre: string, cant: number, reporte: any}[] = [];
  const cuentasAmarillas: {nombre: string, cant: number, reporte: any}[] = [];

  historial.forEach(h => {
      const nombre = h.nombre_cuenta || t[idioma].cuentaSinNombre;
      if (h.reporte_json?.hallazgos?.graves_rojo) {
         const cantRojas = h.reporte_json.hallazgos.graves_rojo.length;
         if (cantRojas > 0) {
            totalFugas += cantRojas;
            cuentasRojas.push({ nombre, cant: cantRojas, reporte: h.reporte_json });
         }
      }
      if (h.reporte_json?.hallazgos?.debiles_amarillo) {
         const cantAma = h.reporte_json.hallazgos.debiles_amarillo.length;
         if (cantAma > 0) {
            totalOportunidades += cantAma;
            cuentasAmarillas.push({ nombre, cant: cantAma, reporte: h.reporte_json });
         }
      }
  });

  cuentasRojas.sort((a,b) => b.cant - a.cant);
  cuentasAmarillas.sort((a,b) => b.cant - a.cant);

  if (status === "loading") return <div className="h-screen w-full flex justify-center items-center text-xl font-bold text-white bg-[#0a0a0c]">Cargando...</div>;

  if (!session) {
    return (
      <div className="min-h-screen w-full font-sans text-slate-200 overflow-y-auto overflow-x-hidden bg-[#0a0a0c] selection:bg-[#FEAFAE] selection:text-black relative">
        <NeuralBackground />
        <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-2xl shadow-[0_0_15px_rgba(255,164,189,0.5)]" style={melocotonGradient}>M</div>
            <span className="font-bold text-2xl tracking-wide text-white">Mora</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center border border-slate-400 rounded-full text-[10px]">🌐</span> {idioma === "es" ? "ES" : "EN"}
            </button>
            <button onClick={() => signIn("google", { prompt: "select_account" })} className="text-[#0a0a0c] px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,164,189,0.4)]" style={melocotonGradient}>
              {t[idioma].login}
            </button>
          </div>
        </nav>

        {/* HERO SECTION CON MICRO-COPY */}
        <FadeInOnScroll>
          <header className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-20 max-w-4xl mx-auto relative z-10">
            <div className="border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 flex items-center gap-3 shadow-lg">
               <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={melocotonGradient}></span>
               Auditorías con Inteligencia Artificial
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold mb-8 tracking-tight leading-[1.1] text-white">
              Detectá fugas de dinero con <br />
              <span style={melocotonText}>precisión quirúrgica.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Conectá tu cuenta de Google Ads y dejá que nuestra IA audite tus campañas, traduzca las métricas y genere reportes marca blanca en segundos.
            </p>
            <div className="flex flex-col items-center w-full sm:w-auto">
              <button onClick={() => signIn("google", { prompt: "select_account" })} className="w-full sm:w-auto text-[#0a0a0c] px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,164,189,0.3)] flex items-center justify-center gap-2 mb-3" style={melocotonGradient}>
                Comenzar prueba gratis <ArrowRight size={20} />
              </button>
              <p className="text-xs text-slate-500 font-medium">14 días de acceso total. Sin tarjeta de crédito.</p>
            </div>
          </header>
        </FadeInOnScroll>

        {/* CÓMO FUNCIONA EN 3 PASOS */}
        <FadeInOnScroll delay={200}>
          <section className="max-w-6xl mx-auto px-4 mb-32 relative z-10">
            <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Optimización en 3 pasos</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
               <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 rounded-full bg-[#0f0f13] border border-white/10 flex items-center justify-center text-3xl font-black text-white mb-6 shadow-[0_0_30px_rgba(255,164,189,0.1)]">1</div>
                  <h3 className="text-xl font-bold text-white mb-2">Conectá</h3>
                  <p className="text-slate-400 text-sm leading-relaxed px-4">Vinculá tu cuenta de Google Ads de forma segura con un solo clic.</p>
               </div>
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 rounded-full bg-[#0f0f13] border border-[#FEAFAE]/30 flex items-center justify-center text-3xl font-black text-[#FEAFAE] mb-6 shadow-[0_0_30px_rgba(255,164,189,0.2)]">2</div>
                  <h3 className="text-xl font-bold text-white mb-2">Diagnosticá</h3>
                  <p className="text-slate-400 text-sm leading-relaxed px-4">La IA analiza cientos de métricas y detecta dónde estás perdiendo presupuesto.</p>
               </div>
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 rounded-full bg-[#0f0f13] border border-white/10 flex items-center justify-center text-3xl font-black text-white mb-6 shadow-[0_0_30px_rgba(255,164,189,0.1)]">3</div>
                  <h3 className="text-xl font-bold text-white mb-2">Ejecutá</h3>
                  <p className="text-slate-400 text-sm leading-relaxed px-4">Aplicá el plan de acción sugerido o exportá el reporte en PDF para tu cliente.</p>
               </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* PLANES ACTUALIZADOS (INDIVIDUAL VS AGENCIA) */}
        <FadeInOnScroll>
          <section className="max-w-5xl mx-auto px-4 mb-32 relative z-10">
            <div className="text-center mb-16"><h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Elegí tu camino</h2><p className="text-slate-400">Comenzá con 14 días gratis en cualquier plan.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* PLAN PRO (DUEÑO DE NEGOCIO) */}
              <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] flex flex-col justify-between hover:border-white/20 transition-colors">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Plan Individual</h3>
                  <p className="text-slate-400 mb-8 text-sm">Para emprendedores que gestionan sus propios anuncios.</p>
                  <div className="text-5xl font-black text-white mb-8">$19<span className="text-lg text-slate-500 font-medium">/mes</span></div>
                  <ul className="space-y-4 mb-10 text-sm">
                    <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> 1 Cuenta publicitaria</li>
                    <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Traductor de Métricas IA</li>
                    <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Generador de Anuncios</li>
                    <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Checklist de Optimización</li>
                  </ul>
                </div>
                <button onClick={() => signIn("google", { prompt: "select_account" })} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-colors border border-white/10">Iniciar prueba de 14 días</button>
              </div>
              
              {/* PLAN AGENCY */}
              <div className="bg-[#0f0f13] border border-[#FEAFAE]/30 p-10 rounded-[2rem] relative shadow-[0_0_30px_rgba(255,164,189,0.1)] flex flex-col justify-between overflow-hidden hover:shadow-[0_0_50px_rgba(255,164,189,0.2)] transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1" style={melocotonGradient}></div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex justify-between items-center">Plan Agency <span className="text-[10px] font-black px-3 py-1 bg-[#FEAFAE]/20 text-[#FEAFAE] rounded-full uppercase tracking-wider">Escala</span></h3>
                  <p className="text-slate-400 mb-8 text-sm">El centro de comando para agencias de marketing.</p>
                  <div className="text-5xl font-black text-white mb-8">$49<span className="text-lg text-slate-500 font-medium">/mes</span></div>
                  <ul className="space-y-4 mb-10 text-sm">
                    <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Cuentas ilimitadas</li>
                    <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Marca Blanca Total (PDFs con logo)</li>
                    <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Dashboard Global Multi-cliente</li>
                    <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-[#FEAFAE]" /> Matriz de Campañas</li>
                  </ul>
                </div>
                <button onClick={() => signIn("google", { prompt: "select_account" })} className="w-full text-[#0a0a0c] font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg" style={melocotonGradient}>Iniciar prueba de 14 días</button>
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* PREGUNTAS FRECUENTES (FAQ) ACTUALIZADAS */}
        <FadeInOnScroll>
          <section className="max-w-4xl mx-auto px-4 mb-32 relative z-10">
            <div className="text-center mb-16"><h2 className="text-3xl font-bold text-white">Preguntas Frecuentes</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-white mb-2">¿Mora hace cambios en mis campañas sin avisar?</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">No. Mora audita y sugiere. Vos tenés el control total: podés aplicar los cambios con un clic o ignorarlos. Nunca tocaremos tu presupuesto sin permiso.</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-white mb-2">¿Necesito ser un experto en Google Ads?</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Para nada. Mora traduce métricas complejas a un lenguaje de negocios simple. Te decimos dónde estás perdiendo dinero y cómo solucionarlo.</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-white mb-2">¿Qué es exactamente la 'Marca Blanca Total'?</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Exclusiva del Plan Agency, te permite exportar auditorías en PDF con el logo, colores y web de tu agencia. Ideal para entregar reportes de nivel corporativo y reforzar la autoridad de tu marca.</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-lg font-bold text-white mb-2">¿Mis datos están seguros?</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">100%. Solo solicitamos permisos de lectura oficiales de Google. No usamos tus datos ni los de tus clientes para entrenar modelos de IA públicos.</p>
               </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-black text-xs" style={melocotonGradient}>M</div>
            <span className="font-bold text-white">Mora Analytics</span>
          </div>
          <p className="mb-4">© {new Date().getFullYear()} Mora. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-xs">
            <a href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</a>
            <a href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; height: auto !important; }
          @page { margin: 15mm; }
          .print-container { height: auto !important; overflow: visible !important; position: static !important; }
        }
        @keyframes fadeInCustom { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-custom { animation: fadeInCustom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      <div className="flex h-screen w-full font-sans text-slate-200 overflow-hidden print-container relative bg-[#0a0a0c]">
        
        <NeuralBackground />

        <aside className="w-64 bg-[#0a0a0c]/40 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between print:hidden z-20 relative shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <div>
            <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-xl shadow-lg" style={melocotonGradient}>M</div>
               <span className="text-xl font-black text-white tracking-wide">Mora</span>
            </div>

            <div className="px-4 mt-6 mb-2">
              <button onClick={() => { setVista("nueva"); setReporte(null); setMostrarPagos(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[#0a0a0c] shadow-[0_0_15px_rgba(255,164,189,0.3)] hover:scale-[1.02] transition-transform" style={melocotonGradient}>
                <Plus size={20} strokeWidth={3} /> {t[idioma].nueva}
              </button>
            </div>

            <div className="p-4 space-y-2 mt-2">
              {[ 
                { icon: BarChart3, text: t[idioma].dashboard, view: 'dashboard' }, 
                { icon: Users, text: t[idioma].clientes, view: 'historial' }
              ].map((link, idx) => (
                <button key={idx} onClick={() => { setVista(link.view as any); setReporte(null); setMostrarPagos(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${ (vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "bg-white/10 text-white shadow-sm border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white" }`}>
                  <div className={(vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "text-[#FFA4BD]" : ""}><link.icon size={20} strokeWidth={(vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? 2.5 : 2} /></div> 
                  {link.text}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mx-4 mb-6 p-4 rounded-xl bg-black/40 border border-white/5 relative z-10 backdrop-blur-md">
             <div className="flex items-center gap-3 mb-2">
               <div className={`p-2 rounded-lg ${perfil?.plan === 'pro' ? 'bg-[#FEAFAE]/10 text-[#FEAFAE]' : 'bg-white/5 text-slate-500'}`}>
                 {perfil?.plan === 'pro' ? <ShieldCheck size={18} /> : <Lock size={18} />}
               </div>
               <div>
                 <p className={`text-xs font-bold ${perfil?.plan === 'pro' ? 'text-white' : 'text-slate-400'}`}>Soporte VIP</p>
                 <p className="text-[10px] text-slate-400">{perfil?.plan === 'pro' ? 'Línea directa (1h)' : 'Exclusivo Plan Pro'}</p>
               </div>
             </div>
             
             {perfil?.plan === 'pro' ? (
               <button onClick={() => window.location.href = "mailto:soporte@tuagencia.com?subject=Soporte%20VIP%20Mora"} className="w-full mt-2 py-1.5 text-xs font-bold text-[#0a0a0c] rounded-lg hover:opacity-90 transition-opacity" style={melocotonGradient}>
                 Contactar Soporte
               </button>
             ) : (
               <button onClick={() => setVista("facturacion")} className="w-full mt-2 py-1.5 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                 Desbloquear
               </button>
             )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative overflow-y-auto z-10 print:overflow-visible print:h-auto print:static">
          
          <header className="h-20 flex justify-between items-center px-8 print:hidden border-b border-white/5 bg-[#0a0a0c]/20 backdrop-blur-md sticky top-0 z-30">
            <h2 className="text-2xl font-bold text-white tracking-tight min-w-[200px]">
              {vista === 'dashboard' && t[idioma].dashboard}
              {vista === 'nueva' && t[idioma].nueva}
              {vista === 'historial' && t[idioma].clientes}
              {vista === 'reporte_lectura' && t[idioma].detalleCliente}
              {vista === 'perfil' && t[idioma].configuracion}
              {vista === 'feedback' && t[idioma].buzonSug}
              {vista === 'facturacion' && t[idioma].facturacionTitulo}
            </h2>

            <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-8">
               <div className="relative w-full group">
                  <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-[#FEAFAE] transition-colors" />
                  <input type="text" placeholder={t[idioma].buscarGlobal} value={busqueda} onChange={(e) => {setBusqueda(e.target.value); if (vista !== "historial" && e.target.value !== "") setVista("historial"); }} className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEAFAE]/50 focus:bg-black/60 transition-all placeholder:text-slate-500 shadow-inner" />
               </div>
            </div>
            
            <div className="relative min-w-[200px] flex justify-end items-center gap-4">
               
               <div className="relative">
                 <button onClick={() => {setMenuNotificaciones(!menuNotificaciones); setMenuPerfil(false)}} className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
                   <Bell size={20} className="text-slate-400 hover:text-white" />
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0c]"></span>
                 </button>

                 {menuNotificaciones && (
                   <>
                     <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuNotificaciones(false)}></div>
                     <div className="absolute right-0 top-full mt-2 w-80 bg-[#0f0f13]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-custom">
                        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t[idioma].notifTit}</p>
                           <span className="px-2 py-0.5 bg-[#FEAFAE]/10 text-[#FEAFAE] text-[10px] font-bold rounded">Beta</span>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto">
                           <div className="p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border-l-2 border-red-500 bg-red-500/5 mb-1">
                             <p className="text-sm font-bold text-white mb-1">CPA Disparado (+45%)</p>
                             <p className="text-xs text-slate-400 leading-relaxed">Cliente: <b>Inmobiliaria VIP</b>. Detectamos un pico de gasto en la campaña 'Search'.</p>
                             <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><Clock size={10}/> Hace 2 horas</p>
                           </div>
                           <div className="p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border-l-2 border-yellow-500 mb-1">
                             <p className="text-sm font-bold text-white mb-1">Anuncio Rechazado</p>
                             <p className="text-xs text-slate-400 leading-relaxed">Cliente: <b>Teche</b>. Google rechazó 2 anuncios por 'Políticas de marca'.</p>
                             <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><Clock size={10}/> Ayer</p>
                           </div>
                        </div>
                     </div>
                   </>
                 )}
               </div>

               <button onClick={() => {setMenuPerfil(!menuPerfil); setMenuNotificaciones(false)}} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors border border-transparent hover:border-white/10">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-white leading-tight">{session.user?.name}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></span>
                      <p className="text-xs text-slate-400 font-medium">Operativo</p>
                    </div>
                  </div>
                  <img src={session.user?.image || ""} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-[#FEAFAE] shadow-sm" />
                  <ChevronDown size={16} className="text-slate-400" />
               </button>

               {menuPerfil && (
                 <>
                   <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuPerfil(false)}></div>
                   <div className="absolute right-0 top-full mt-2 w-64 bg-[#0f0f13]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-custom">
                      <div className="px-4 py-3 border-b border-white/5">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t[idioma].suscripcion}</p>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                           <span className="text-sm font-bold text-white">{t[idioma].activa} ({perfil?.plan === 'pro' ? 'Pro' : 'Free'})</span>
                         </div>
                      </div>
                      <div className="py-2">
                        <button onClick={() => { setVista("perfil"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><Settings size={16} /> {t[idioma].configuracion}</button>
                        <button onClick={() => { setVista("facturacion"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><CreditCard size={16} /> {t[idioma].facturacion}</button>
                        <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><span className="w-4 h-4 flex items-center justify-center border border-slate-400 rounded-full text-[10px]">🌐</span> Idioma: {idioma === "es" ? "ES" : "EN"}</button>
                      </div>
                      <div className="border-t border-white/5 mt-1 pt-2">
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"><LogOut size={16} /> {t[idioma].salir}</button>
                      </div>
                   </div>
                 </>
               )}
            </div>
          </header>

          <div className="p-8 pb-32 max-w-7xl mx-auto w-full print:p-0 print:pb-0" key={vista}>
            
            {vista === "dashboard" && (
              <div className="animate-fade-custom print:hidden flex flex-col gap-8 relative z-10">
                <div>
                  <h2 className="text-3xl font-bold text-white">{t[idioma].panelPrin}</h2>
                  <p className="text-slate-400 text-sm mt-1">{t[idioma].panelDesc}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Activity size={16}/> {t[idioma].saludG}</p>
                      <div className="flex items-end gap-3 relative z-10">
                        <span className={`text-5xl font-black ${promedioScore >= 80 ? 'text-green-400' : promedioScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {promedioScore}
                        </span>
                        <span className="text-lg text-slate-500 font-bold mb-1">/100</span>
                      </div>
                   </div>

                   <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Users size={16}/> {t[idioma].totAud}</p>
                      <span className="text-5xl font-black text-white relative z-10">{totalAuditorias}</span>
                   </div>

                   <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:border-red-500/30 transition-colors shadow-lg">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400"/> {t[idioma].fugasDet}</p>
                      <div className="flex-1 flex flex-col">
                        <span className="text-5xl font-black text-white relative z-10 mb-4">{totalFugas}</span>
                        {cuentasRojas.length > 0 && (
                          <div className="mt-auto border-t border-white/5 pt-3 relative z-10">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t[idioma].afectaA}</p>
                            <div className="space-y-1.5">
                              {cuentasRojas.slice(0, 2).map((c,i) => (
                                <button key={i} onClick={() => { setReporte(c.reporte); setNombreCuenta(c.nombre); setVista("reporte_lectura"); }} className="w-full flex justify-between items-center text-xs hover:bg-white/10 p-1.5 -mx-1.5 rounded-lg transition-colors text-left group">
                                   <span className="text-slate-300 group-hover:text-white truncate pr-2 transition-colors">{c.nombre}</span>
                                   <span className="text-red-400 font-bold bg-red-500/10 group-hover:bg-red-500/20 px-2 py-0.5 rounded transition-colors">{c.cant}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:border-yellow-500/30 transition-colors shadow-lg">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> {t[idioma].oporMej}</p>
                      <div className="flex-1 flex flex-col">
                        <span className="text-5xl font-black text-white relative z-10 mb-4">{totalOportunidades}</span>
                        {cuentasAmarillas.length > 0 && (
                          <div className="mt-auto border-t border-white/5 pt-3 relative z-10">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t[idioma].afectaA}</p>
                            <div className="space-y-1.5">
                              {cuentasAmarillas.slice(0, 2).map((c,i) => (
                                <button key={i} onClick={() => { setReporte(c.reporte); setNombreCuenta(c.nombre); setVista("reporte_lectura"); }} className="w-full flex justify-between items-center text-xs hover:bg-white/10 p-1.5 -mx-1.5 rounded-lg transition-colors text-left group">
                                   <span className="text-slate-300 group-hover:text-white truncate pr-2 transition-colors">{c.nombre}</span>
                                   <span className="text-yellow-400 font-bold bg-yellow-500/10 group-hover:bg-yellow-500/20 px-2 py-0.5 rounded transition-colors">{c.cant}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl flex flex-col shadow-lg">
                       <div className="flex justify-between items-center mb-6">
                         <h3 className="text-lg font-bold text-white">{t[idioma].ultAud}</h3>
                         <button onClick={() => setVista("historial")} className="text-sm font-bold text-[#FFA4BD] hover:text-white transition-colors">{t[idioma].verTodas}</button>
                       </div>
                       {historial.length === 0 ? (
                         <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium py-10 border border-dashed border-white/10 rounded-xl">{t[idioma].sinCuentas}</div>
                       ) : (
                         <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                           <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                             <div className="col-span-2 pl-2">{t[idioma].thCliente}</div>
                             <div className="text-center">{t[idioma].score}</div>
                             <div className="col-span-2 text-right pr-2">{t[idioma].thAccion}</div>
                           </div>
                           <div className="divide-y divide-white/5">
                             {historial.slice(0, 5).map((item, index) => {
                               const estado = getEstadoData(item.score);
                               return (
                                 <div key={index} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                   <div className="col-span-2 flex items-center gap-3 pl-2">
                                     <div className={`w-2 h-2 rounded-full ${estado.bg.replace('/10','/50')}`}></div>
                                     <p className="font-bold text-white text-sm truncate">{item.nombre_cuenta || t[idioma].cuentaSinNombre}</p>
                                   </div>
                                   <div className="text-center font-bold text-slate-300 text-sm">{item.score}</div>
                                   <div className="col-span-2 flex justify-end items-center gap-3 pr-2">
                                     <button onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta || t[idioma].cuentaSinNombre); setSubVistaReporte("diagnostico"); setVista("reporte_lectura"); }} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">Ver PDF</button>
                                     <button onClick={() => borrarAuditoria(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10" title="Eliminar"><Trash2 size={16} /></button>
                                   </div>
                                 </div>
                               )
                             })}
                           </div>
                         </div>
                       )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-lg">
                       <h3 className="text-lg font-bold text-white mb-6">{t[idioma].actRec}</h3>
                       {historial.length === 0 ? (
                         <div className="text-slate-500 text-sm font-medium text-center py-10">No hay actividad.</div>
                       ) : (
                         <ul className="space-y-6">
                            {historial.slice(0, 4).map((item, i) => (
                               <li key={i} className="flex gap-4 items-start relative">
                                  {i !== historial.slice(0,4).length - 1 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-white/10"></div>}
                                  <div className="w-6 h-6 rounded-full bg-white/10 border-[3px] border-[#0a0a0c] z-10 flex items-center justify-center flex-shrink-0">
                                     <div className={`w-2 h-2 rounded-full ${item.score >= 80 ? 'bg-green-400' : item.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                                  </div>
                                  <div>
                                     <p className="text-sm text-slate-300 font-medium leading-tight">{t[idioma].generada} <span className="text-white font-bold">{item.nombre_cuenta || t[idioma].cuentaSinNombre}</span></p>
                                     <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-bold tracking-wide"><Clock size={10} /> {parseDate(item.created_at)} • Score: {item.score}</p>
                                  </div>
                               </li>
                            ))}
                         </ul>
                       )}
                    </div>
                </div>
              </div>
            )}

            {vista === "nueva" && (
              <div className="animate-fade-custom print:hidden relative z-10">
                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-[2rem] shadow-2xl mb-8 max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-lg" style={melocotonGradient}><Zap size={24} /></div>
                    <div><h1 className="text-3xl font-bold text-white">{t[idioma].nueva}</h1><p className="text-slate-400 mt-1">{t[idioma].ingresaDatos}</p></div>
                  </div>
                  
                  <div className="mb-6"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].placeholderNombre}</label><input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} /></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].presupuestoObj}</label><input type="number" placeholder={t[idioma].placeholderPres} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={presupuestoObjetivo} onChange={(e) => setPresupuestoObjetivo(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].gastoAct}</label><input type="number" placeholder={t[idioma].placeholderGasto} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={gastoActual} onChange={(e) => setGastoActual(e.target.value)} /></div>
                    
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].conversiones}</label><input type="number" placeholder={t[idioma].placeholderConv} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={conversiones} onChange={(e) => setConversiones(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].cparoas}</label><input type="text" placeholder={`Ej: ${metrica} objetivo...`} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all" value={cpaRoas} onChange={(e) => setCpaRoas(e.target.value)} /></div>
                  </div>

                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].tipoCamp}</label>
                      <div className="relative"><select className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={tipoCampana} onChange={(e) => setTipoCampana(e.target.value)}><option value="Búsqueda (Search)" className="bg-[#0f0f13] text-white">Búsqueda (Search)</option><option value="Performance Max" className="bg-[#0f0f13] text-white">Performance Max</option><option value="Display" className="bg-[#0f0f13] text-white">Display</option><option value="Shopping" className="bg-[#0f0f13] text-white">Shopping</option><option value="Video (YouTube)" className="bg-[#0f0f13] text-white">Video (YouTube)</option><option value="Mix de Campañas" className="bg-[#0f0f13] text-white">Mix de Campañas</option></select><ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                  </div>

                  <div className="mb-8"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t[idioma].contexto}</label><textarea className="w-full h-24 p-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:border-[#FEAFAE] focus:ring-1 focus:ring-[#FEAFAE] focus:outline-none transition-all resize-none" placeholder={t[idioma].placeholderContexto} value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
                  
                  <button onClick={analizarCampaña} disabled={loading || !nombreCuenta || !presupuestoObjetivo || !gastoActual || !conversiones} className="w-full text-black px-6 py-4 rounded-2xl font-bold text-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg flex justify-center items-center gap-2" style={melocotonGradient}>
                    {loading ? <span className="animate-pulse">{t[idioma].btnAnalizando}</span> : <><Sparkles size={20}/> {t[idioma].btnAnalizar}</>}
                  </button>
                </div>
              </div>
            )}

            {vista === "reporte_lectura" && reporte && (
              <div className="animate-fade-custom print:bg-white print:m-0 print:p-0 relative z-10">
                
                <div className="mb-6 flex justify-between items-center print:hidden">
                   <button onClick={() => setVista("dashboard")} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors"><ArrowLeft size={18} /> {t[idioma].volver}</button>
                   
                   <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                      <button onClick={() => setSubVistaReporte("diagnostico")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'diagnostico' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}><FileText size={16}/> {t[idioma].tabDiag}</button>
                      <button onClick={() => setSubVistaReporte("checklist")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'checklist' ? 'bg-[#FEAFAE]/20 text-[#FEAFAE]' : 'text-slate-500 hover:text-slate-300'}`}><ListChecks size={16}/> {t[idioma].tabCheck}</button>
                      <button onClick={() => setSubVistaReporte("avanzado")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'avanzado' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16}/> {t[idioma].tabAvanzado}</button>
                   </div>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                  
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
                        <div><h3 className="text-4xl font-black text-white print:text-slate-900">{t[idioma].score}</h3><p className="text-slate-400 text-sm mt-1 print:text-slate-500">{t[idioma].puntajeBasado}</p></div>
                      </div>
                    </div>
                    {subVistaReporte === "diagnostico" && <button onClick={descargarPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all print:hidden shadow-sm">{t[idioma].exportar}</button>}
                  </div>
                  
                  {subVistaReporte === "diagnostico" && (
                    <div className="space-y-6 animate-fade-custom">
                      {reporte.hallazgos?.graves_rojo?.length > 0 && (
                        <div className="border-l-4 pl-6 bg-red-500/5 p-6 rounded-2xl border border-red-500/10 print:bg-red-50 print:border-red-100 print:shadow-sm" style={{ borderLeftColor: '#ef4444' }}>
                          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2 print:text-red-700"><AlertTriangle size={24}/> {t[idioma].problemas}</h3>
                          {reporte.hallazgos.graves_rojo.map((item: any, i: number) => (<p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                        </div>
                      )}
                      {reporte.hallazgos?.debiles_amarillo?.length > 0 && (
                        <div className="border-l-4 pl-6 bg-yellow-500/5 p-6 rounded-2xl border border-yellow-500/10 print:bg-amber-50 print:border-amber-100 print:shadow-sm" style={{ borderLeftColor: '#eab308' }}>
                          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2 print:text-amber-700"><Zap size={24}/> {t[idioma].mejoras}</h3>
                          {reporte.hallazgos.debiles_amarillo.map((item: any, i: number) => (<p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                        </div>
                      )}
                      {reporte.hallazgos?.bien_verde?.length > 0 && (
                        <div className="border-l-4 pl-6 bg-green-500/5 p-6 rounded-2xl border border-green-500/10 print:bg-emerald-50 print:border-emerald-100 print:shadow-sm" style={{ borderLeftColor: '#22c55e' }}>
                          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2 print:text-emerald-700"><CheckCircle2 size={24}/> {t[idioma].aciertos}</h3>
                          {reporte.hallazgos.bien_verde.map((item: any, i: number) => (<p key={i} className="mb-4 text-slate-300 leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-white print:text-slate-900 text-lg">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                        </div>
                      )}
                    </div>
                  )}

                  {subVistaReporte === "checklist" && (
                     <div className="animate-fade-custom bg-[#0f0f13]/60 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-inner">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                           <div>
                             <h3 className="text-xl font-bold text-white flex items-center gap-2"><ListChecks size={24} className="text-[#FEAFAE]" /> Optimización de 20 Minutos</h3>
                             <p className="text-slate-400 text-sm mt-1">Completá estas tareas en Google Ads para mejorar tu Score.</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progreso</p>
                             <p className="text-lg font-bold text-[#FEAFAE]">{tareasCompletadas.length} / {reporte.checklist?.length || 0}</p>
                           </div>
                        </div>

                        {reporte.checklist ? (
                          <div className="space-y-3">
                            {reporte.checklist.map((item: any, i: number) => {
                              const esCompletada = tareasCompletadas.includes(i);
                              return (
                                <div key={i} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${esCompletada ? "bg-green-500/5 border-green-500/20 opacity-60" : "bg-white/5 border-white/10 hover:border-[#FEAFAE]/30"}`}>
                                   <div className="flex items-start gap-4">
                                     <button onClick={() => toggleTarea(i)} className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${esCompletada ? "bg-green-500 border-green-500 text-black" : "border-slate-600 hover:border-[#FEAFAE]"}`}>
                                        {esCompletada && <CheckSquare size={16} strokeWidth={3} />}
                                     </button>
                                     <div>
                                       <p className={`font-bold text-white transition-all ${esCompletada ? "line-through text-slate-500" : "text-lg"}`}>{item.tarea}</p>
                                       <div className="flex gap-2 mt-1">
                                         <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${item.color === 'rojo' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>Prioridad: {item.impacto}</span>
                                       </div>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={() => setMostrarConfirmacion(true)} 
                                     className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-all group"
                                   >
                                      <Sparkles size={14} className="text-[#FEAFAE] group-hover:animate-pulse" /> {t[idioma].autoApply}
                                   </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 py-10">Esta auditoría es antigua y no tiene Checklist. Generá una nueva.</div>
                        )}
                     </div>
                  )}

                  {subVistaReporte === "avanzado" && (
                     <div className="animate-fade-custom grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {reporte.pacing ? (
                          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
                             <div className={`absolute top-0 right-0 w-32 h-32 ${reporte.pacing.bg}/10 blur-3xl rounded-full pointer-events-none`}></div>
                             <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Clock size={20} className={reporte.pacing.color}/> {t[idioma].pacingTit}</h3>
                             <p className="text-sm text-slate-400 mb-8">{t[idioma].pacingDesc}</p>
                             
                             <div className="flex justify-between items-end mb-3">
                                <div><p className="text-xs font-bold text-slate-500 uppercase">Gasto Actual</p><p className="text-3xl font-black text-white mt-1">${reporte.pacing.gasto}</p></div>
                                <div className="text-right"><p className="text-xs font-bold text-slate-500 uppercase">Presupuesto</p><p className="text-xl font-bold text-slate-300 mt-1">${reporte.pacing.presupuesto}</p></div>
                             </div>
                             <div className="w-full bg-white/5 rounded-full h-3 mb-4 border border-white/5 overflow-hidden">
                               <div className={`${reporte.pacing.bg} h-3 rounded-full transition-all duration-1000`} style={{width: `${reporte.pacing.porcentajeActual}%`}}></div>
                             </div>
                             <p className={`text-xs font-bold ${reporte.pacing.color} ${reporte.pacing.bg.replace('bg-', 'bg-').replace('-400', '-500')}/10 inline-block px-3 py-1.5 rounded-lg self-start border border-${reporte.pacing.bg.replace('bg-', '')}/20`}>
                               {reporte.pacing.mensaje}
                             </p>
                          </div>
                        ) : (
                          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-8 flex items-center justify-center text-slate-500 text-sm text-center">
                            Este reporte es antiguo y no tiene datos de presupuesto.
                          </div>
                        )}

                        <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-8">
                           <div className="flex justify-between items-start mb-6">
                             <div>
                               <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><LayoutGrid size={20} className="text-[#FEAFAE]"/> {t[idioma].matrizTit}</h3>
                               <p className="text-sm text-slate-400">{t[idioma].matrizDesc}</p>
                             </div>
                             <span className="px-2 py-0.5 bg-[#FEAFAE]/10 text-[#FEAFAE] text-[10px] font-bold rounded">Próximamente</span>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3 h-48 opacity-50 grayscale cursor-not-allowed">
                              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-green-400">{t[idioma].escalar}</span>
                                <span className="text-2xl font-black text-white">?</span>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-blue-400">{t[idioma].potenciales}</span>
                                <span className="text-2xl font-black text-white">?</span>
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-yellow-400">{t[idioma].observar}</span>
                                <span className="text-2xl font-black text-white">?</span>
                              </div>
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-red-400">{t[idioma].apagar}</span>
                                <span className="text-2xl font-black text-white">?</span>
                              </div>
                           </div>
                        </div>

                     </div>
                  )}

                  <div className="hidden print:block mt-16 pt-6 border-t border-slate-200 text-center"><p className="text-xs text-slate-400 font-medium">{agenciaPie}</p></div>
                </div>
              </div>
            )}

            {vista === "historial" && (
              <div className="animate-fade-custom bg-white/5 border border-white/10 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl flex flex-col min-h-[600px] print:hidden relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><Users size={24} /></div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{t[idioma].monitoreo}</h2>
                        <p className="text-sm text-slate-400">{t[idioma].tenes} {historial.length} {t[idioma].registradas}</p>
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-3">
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
                        const fakeTrend = item.score > 60 ? { icon: TrendingUp, val: "+3", color: "text-green-400" } : { icon: TrendingDown, val: "-5", color: "text-red-400" };

                        return (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                            <div className="col-span-3 flex items-center gap-3 pl-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${estado.bg} ${estado.color} border ${estado.border} flex-shrink-0`}>{item.score}</div>
                              <p className="font-bold text-white truncate pr-2">{item.nombre_cuenta || t[idioma].cuentaSinNombre}</p>
                            </div>
                            <div className="col-span-2 text-center"><p className="text-sm text-slate-400">{parseDate(item.created_at)}</p></div>
                            <div className="col-span-2 flex justify-center">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estado.bg} ${estado.color} ${estado.border}`}><StatusIcon size={12} /> {estado.label}</span>
                            </div>
                            <div className="col-span-2 flex justify-center items-center gap-1">
                               <fakeTrend.icon size={14} className={fakeTrend.color} />
                               <span className={`text-sm font-bold ${fakeTrend.color}`}>{fakeTrend.val} pts</span>
                            </div>
                            <div className="col-span-3 flex justify-end items-center gap-3 pr-2">
                              <button onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta || t[idioma].cuentaSinNombre); setSubVistaReporte("diagnostico"); setVista("reporte_lectura"); }} className="text-xs font-bold text-[#FFA4BD] hover:text-white flex items-center gap-1 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5">
                                {t[idioma].abrirAud} <ArrowRight size={14} />
                              </button>
                              <button onClick={() => borrarAuditoria(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Eliminar auditoría">
                                <Trash2 size={18} />
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
              <div className="animate-fade-custom bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl mx-auto print:hidden relative z-10">
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
                    <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].nomAgencia}</label><input type="text" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].sitioWeb}</label><input type="text" placeholder="Ej: www.tuagencia.com" className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all" value={agenciaWeb} onChange={(e) => setAgenciaWeb(e.target.value)} /></div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].logoPdf}</label>
                      <div className="flex items-center gap-6 p-4 border border-white/10 rounded-xl bg-black/20">
                        {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white p-2" /> : <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 text-xs text-center p-2 border border-dashed border-white/20">{t[idioma].subeLogo}</div>}
                        <div className="flex-1"><input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-400 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all" /></div>
                      </div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].piePagina}</label><textarea className="w-full h-20 p-4 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#FEAFAE] focus:outline-none transition-all resize-none" value={agenciaPie} onChange={(e) => setAgenciaPie(e.target.value)} /></div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-[#FEAFAE] flex items-center gap-2 border-b border-white/5 pb-2"><LayoutPanelLeft size={18}/> {t[idioma].preferencias}</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].monedaDef}</label>
                      <div className="relative"><select className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={moneda} onChange={(e) => setMoneda(e.target.value)}><option value="USD ($)" className="bg-[#0f0f13]">Dólares USD ($)</option><option value="EUR (€)" className="bg-[#0f0f13]">Euros EUR (€)</option><option value="ARS ($)" className="bg-[#0f0f13]">Pesos Argentinos ARS ($)</option><option value="MXN ($)" className="bg-[#0f0f13]">Pesos Mexicanos MXN ($)</option></select><ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{t[idioma].metricaDef}</label>
                      <div className="relative"><select className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white focus:border-[#FEAFAE] focus:outline-none transition-all appearance-none cursor-pointer" value={metrica} onChange={(e) => setMetrica(e.target.value)}><option value="ROAS" className="bg-[#0f0f13]">ROAS (Retorno de Inversión)</option><option value="CPA" className="bg-[#0f0f13]">CPA (Costo por Adquisición)</option><option value="ROI" className="bg-[#0f0f13]">ROI</option></select><ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/5 mt-10 pt-8">
                  <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full md:w-auto md:px-12 text-black px-8 py-4 rounded-xl font-bold hover:scale-[1.02] disabled:opacity-50 transition-all shadow-lg mx-auto block" style={melocotonGradient}>{loading ? t[idioma].guardando : t[idioma].guardarAj}</button>
                </div>
              </div>
            )}

            {vista === "facturacion" && (
              <div className="animate-fade-custom bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto print:hidden relative z-10">
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
                <button className="w-full text-slate-300 bg-white/5 border border-white/10 px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all shadow-lg mt-2 flex justify-center items-center gap-2 cursor-not-allowed opacity-80"><CreditCard size={20} /> {t[idioma].gestionarStripe} <span className="text-[#FFA4BD] text-xs font-black">{t[idioma].pronto}</span></button>
              </div>
            )}

            {vista === "feedback" && (
              <div className="animate-fade-custom bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl max-w-2xl mx-auto text-center print:hidden relative z-10">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10"><MessageSquare size={32} /></div></div>
                <h2 className="text-3xl font-bold mb-3 text-white">{t[idioma].ayudanos}</h2>
                <p className="text-slate-400 mb-8 font-medium">{t[idioma].bug}</p>
                <textarea className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-2xl mb-6 text-white focus:border-[#FEAFAE] focus:outline-none resize-none transition-all" placeholder={t[idioma].escribiSug} value={mensajeFeedback} onChange={(e) => setMensajeFeedback(e.target.value)} />
                <button onClick={mandarFeedback} disabled={enviandoFeedback || !mensajeFeedback} className="w-full text-black px-8 py-4 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02]" style={melocotonGradient}>{enviandoFeedback ? t[idioma].enviando : t[idioma].enviarSug}</button>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE AUTO-APPLY */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setMostrarConfirmacion(false)}></div>
          <div className="bg-[#0f0f13] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl w-full max-w-md relative z-10 animate-fade-custom overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">Confirmar Acción</h3>
                  <p className="text-sm text-slate-400 mt-1">Conexión con Google Ads</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                <strong className="text-white">⚠️ ATENCIÓN:</strong> Estás por ejecutar cambios directos en el presupuesto y estado de las campañas.<br/><br/>
                ¿Confirmás que revisaste el impacto de esta acción y deseás aplicar los cambios?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setMostrarConfirmacion(false)} className="px-5 py-3 rounded-xl font-bold text-sm text-slate-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 w-full">
                  Cancelar
                </button>
                <button onClick={aplicarCambios} className="px-5 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 w-full flex justify-center items-center gap-2">
                  <Sparkles size={16} /> Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST DE DESHACER (UNDO) */}
      {toastState.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[120] bg-[#0f0f13] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col w-80 animate-fade-custom">
           <div className="p-4 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                 {toastState.status === 'success' && <CheckCircle2 className="text-green-400" size={20} />}
                 {toastState.status === 'undoing' && <RefreshCcw className="text-yellow-400 animate-spin" size={20} />}
                 {toastState.status === 'reverted' && <Undo2 className="text-slate-400" size={20} />}
                 
                 <div>
                    <p className="text-sm font-bold text-white">
                      {toastState.status === 'success' ? 'Cambios aplicados.' : 
                       toastState.status === 'undoing' ? 'Revertiendo...' : 'Cambios revertidos.'}
                    </p>
                    {toastState.status === 'success' && <p className="text-[10px] text-slate-400 font-medium">Permanentes en {toastState.timeLeft}s</p>}
                 </div>
              </div>
              {toastState.status === 'success' && (
                <button onClick={deshacerCambios} className="text-[#FEAFAE] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors px-3 py-1.5 bg-[#FEAFAE]/10 rounded hover:bg-[#FEAFAE]/20">
                   Deshacer
                </button>
              )}
           </div>
           {/* Barra de progreso visual para los 15s */}
           {toastState.status === 'success' && (
              <div className="w-full bg-white/5 h-1">
                 <div 
                   className="bg-[#FEAFAE] h-1 transition-all duration-1000 ease-linear" 
                   style={{ width: `${(toastState.timeLeft / 15) * 100}%` }}
                 ></div>
              </div>
           )}
        </div>
      )}

      {session && (
        <button onClick={() => { setVista("feedback"); setReporte(null); setMenuPerfil(false); }} className="fixed bottom-8 right-8 z-50 bg-white/10 text-white px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-white/20 print:hidden backdrop-blur-md">
          <MessageSquare size={18} /> {t[idioma].feedback}
        </button>
      )}
    </>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}