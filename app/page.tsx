"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link"; // <-- IMPORTACIÓN CLAVE DE NEXT.JS
import { 
  Target, Users, Building2, MessageSquare, LogOut, ChevronDown, 
  Zap, AlertTriangle, CheckCircle2, CreditCard, Settings, 
  Search, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, LayoutPanelLeft,
  FileText, BarChart3, ShieldCheck, Plus, Clock, Activity, Trash2, Lock, 
  Bell, ListChecks, LayoutGrid, CheckSquare, Sparkles, Undo2, RefreshCcw, Type, Calculator, BookOpen
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Paleta antigua (Mantenida para el Dashboard actual)
const melocotonGradient = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)" };
const melocotonText = { background: "linear-gradient(90deg, #FEECE3 0%, #FCD5BF 25%, #FEAFAE 50%, #FFA4BD 75%, #FFA9CC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

// --- NUEVA PALETA PASTEL ---
const pastelColors = {
  bg: "#FDE8D3",       
  textDark: "#262B27", 
  textMuted: "#657166",
  peach: "#F3C3B2",    
  blue: "#99CDD8",     
  mint: "#DAEBE3",     
  sage: "#CFD6C4"      
};

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
    <div ref={domRef} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function TiltWrapper({ children }: { children: React.ReactNode }) {
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [transition, setTransition] = useState('transform 0.5s ease-out');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const rotateX = (0.5 - y) * 10; 
    const rotateY = (x - 0.5) * 10; 
    setTransition('transform 0.1s ease-out'); 
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransition('transform 0.5s ease-out'); 
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ transform, transition }} className="w-full h-full will-change-transform">
      {children}
    </div>
  );
}

const WireframeBackground = () => {
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

    const nodes: number[][] = [];
    const radius = width > 1024 ? 400 : 250; 

    for (let i = 0; i <= 12; i++) {
      let lat = Math.PI * i / 12;
      for (let j = 0; j <= 24; j++) {
        let lon = 2 * Math.PI * j / 24;
        let x = radius * Math.sin(lat) * Math.cos(lon);
        let y = radius * Math.sin(lat) * Math.sin(lon);
        let z = radius * Math.cos(lat);
        nodes.push([x, y, z]);
      }
    }

    let angleX = 0;
    let angleY = 0;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angleX += 0.001;
      angleY += 0.002;

      const centerX = width * 0.75;
      const centerY = height * 0.5;

      ctx.strokeStyle = `rgba(38, 43, 39, 0.15)`; 
      ctx.lineWidth = 0.8; 

      const projectedNodes = nodes.map(node => {
        let x = node[0] * Math.cos(angleY) - node[2] * Math.sin(angleY);
        let z = node[0] * Math.sin(angleY) + node[2] * Math.cos(angleY);
        let y = node[1];

        let y2 = y * Math.cos(angleX) - z * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z * Math.cos(angleX);
        x = x; y = y2; z = z2;

        const fov = 1000;
        const scale = fov / (fov + z);
        const x2d = (x * scale) + centerX;
        const y2d = (y * scale) + centerY;
        
        return { x: x2d, y: y2d, scale: scale };
      });

      ctx.beginPath();
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
           const dist = Math.sqrt(
             Math.pow(projectedNodes[i].x - projectedNodes[j].x, 2) + 
             Math.pow(projectedNodes[i].y - projectedNodes[j].y, 2)
           );
           if (dist < (radius * 0.35)) { 
             ctx.moveTo(projectedNodes[i].x, projectedNodes[i].y);
             ctx.lineTo(projectedNodes[j].x, projectedNodes[j].y);
           }
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[1] print:hidden opacity-80" />;
};

const DashboardBackground = () => {
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
    const numParticles = Math.floor((width * height) / 18000); 

    for (let i = 0; i < numParticles; i++) {
      particles.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, radius: Math.random() * 1.2 + 0.4 });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(254, 175, 174, 0.4)'; 
      ctx.strokeStyle = 'rgba(254, 175, 174, 0.08)'; 

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x; let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) { 
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = (1 - dist / 110) * 0.7; ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);

  return <div className="fixed inset-0 w-full h-full pointer-events-none z-[1] print:hidden"><canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50" /></div>;
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
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [toastState, setToastState] = useState<{show: boolean, status: 'success' | 'undoing' | 'reverted', timeLeft: number}>({show: false, status: 'success', timeLeft: 15});

  const [modoPlan, setModoPlan] = useState<"agencia" | "individual">("agencia");

  const t = {
    es: { dashboard: "Dashboard", panelPrin: "Panel Principal", panelDesc: "Resumen del rendimiento global.", saludG: "Salud Promedio", totAud: "Total Cuentas", fugasDet: "Fugas Críticas", oporMej: "Oportunidades", ultAud: "Últimas Auditorías", actRec: "Actividad Reciente", verTodas: "Ver todas", generada: "Se auditó la cuenta", hace: "Hace", afectaA: "Afecta principalmente a:", buscarGlobal: "Buscar cuenta por nombre...", nueva: "Auditor IA", clientes: "Panel de Clientes", reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración General", facturacion: "Ver Facturación", salir: "Cerrar Sesión", placeholderNombre: "Nombre del Cliente o Cuenta", btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF", score: "Score General", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes", tituloland: "Auditorías Nivel Agencia", h1land1: "Detectá fugas de dinero con", h1land2: "Inteligencia Artificial.", pland1: "Conectá tu cuenta de Google Ads y dejá que nuestra Inteligencia Artificial audite tus campañas y genere reportes marca blanca en segundos.", btncomenzar: "Comenzar Gratis", detalleCliente: "Detalle del Cliente", buzonSug: "Buzón de Sugerencias", suscripcion: "Suscripción", activa: "Activa", renueva: "Renueva:", ingresaDatos: "Ingresá los datos clave de la campaña para un análisis preciso.", presupuestoObj: "Presupuesto Mensual", placeholderPres: "Ej: 1000", gastoAct: "Gasto Actual (Hasta hoy)", placeholderGasto: "Ej: 450", conversiones: "Conversiones", cparoas: "CPA o ROAS Actual", tipoCamp: "Tipo de Campaña", contexto: "Contexto y Notas del Cliente (Opcional)", placeholderConv: "Ej: 120", placeholderContexto: "Ej: El cliente quiere enfocarse en vender zapatos de invierno. Notamos muchos clics de países irrelevantes.", volver: "Volver al Panel", monitoreo: "Monitoreo de Cuentas", tenes: "Tenés", registradas: "auditorías registradas.", buscar: "Buscar cliente...", todos: "Todos", criticos: "Críticos", atencion: "Atención", optimos: "Óptimos", thCliente: "Cliente / Cuenta", thFecha: "Fecha", thEstado: "Estado IA", thTendencia: "Tendencia", thAccion: "Acción", abrirAud: "Abrir Auditoría", sinCuentas: "No se encontraron clientes.", cuentaSinNombre: "Cuenta sin nombre", persPdf: "Personalizá la identidad y las herramientas de tu agencia.", nomAgencia: "Nombre de la Agencia", logoPdf: "Logo (PDF)", subeLogo: "Sube un logo", guardando: "Guardando...", guardarAj: "Guardar Ajustes", ayudanos: "Ayudanos a mejorar Mora", bug: "¿Encontraste un bug o tenés una idea genial?", escribiSug: "Escribí tu sugerencia acá...", enviando: "Enviando...", enviarSug: "Enviar Sugerencia", facturacionTitulo: "Suscripción y Pagos", facturacionDesc: "Gestioná tu plan actual y métodos de pago de forma segura.", planActual: "Tu Plan Actual", gestionarStripe: "Gestionar en Stripe", pronto: "(Próximamente)", puntajeBasado: "Puntaje basado en rendimiento y estructura.", marcaBlanca: "Marca Blanca Visual", preferencias: "Preferencias de Trabajo", sitioWeb: "Website (Appears on PDF)", piePagina: "Pie de página legal (PDF)", monedaDef: "Moneda por defecto", metricaDef: "Métrica por defecto", feat1Tit: "Auditoría en Segundos", feat1Desc: "La IA procesa cientos de métricas y detecta fugas de presupuesto al instante.", feat2Tit: "Marca Blanca Total", feat2Desc: "Exportá PDFs impecables con tu logo, colores y sitio web listos para enviar al cliente.", feat3Tit: "Historial y Tendencias", feat3Desc: "Monitoreá el progreso de todas tus cuentas con scores evolutivos y alertas tempranas.", todoLoQueNecesitas: "Everything tu agencia necesita", planes: "Planes simples y transparentes", planFree: "Plan Starter", planPro: "Plan Agency", btnUnete: "Unite a Mora hoy", login: "Iniciar sesión", mockupTit: "Auditoría Finalizada", mockupScore: "Score de Salud", mockupCritico: "Fuga de Presupuesto", mockupCriticoDesc: "Detectamos $450/mes gastados en términos de búsqueda irrelevantes sin conversiones.", mockupOptimo: "Estructura Correcta", mockupOptimoDesc: "El seguimiento de conversiones está correctamente implementado en todas las campañas.", confirmarBorrar: "¿Seguro que querés eliminar esta auditoría? Esta acción no se puede deshacer.", notifTit: "Alertas del Guardián IA", notifVacio: "Todo en orden. No hay anomalías recientes.", tabDiag: "Diagnóstico IA", tabCheck: "Plan de Acción", tabAvanzado: "Análisis Avanzado", autoApply: "Corregir Ahora", msgAutoApply: "Para usar la ejecución en piloto automático (Auto-Apply), vinculá tu API de Google Ads en la sección de Integraciones. (Disponible próximamente)", pacingTit: "Pacing de Presupuesto", pacingDesc: "Ritmo de gasto proyectado", matrizTit: "Campaign Matrix", matrizDesc: "Distribución del gasto vs rendimiento", escalar: "ESTRELLAS (Escalar)", apagar: "BASURA (Apagar)", observar: "DUDOSOS (Observar)", potenciales: "POTENCIALES (Testear)" },
    en: { dashboard: "Dashboard", panelPrin: "Main Dashboard", panelDesc: "Global overview of your agency's performance.", saludG: "Avg Health Score", totAud: "Total Accounts", fugasDet: "Critical Leaks", oporMej: "Opportunities", ultAud: "Recent Audits", actRec: "Recent Activity", verTodas: "View all", generada: "Audit generated for", hace: "Ago", afectaA: "Mainly affecting:", buscarGlobal: "Search account by name...", nueva: "AI Auditor", clientes: "Client Dashboard", reportes: "Reports", feedback: "Feedback", configuracion: "General Settings", facturacion: "Billing", salir: "Sign Out", placeholderNombre: "Client or Account Name", btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF", score: "Overall Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths", tituloland: "Agency-Level Audits", h1land1: "Detect money leaks with", h1land2: "Artificial Intelligence.", pland1: "Connect your Google Ads account and let our AI audit your campaigns to generate white-label reports in seconds.", btncomenzar: "Start for Free", detalleCliente: "Client Details", buzonSug: "Suggestion Box", suscripcion: "Subscription", activa: "Active", renueva: "Renews:", ingresaDatos: "Enter key campaign data for a precise analysis.", presupuestoObj: "Target Monthly Budget", placeholderPres: "E.g. 1000", gastoAct: "Current Spend (To date)", placeholderGasto: "E.g. 450", conversiones: "Conversions", cparoas: "Current CPA or ROAS", tipoCamp: "Campaign Type", contexto: "Client Context & Notes (Optional)", placeholderConv: "E.g. 120", placeholderContexto: "E.g. The client wants to focus on selling winter shoes. We noticed many clicks from irrelevant countries.", volver: "Back to Dashboard", monitoreo: "Account Monitoring", tenes: "You have", registradas: "audits recorded.", buscar: "Search client...", todos: "All", criticos: "Critical", atencion: "Warning", optimos: "Optimal", thCliente: "Client / Account", thFecha: "Date", thEstado: "AI Status", thTendencia: "Trend", thAccion: "Action", abrirAud: "Open Audit", sinCuentas: "No clients found.", cuentaSinNombre: "Unnamed Account", persPdf: "Customize your agency's identity and workflow tools.", nomAgencia: "Agency Name", logoPdf: "Logo (PDF)", subeLogo: "Upload logo", guardando: "Saving...", guardarAj: "Save Settings", ayudanos: "Help us improve Mora", bug: "Found a bug or have a great idea?", escribiSug: "Write your suggestion here...", enviando: "Sending...", enviarSug: "Send Suggestion", facturacionTitulo: "Subscription & Billing", facturacionDesc: "Manage your current plan and payment methods securely.", planActual: "Your Current Plan", gestionarStripe: "Manage in Stripe", pronto: "(Coming Soon)", puntajeBasado: "Score based on performance and structure.", marcaBlanca: "Visual White Label", preferencias: "Workflow Preferences", sitioWeb: "Website (Appears on PDF)", piePagina: "Legal Footer (PDF)", monedaDef: "Default Currency", metricaDef: "Default Metric", feat1Tit: "Audits in Seconds", feat1Desc: "Our AI processes hundreds of metrics and detects budget leaks instantly.", feat2Tit: "Full White Label", feat2Desc: "Export flawless PDFs with your logo, colors, and website ready for your clients.", feat3Tit: "History & Trends", feat3Desc: "Monitor the progress of all your accounts with evolutionary scores and early warnings.", todoLoQueNecesitas: "Everything your agency needs", planes: "Simple & transparent pricing", planFree: "Starter Plan", planPro: "Agency Plan", btnUnete: "Join Mora today", login: "Log In", mockupTit: "Audit Completed", mockupScore: "Health Score", mockupCritico: "Budget Leak", mockupCriticoDesc: "We detected $450/mo spent on irrelevant search terms with 0 conversions.", mockupOptimo: "Correct Structure", mockupOptimoDesc: "Conversion tracking is correctly implemented across all active campaigns.", confirmarBorrar: "Are you sure you want to delete this audit? This action cannot be undone.", notifTit: "AI Guardian Alerts", notifVacio: "All clear. No recent anomalies.", tabDiag: "AI Diagnosis", tabCheck: "Action Plan", tabAvanzado: "Advanced Analysis", autoApply: "Auto-Apply", msgAutoApply: "To use the Auto-Apply execution, link your Google Ads API in the Integrations section. (Coming soon)", pacingTit: "Budget Pacing", pacingDesc: "Projected spend rhythm", matrizTit: "Campaign Matrix", matrizDesc: "Spend distribution vs performance", escalar: "STARS (Scale)", apagar: "TRASH (Pause)", observar: "DOUBTFUL (Observe)", potenciales: "POTENCIALES (Test)" }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (toastState.show && toastState.status === 'success' && toastState.timeLeft > 0) {
      timer = setInterval(() => { setToastState(prev => ({...prev, timeLeft: prev.timeLeft - 1})); }, 1000);
    } else if (toastState.show && toastState.status === 'success' && toastState.timeLeft <= 0) {
      setToastState(prev => ({...prev, show: false}));
    }
    return () => clearInterval(timer);
  }, [toastState.show, toastState.status, toastState.timeLeft]);

  const aplicarCambios = () => { setMostrarConfirmacion(false); setToastState({show: true, status: 'success', timeLeft: 15}); };
  const deshacerCambios = () => { setToastState(prev => ({...prev, status: 'undoing'})); setTimeout(() => { setToastState(prev => ({...prev, status: 'reverted'})); setTimeout(() => { setToastState(prev => ({...prev, show: false})); }, 3000); }, 1500); };
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
    if (!error) { setHistorial(historial.filter(item => item.id !== id)); if (vista === "reporte_lectura") setVista("historial"); } 
    else { alert("Error al eliminar la auditoría."); }
  };

  const toggleTarea = (index: number) => {
    if (tareasCompletadas.includes(index)) { setTareasCompletadas(tareasCompletadas.filter(i => i !== index)); } 
    else { setTareasCompletadas([...tareasCompletadas, index]); }
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
    } catch (error) { console.error("Error subiendo logo:", error); alert("Error al subir imagen."); } finally { setUploading(false); }
  };

  const guardarAjustesAgencia = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    const { error } = await supabase.from('suscripciones').update({ agencia_nombre: agenciaNombre, agencia_logo: agenciaLogo, agencia_web: agenciaWeb, agencia_pie: agenciaPie, moneda_default: moneda, metrica_default: metrica }).eq('email', session.user.email);
    if (!error) { alert("¡Ajustes guardados correctamente!"); obtenerPerfil(); } else { alert("Error guardando configuraciones."); }
    setLoading(false);
  };

  const mandarFeedback = async () => {
    if (!mensajeFeedback.trim() || !session?.user?.email) return;
    setEnviandoFeedback(true);
    const { error } = await supabase.from('feedback').insert([{ usuario_email: session.user.email, mensaje: mensajeFeedback }]);
    if (!error) { alert("¡Gracias por tu sugerencia!"); setMensajeFeedback(""); setVista("dashboard"); } else { alert("Error enviando feedback."); }
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

      let pacingStatus = "optimo", pacingColor = "text-green-400", pacingBg = "bg-green-400", pacingMsg = idioma === 'es' ? `🟢 Pacing Perfecto: Proyecta gastar $${projectedSpend}` : `🟢 Perfect Pacing: Projected spend $${projectedSpend}`;

      if (spendPercentage > 110) { pacingStatus = "overspend"; pacingColor = "text-red-400"; pacingBg = "bg-red-500"; pacingMsg = idioma === 'es' ? `🔴 Peligro Overspend: Proyecta gastar $${projectedSpend} (${spendPercentage}%)` : `🔴 Overspend Warning: Projected spend $${projectedSpend} (${spendPercentage}%)`; } 
      else if (spendPercentage < 90) { pacingStatus = "underspend"; pacingColor = "text-yellow-400"; pacingBg = "bg-yellow-400"; pacingMsg = idioma === 'es' ? `🟡 Peligro Underspend: Proyecta gastar solo $${projectedSpend}` : `🟡 Underspend Warning: Projected spend only $${projectedSpend}`; }

      const pacingData = { presupuesto: presObj, gasto: gastoAct, proyectado: projectedSpend, porcentajeProyectado: spendPercentage, porcentajeActual: currentPercentage, estado: pacingStatus, color: pacingColor, bg: pacingBg, mensaje: pacingMsg };

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const idiomaInstruccion = idioma === 'es' ? 'ESPAÑOL' : 'INGLÉS';
      
      const datosEstructurados = `Presupuesto Objetivo: ${presObj}\nGasto Actual: ${gastoAct}\nConversiones: ${conversiones}\nCPA / ROAS actual: ${cpaRoas}\nTipo de Campaña: ${tipoCampana}\nContexto/Notas del cliente: ${notas}`;
      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos y devuelve ÚNICAMENTE un JSON con esta estructura exacta, redactado en ${idiomaInstruccion}. No digas nada antes ni después. { "score_general": 45, "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40}, "hallazgos": { "graves_rojo": [{"titulo": "...", "descripcion": "..."}], "debiles_amarillo": [{"titulo": "...", "descripcion": "..."}], "bien_verde": [{"titulo": "...", "descripcion": "..."}] }, "checklist": [ {"tarea": "...", "impacto": "Alto", "color": "rojo"}, {"tarea": "...", "impacto": "Medio", "color": "amarillo"} ] } Datos a analizar: ${datosEstructurados}`;
      
      const result = await model.generateContent(prompt);
      let text = (await result.response).text();
      const startIndex = text.indexOf('{'); const endIndex = text.lastIndexOf('}');
      const jsonLimpio = text.substring(startIndex, endIndex + 1);
      const parsedReporte = JSON.parse(jsonLimpio);
      parsedReporte.pacing = pacingData;
      setReporte(parsedReporte);
      await supabase.from('historial_auditorias').insert([{ usuario_email: session.user.email, score: parsedReporte.score_general, reporte_json: parsedReporte, nombre_cuenta: nombreCuenta || "Sin nombre" }]);
      
      cargarHistorial(); setTareasCompletadas([]); setSubVistaReporte("avanzado"); setVista("reporte_lectura");
    } catch (error) { console.error("Error completo:", error); alert("Error al analizar. Verificá tu API Key y la consola."); }
    setLoading(false);
  };

  const getEstadoData = (score: number) => {
    if (score < 50) return { label: t[idioma].criticos, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle };
    if (score < 80) return { label: t[idioma].atencion, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Zap };
    return { label: t[idioma].optimos, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 };
  };

  const parseDate = (dateString: string) => { if (!dateString) return new Date().toLocaleDateString(); return new Date(dateString).toLocaleDateString(); };

  const clientesFiltrados = historial.filter(item => {
    const coincideFiltro = filtroEstado === "todos" || (filtroEstado === "critico" && item.score < 50) || (filtroEstado === "atencion" && item.score >= 50 && item.score < 80) || (filtroEstado === "optimo" && item.score >= 80);
    const nombreSeguro = item.nombre_cuenta || t[idioma].cuentaSinNombre;
    const coincideBusqueda = nombreSeguro.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const totalAuditorias = historial.length;
  const promedioScore = totalAuditorias > 0 ? Math.round(historial.reduce((acc, curr) => acc + curr.score, 0) / totalAuditorias) : 0;
  let totalFugas = 0; let totalOportunidades = 0;
  const cuentasRojas: {nombre: string, cant: number, reporte: any}[] = []; const cuentasAmarillas: {nombre: string, cant: number, reporte: any}[] = [];

  historial.forEach(h => {
      const nombre = h.nombre_cuenta || t[idioma].cuentaSinNombre;
      if (h.reporte_json?.hallazgos?.graves_rojo) { const cantRojas = h.reporte_json.hallazgos.graves_rojo.length; if (cantRojas > 0) { totalFugas += cantRojas; cuentasRojas.push({ nombre, cant: cantRojas, reporte: h.reporte_json }); } }
      if (h.reporte_json?.hallazgos?.debiles_amarillo) { const cantAma = h.reporte_json.hallazgos.debiles_amarillo.length; if (cantAma > 0) { totalOportunidades += cantAma; cuentasAmarillas.push({ nombre, cant: cantAma, reporte: h.reporte_json }); } }
  });

  cuentasRojas.sort((a,b) => b.cant - a.cant); cuentasAmarillas.sort((a,b) => b.cant - a.cant);
  const ultimaAuditoria = historial.length > 0 ? historial[0] : null;
  const fugasIndividuales = ultimaAuditoria?.reporte_json?.hallazgos?.graves_rojo?.length || 0;

  // PANTALLA DE CARGA ACTUALIZADA AL MODO CLARO CON LOGO PULSANTE
  if (status === "loading") return (
    <div className="h-screen w-full flex justify-center items-center bg-[#FDE8D3]">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#262B27] text-4xl shadow-lg bg-[#F3C3B2] animate-pulse">M</div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700&display=swap');
        
        /* Tema de la Landing Page (Solo activo cuando no hay sesión) */
        ${!session ? `
          body { font-family: 'Inter', sans-serif; background-color: #FDE8D3 !important; color: #262B27; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .translate-z-[-60px] { transform: translateZ(-60px); }
          .translate-z-[0px] { transform: translateZ(0px); }
          .translate-z-[40px] { transform: translateZ(40px); }
          .translate-z-[60px] { transform: translateZ(60px); }
          .translate-z-[80px] { transform: translateZ(80px); }
          .rotate-x-[15deg] { transform: rotateX(15deg) rotateY(-25deg); }
          .hover\\:rotate-x-[-5deg]:hover { transform: rotateX(-5deg) rotateY(5deg); }
        ` : `
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; height: auto !important; }
            @page { margin: 15mm; }
            .print-container { height: auto !important; overflow: visible !important; position: static !important; }
          }
        `}

        @keyframes fadeInCustom { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-custom { animation: fadeInCustom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      <div className={`flex h-screen w-full font-sans overflow-hidden print-container relative ${!session ? "bg-[#FDE8D3] selection:bg-[#F3C3B2] selection:text-[#262B27] text-[#262B27]" : "bg-[#0a0a0c] selection:bg-[#FEAFAE] selection:text-black text-slate-200"}`}>
        
        {/* --- CAMBIO DE FONDO DINÁMICO --- */}
        {!session ? (
          <WireframeBackground />
        ) : (
          <DashboardBackground />
        )}
        {/* ---------------------------------- */}

        {/* ========================================================================= */}
        {/* VISTA: LANDING PAGE (USUARIOS NO LOGUEADOS - TEMA CLARO Y PASTEL)         */}
        {/* ========================================================================= */}
        {!session ? (
          <div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10">
            <nav className="w-full max-w-[1400px] mx-auto px-6 py-6 flex justify-between items-center z-50 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#262B27] text-2xl shadow-sm bg-[#F3C3B2]">M</div>
                <span className="font-bold text-2xl tracking-tight text-[#262B27]">Mora</span>
              </div>
              <div className="hidden md:flex items-center gap-8 font-medium text-[#657166]">
                <Link href="/como-funciona" className="hover:text-[#262B27] transition-colors">Cómo funciona</Link>
                <Link href="/precios" className="hover:text-[#262B27] transition-colors">Precios</Link>
                <Link href="/faq" className="hover:text-[#262B27] transition-colors">FAQ</Link>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-sm font-bold text-[#657166] hover:text-[#262B27] transition-colors uppercase hidden sm:block">
                  {idioma}
                </button>
                <button onClick={() => signIn("google", { prompt: "select_account" })} className="bg-[#262B27] text-[#FDE8D3] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#262B27]/90 transition-colors shadow-lg border border-[#262B27]">
                  {t[idioma].login}
                </button>
              </div>
            </nav>

            {/* HERO SECTION 50/50 CON INTERFAZ EXPLOTADA 3D */}
            <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-28 overflow-hidden z-10 px-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[75vh]">
              {/* Lado Izquierdo: Narrativa */}
              <FadeInOnScroll>
                <div className="flex flex-col items-start text-left lg:pr-10">
                  <div className="border border-[#CFD6C4]/80 bg-[#CFD6C4]/30 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 flex items-center gap-3 text-[#262B27]">
                     <span className="w-2 h-2 rounded-full bg-[#F3C3B2] animate-pulse"></span>
                     Auditorías con IA
                  </div>
                  <h1 className="text-[3.5rem] md:text-7xl lg:text-[5rem] font-serif text-[#262B27] font-black leading-[1.05] mb-6 tracking-tight">
                    Detectá fugas de dinero con <span className="italic text-[#99CDD8]">precisión</span> quirúrgica.
                  </h1>
                  <p className="text-[#657166] text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
                    Conectá tu cuenta de Google Ads y dejá que nuestra IA audite tus campañas, traduzca las métricas y genere reportes marca blanca en segundos.
                  </p>
                  <button onClick={() => signIn("google", { prompt: "select_account" })} className="bg-[#F3C3B2] text-[#262B27] px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(243,195,178,0.6)] flex items-center justify-center gap-2 w-full sm:w-auto">
                    Comenzar prueba gratis <ArrowRight size={20} />
                  </button>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8 text-[13px] text-[#657166] font-semibold w-full">
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Sin tarjeta de crédito</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Setup en 1 minuto</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Cancelá cuando quieras</span>
                  </div>
                </div>
              </FadeInOnScroll>

              {/* Lado Derecho: Interfaz Explotada en 3D */}
              <FadeInOnScroll delay={200}>
                <div className="relative w-full h-[500px] lg:h-[650px] flex justify-center items-center mt-10 lg:mt-0 perspective-1000">
                   
                   {/* Contenedor 3D que rota entero */}
                   <div className="relative w-full max-w-sm lg:max-w-md transform-style-3d transition-transform duration-[1000ms] hover:rotate-x-[-5deg] rotate-x-[15deg]">
                      
                      {/* TARJETA 1 (Fondo Lejano): Gráfico de barras */}
                      <div className="absolute top-[-60px] left-[-80px] w-64 bg-white/60 backdrop-blur-md border border-[#CFD6C4]/60 shadow-[0_20px_40px_rgba(207,214,196,0.3)] rounded-2xl p-6 translate-z-[-60px]">
                         <p className="text-[10px] font-bold text-[#657166] uppercase tracking-widest mb-4">Gasto Diario</p>
                         <div className="flex items-end gap-2 h-20 opacity-80">
                           {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                              <div key={i} className="flex-1 bg-[#99CDD8]/40 rounded-t-sm" style={{height: `${h}%`}}></div>
                           ))}
                         </div>
                      </div>

                      {/* TARJETA 2 (Centro): Dashboard Principal */}
                      <div className="relative z-10 w-full bg-white/95 backdrop-blur-2xl border border-[#CFD6C4]/80 shadow-[0_30px_60px_rgba(38,43,39,0.15)] rounded-[2rem] p-6 translate-z-[0px]">
                         <div className="flex justify-between items-center mb-6 border-b border-[#CFD6C4]/50 pb-4">
                            <p className="font-bold text-[#262B27] flex items-center gap-2"><LayoutGrid size={18}/> Rendimiento</p>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#DAEBE3]/50 text-[#262B27] px-3 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#DAEBE3] border border-[#262B27]/20 animate-pulse"></span> Search
                            </span>
                         </div>
                         <div className="flex justify-center items-center flex-col py-2 mb-6">
                            <p className="text-xs font-bold text-[#657166] uppercase tracking-widest mb-3">Score de Salud</p>
                            <div className="w-28 h-28 rounded-full flex items-center justify-center border-[8px] border-[#FDE8D3] text-4xl font-black text-[#262B27] shadow-inner bg-[#DAEBE3]">
                              84
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#FDE8D3]/50 p-4 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#657166] uppercase tracking-wider mb-1">Gasto Total</p>
                               <p className="text-2xl font-black text-[#262B27]">$8.2k</p>
                            </div>
                            <div className="bg-[#FDE8D3]/50 p-4 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#657166] uppercase tracking-wider mb-1">Conversiones</p>
                               <p className="text-2xl font-black text-[#262B27]">142</p>
                            </div>
                         </div>
                      </div>

                      {/* TARJETA 3 (Frente Derecha): Alerta de Fuga */}
                      <div className="absolute bottom-[-40px] right-[-50px] z-20 w-72 bg-white/95 backdrop-blur-xl border border-[#F3C3B2] shadow-[0_20px_40px_rgba(243,195,178,0.5)] rounded-2xl p-5 translate-z-[80px]">
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F3C3B2]/30 flex items-center justify-center flex-shrink-0 border border-[#F3C3B2]/50">
                               <AlertTriangle size={20} className="text-[#262B27]" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-[#262B27] leading-tight">Fuga Crítica Detectada</p>
                               <p className="text-xs text-[#657166] mt-1 font-medium">Keywords irrelevantes</p>
                               <span className="inline-block mt-2 text-xs font-black text-[#262B27] bg-[#F3C3B2] px-2 py-1 rounded-md">-$620 / mes</span>
                            </div>
                         </div>
                      </div>

                      {/* MINI TARJETA 4 (Frente Arriba): Badge Conexión */}
                      <div className="absolute top-[-25px] right-[20px] z-30 bg-[#DAEBE3] text-[#262B27] px-4 py-2 rounded-full font-bold text-[10px] uppercase shadow-lg border border-[#CFD6C4] translate-z-[40px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#262B27] rounded-full animate-pulse"></span> Sincronizado
                      </div>

                      {/* MINI TARJETA 5 (Frente Abajo Izquierda): ROAS */}
                      <div className="absolute bottom-[60px] left-[-40px] z-30 bg-[#99CDD8] text-[#262B27] p-4 rounded-2xl shadow-[0_15px_30px_rgba(153,205,216,0.6)] translate-z-[60px] flex flex-col border border-[#CFD6C4]">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">ROAS Proyectado</p>
                        <p className="text-2xl font-black flex items-center gap-1"><TrendingUp size={16} strokeWidth={4}/> +12.4%</p>
                      </div>

                   </div>

                </div>
              </FadeInOnScroll>
            </section>

            {/* SECCIÓN RESUMEN: CÓMO FUNCIONA */}
            <FadeInOnScroll delay={100}>
              <section className="max-w-[1400px] mx-auto px-6 py-20 border-t border-[#CFD6C4]/40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12 items-end">
                   <div className="lg:col-span-1">
                     <p className="text-[10px] font-bold tracking-widest uppercase text-[#99CDD8] mb-2">Cómo funciona</p>
                     <h2 className="text-4xl md:text-5xl font-serif font-black text-[#262B27] leading-tight">Optimización en<br/>3 pasos.</h2>
                   </div>
                   <div className="lg:col-span-2">
                     <p className="text-lg text-[#657166] lg:max-w-xl font-medium">Conectás tu cuenta y en menos de 3 minutos tenés el primer reporte de fugas listo para actuar o compartir con tu cliente.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#CFD6C4] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#CFD6C4]/40 flex items-center justify-center text-[#262B27] mb-6 group-hover:scale-110 transition-transform"><Users size={24} /></div>
                      <h3 className="text-xl font-bold text-[#262B27] mb-3">1. Conectá</h3>
                      <p className="text-[#657166] leading-relaxed font-medium">Vinculá Google Ads en un clic. Acceso de solo lectura, totalmente seguro.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#99CDD8] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#99CDD8]/40 flex items-center justify-center text-[#262B27] mb-6 group-hover:scale-110 transition-transform"><Search size={24} /></div>
                      <h3 className="text-xl font-bold text-[#262B27] mb-3">2. Diagnosticá</h3>
                      <p className="text-[#657166] leading-relaxed font-medium">La IA detecta automáticamente los puntos exactos de desperdicio de dinero.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#F3C3B2] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#F3C3B2]/40 flex items-center justify-center text-[#262B27] mb-6 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                      <h3 className="text-xl font-bold text-[#262B27] mb-3">3. Ejecutá</h3>
                      <p className="text-[#657166] leading-relaxed font-medium">Exportá reportes impecables en PDF para tu cliente o aplicá los cambios.</p>
                   </div>
                </div>

                <div className="mt-8 text-center md:text-left">
                  <Link href="/como-funciona" className="inline-flex items-center gap-2 text-[#657166] font-bold text-sm hover:text-[#262B27] transition-colors bg-[#CFD6C4]/20 px-4 py-2 rounded-lg border border-[#CFD6C4]/50">
                    Ver el recorrido de la plataforma en detalle <ArrowRight size={14}/>
                  </Link>
                </div>
              </section>
            </FadeInOnScroll>

            {/* SECCIÓN RESUMEN: PRECIOS */}
            <FadeInOnScroll>
              <section className="max-w-[1400px] mx-auto px-6 py-20 border-t border-[#CFD6C4]/40">
                <div className="text-center mb-16">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#99CDD8] mb-2">Precios Simples</p>
                  <h2 className="text-4xl md:text-5xl font-serif font-black text-[#262B27] mb-4">Elegí tu camino.</h2>
                  <p className="text-[#657166] font-medium">Todos los planes incluyen 14 días de prueba gratis. Cancelá cuando quieras.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  
                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#DAEBE3] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(218,235,227,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#262B27] mb-2">Starter</h3>
                        <p className="text-[#657166] mb-8 text-sm font-medium">Para probar el poder de la IA en tu negocio.</p>
                        <div className="text-5xl font-black text-[#262B27] mb-8">$0<span className="text-lg text-[#657166] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#262B27]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#DAEBE3]" strokeWidth={3} /> 1 Cuenta publicitaria</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#DAEBE3]" strokeWidth={3} /> Auditoría Básica IA</li>
                          <li className="flex items-center gap-3 text-[#657166]/50 line-through"><CheckCircle2 size={18} className="text-[#CFD6C4]/30" strokeWidth={3} /> Marca Blanca</li>
                        </ul>
                      </div>
                      <button onClick={() => signIn("google")} className="w-full bg-[#CFD6C4]/30 hover:bg-[#CFD6C4]/60 text-[#262B27] font-bold py-4 rounded-xl transition-colors border border-[#CFD6C4]/50 mt-auto">Empezar gratis</button>
                    </div>
                  </TiltWrapper>

                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#99CDD8] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(153,205,216,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#262B27] mb-2">Individual</h3>
                        <p className="text-[#657166] mb-8 text-sm font-medium">Para emprendedores gestionando sus anuncios.</p>
                        <div className="text-5xl font-black text-[#262B27] mb-8">$19<span className="text-lg text-[#657166] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#262B27]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#99CDD8]" strokeWidth={3} /> Hasta 3 Cuentas</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#99CDD8]" strokeWidth={3} /> Auditorías Avanzadas</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#99CDD8]" strokeWidth={3} /> Exportación PDF</li>
                        </ul>
                      </div>
                      <button onClick={() => signIn("google")} className="w-full bg-[#99CDD8] hover:bg-[#85b9c4] text-[#262B27] font-bold py-4 rounded-xl transition-colors shadow-md mt-auto">Prueba de 14 días</button>
                    </div>
                  </TiltWrapper>

                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#F3C3B2] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(243,195,178,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#262B27] mb-2">Agency</h3>
                        <p className="text-[#657166] mb-8 text-sm font-medium">El centro de comando para agencias.</p>
                        <div className="text-5xl font-black text-[#262B27] mb-8">$49<span className="text-lg text-[#657166] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#262B27]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F3C3B2]" strokeWidth={3} /> Cuentas Ilimitadas</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F3C3B2]" strokeWidth={3} /> Marca Blanca Total</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#F3C3B2]" strokeWidth={3} /> Dashboard Multi-Cliente</li>
                        </ul>
                      </div>
                      <button onClick={() => signIn("google")} className="w-full bg-[#F3C3B2] hover:bg-[#eab3a1] text-[#262B27] font-bold py-4 rounded-xl transition-colors shadow-md mt-auto">Prueba de 14 días</button>
                    </div>
                  </TiltWrapper>

                </div>

                <div className="mt-12 text-center">
                  <Link href="/precios" className="inline-flex items-center gap-2 text-[#657166] font-bold text-sm hover:text-[#262B27] transition-colors bg-[#CFD6C4]/20 px-4 py-2 rounded-lg border border-[#CFD6C4]/50">
                    Ver la tabla de comparación completa <ArrowRight size={14}/>
                  </Link>
                </div>
              </section>
            </FadeInOnScroll>

            {/* SECCIÓN RESUMEN: FAQ */}
            <FadeInOnScroll>
              <section className="max-w-4xl mx-auto px-6 py-20 mb-12 border-t border-[#CFD6C4]/40">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-serif font-black text-[#262B27]">Preguntas Frecuentes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#262B27] mb-2">¿Mora hace cambios en mis campañas sin avisar?</h4>
                      <p className="text-[#657166] text-sm leading-relaxed font-medium">No. Mora audita y sugiere. Vos tenés el control total. Nunca tocaremos tu presupuesto sin permiso.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#262B27] mb-2">¿Necesito ser un experto en Google Ads?</h4>
                      <p className="text-[#657166] text-sm leading-relaxed font-medium">Para nada. Te decimos dónde estás perdiendo dinero y cómo solucionarlo en español claro.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#262B27] mb-2">¿Qué es la 'Marca Blanca Total'?</h4>
                      <p className="text-[#657166] text-sm leading-relaxed font-medium">Exclusiva del Plan Agency, te permite exportar auditorías en PDF con el logo, colores y web de tu agencia.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#262B27] mb-2">¿Mis datos están seguros?</h4>
                      <p className="text-[#657166] text-sm leading-relaxed font-medium">100%. Solo solicitamos permisos de lectura. No usamos tus datos para entrenar modelos públicos.</p>
                   </div>
                </div>

                <div className="mt-8 text-center">
                  <Link href="/faq" className="inline-flex items-center gap-2 text-[#657166] font-bold text-sm hover:text-[#262B27] transition-colors bg-[#CFD6C4]/20 px-4 py-2 rounded-lg border border-[#CFD6C4]/50">
                    Leer todas las preguntas frecuentes <ArrowRight size={14}/>
                  </Link>
                </div>
              </section>
            </FadeInOnScroll>

            <footer className="border-t border-[#CFD6C4]/50 bg-white/40 py-12 text-center text-[#657166] text-sm relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 rounded flex items-center justify-center font-black text-[#262B27] text-xs bg-[#F3C3B2]">M</div>
                <span className="font-bold text-[#262B27]">Mora Analytics</span>
              </div>
              <p className="mb-4 font-medium">© {new Date().getFullYear()} Mora. All rights reserved.</p>
              <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
                <Link href="/privacidad" className="hover:text-[#262B27] transition-colors">Privacidad</Link>
                <Link href="/terminos" className="hover:text-[#262B27] transition-colors">Términos</Link>
              </div>
            </footer>
          </div>
        ) : (
          
          /* ========================================================================= */
          /* VISTA: DASHBOARD LOGUEADO (TEMA OSCURO ORIGINAL INTACTO)                  */
          /* ========================================================================= */
          <>
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
                    { icon: BarChart3, text: modoPlan === 'individual' ? "Mi Negocio" : t[idioma].dashboard, view: 'dashboard' }, 
                    { icon: Users, text: modoPlan === 'individual' ? "Mis Auditorías" : t[idioma].clientes, view: 'historial' }
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
                   <div className={`p-2 rounded-lg ${perfil?.plan === 'pro' || modoPlan === 'agencia' ? 'bg-[#FEAFAE]/10 text-[#FEAFAE]' : 'bg-white/5 text-slate-500'}`}>
                     {perfil?.plan === 'pro' || modoPlan === 'agencia' ? <ShieldCheck size={18} /> : <Lock size={18} />}
                   </div>
                   <div>
                     <p className={`text-xs font-bold ${perfil?.plan === 'pro' || modoPlan === 'agencia' ? 'text-white' : 'text-slate-400'}`}>Soporte VIP</p>
                     <p className="text-[10px] text-slate-400">{perfil?.plan === 'pro' || modoPlan === 'agencia' ? 'Línea directa (1h)' : 'Exclusivo Plan Pro'}</p>
                   </div>
                 </div>
                 
                 {perfil?.plan === 'pro' || modoPlan === 'agencia' ? (
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
                  {vista === 'dashboard' && (modoPlan === 'agencia' ? t[idioma].dashboard : 'Resumen')}
                  {vista === 'nueva' && t[idioma].nueva}
                  {vista === 'historial' && (modoPlan === 'agencia' ? t[idioma].clientes : 'Historial')}
                  {vista === 'reporte_lectura' && t[idioma].detalleCliente}
                  {vista === 'perfil' && t[idioma].configuracion}
                  {vista === 'feedback' && t[idioma].buzonSug}
                  {vista === 'facturacion' && t[idioma].facturacionTitulo}
                </h2>

                <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-8">
                   <div className="relative w-full group">
                      <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-[#FEAFAE] transition-colors" />
                      <input type="text" placeholder={modoPlan === 'agencia' ? t[idioma].buscarGlobal : "Buscar en historial..."} value={busqueda} onChange={(e) => {setBusqueda(e.target.value); if (vista !== "historial" && e.target.value !== "") setVista("historial"); }} className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FEAFAE]/50 focus:bg-black/60 transition-all placeholder:text-slate-500 shadow-inner" />
                   </div>
                </div>
                
                <div className="relative min-w-[200px] flex justify-end items-center gap-4">
                   
                   {/* DEV TOGGLE PARA PROBAR PLANES */}
                   <div className="hidden lg:flex items-center bg-black/40 border border-white/10 rounded-full p-1 mr-2" title="Toggle de desarrollo">
                     <button onClick={() => setModoPlan('individual')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${modoPlan === 'individual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Individual</button>
                     <button onClick={() => setModoPlan('agencia')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${modoPlan === 'agencia' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Agencia</button>
                   </div>

                   <div className="relative">
                     <button onClick={() => {setMenuNotificaciones(!menuNotificaciones); setMenuPerfil(false)}} className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
                       <Bell size={20} className="text-slate-400 hover:text-white" />
                       {modoPlan === 'agencia' && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0c]"></span>}
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
                               {modoPlan === 'agencia' ? (
                                 <>
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
                                 </>
                               ) : (
                                 <div className="p-4 text-center text-sm text-slate-500">Todo en orden con tu cuenta. No hay alertas.</div>
                               )}
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
                          <p className="text-xs text-slate-400 font-medium">{modoPlan === 'agencia' ? 'Agency' : 'Individual'}</p>
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
                               <span className="text-sm font-bold text-white">{t[idioma].activa} ({modoPlan === 'agencia' ? 'Agency' : 'Indiv.'})</span>
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
                
                {vista === "dashboard" && modoPlan === "agencia" && (
                  <div className="animate-fade-custom print:hidden flex flex-col gap-8 relative z-10">
                    <div>
                      <h2 className="text-3xl font-bold text-white">{t[idioma].panelPrin}</h2>
                      <p className="text-slate-400 text-sm mt-1">{t[idioma].panelDesc}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-green-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Activity size={16}/> {t[idioma].saludG}</p>
                          <div className="flex items-end gap-3 relative z-10">
                            <span className={`text-5xl font-black ${promedioScore >= 80 ? 'text-green-400' : promedioScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {promedioScore}
                            </span>
                            <span className="text-lg text-slate-500 font-bold mb-1">/100</span>
                          </div>
                       </div>

                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-blue-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Users size={16}/> {t[idioma].totAud}</p>
                          <span className="text-5xl font-black text-white relative z-10">{totalAuditorias}</span>
                       </div>

                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-red-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400"/> {t[idioma].fugasDet}</p>
                          <div className="flex-1 flex flex-col">
                            <span className="text-5xl font-black text-white relative z-10 mb-4">{totalFugas}</span>
                            {cuentasRojas.length > 0 && (
                              <div className="mt-auto border-t border-white/5 pt-3 relative z-10">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t[idioma].afectaA}</p>
                                <div className="space-y-1.5">
                                  {cuentasRojas.slice(0, 2).map((c,i) => (
                                    <button key={i} onClick={() => { setReporte(c.reporte); setNombreCuenta(c.nombre); setVista("reporte_lectura"); }} className="w-full flex justify-between items-center text-xs hover:bg-white/10 p-1.5 -mx-1.5 rounded-lg transition-colors text-left group/btn">
                                       <span className="text-slate-300 group-hover/btn:text-white truncate pr-2 transition-colors">{c.nombre}</span>
                                       <span className="text-red-400 font-bold bg-red-500/10 group-hover/btn:bg-red-500/20 px-2 py-0.5 rounded transition-colors">{c.cant}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                       </div>

                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] hover:bg-white/10 transition-colors shadow-lg group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-yellow-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> {t[idioma].oporMej}</p>
                          <div className="flex-1 flex flex-col">
                            <span className="text-5xl font-black text-white relative z-10 mb-4">{totalOportunidades}</span>
                            {cuentasAmarillas.length > 0 && (
                              <div className="mt-auto border-t border-white/5 pt-3 relative z-10">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t[idioma].afectaA}</p>
                                <div className="space-y-1.5">
                                  {cuentasAmarillas.slice(0, 2).map((c,i) => (
                                    <button key={i} onClick={() => { setReporte(c.reporte); setNombreCuenta(c.nombre); setVista("reporte_lectura"); }} className="w-full flex justify-between items-center text-xs hover:bg-white/10 p-1.5 -mx-1.5 rounded-lg transition-colors text-left group/btn">
                                       <span className="text-slate-300 group-hover/btn:text-white truncate pr-2 transition-colors">{c.nombre}</span>
                                       <span className="text-yellow-400 font-bold bg-yellow-500/10 group-hover/btn:bg-yellow-500/20 px-2 py-0.5 rounded transition-colors">{c.cant}</span>
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

                {/* DASHBOARD PARA PLAN INDIVIDUAL */}
                {vista === "dashboard" && modoPlan === "individual" && (
                  <div className="animate-fade-custom print:hidden flex flex-col gap-8 relative z-10">
                    <div>
                      <h2 className="text-3xl font-bold text-white">Resumen de Negocio</h2>
                      <p className="text-slate-400 text-sm mt-1">El estado de tu cuenta de Google Ads y herramientas para crecer.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] shadow-lg hover:bg-white/10 transition-colors group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-green-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><Activity size={16}/> Salud de la Cuenta</p>
                          {ultimaAuditoria ? (
                            <div className="flex-1 flex flex-col justify-end relative z-10">
                               <div className="flex items-end gap-3 mb-2">
                                 <span className={`text-6xl font-black ${ultimaAuditoria.score >= 80 ? 'text-green-400' : ultimaAuditoria.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                   {ultimaAuditoria.score}
                                 </span>
                               </div>
                               <button onClick={() => { setReporte(ultimaAuditoria.reporte_json); setNombreCuenta(ultimaAuditoria.nombre_cuenta); setVista("reporte_lectura"); }} className="w-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-colors mt-2 text-left">
                                 Ver reporte completo <ArrowRight size={12} className="inline ml-1"/>
                               </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium relative z-10">No hay datos.</div>
                          )}
                       </div>

                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden backdrop-blur-xl min-h-[200px] shadow-lg hover:bg-white/10 transition-colors group">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-red-500/20"></div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400"/> Fugas Críticas</p>
                          {ultimaAuditoria ? (
                            <div className="flex-1 flex flex-col relative z-10">
                              <span className="text-5xl font-black text-white mb-2">{fugasIndividuales}</span>
                              <p className="text-xs text-slate-400 leading-relaxed">Problemas graves que están consumiendo tu presupuesto ahora mismo.</p>
                            </div>
                          ) : (
                             <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium relative z-10">No hay datos.</div>
                          )}
                       </div>

                       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-xl min-h-[200px] shadow-lg border-dashed hover:border-[#FEAFAE]/40 transition-colors cursor-pointer group" onClick={() => setVista("nueva")}>
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FEAFAE]/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#FEAFAE]/20"></div>
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10">
                             <Zap size={28} className="text-[#FEAFAE]" />
                          </div>
                          <h3 className="font-bold text-white text-lg relative z-10">Ejecutar Nueva Auditoría</h3>
                          <p className="text-xs text-slate-400 mt-2 px-4 relative z-10">Actualizá los datos de tu cuenta para ver el score de hoy.</p>
                       </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-6 mt-4">Herramientas Exclusivas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4"><BookOpen size={20}/></div>
                            <h4 className="font-bold text-white mb-1">Traductor de Métricas IA</h4>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Leé tu cuenta de Google Ads en lenguaje de negocios simple.</p>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-white/10 rounded-md text-white">Próximamente</span>
                         </div>
                         <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4"><Type size={20}/></div>
                            <h4 className="font-bold text-white mb-1">Generador de Anuncios</h4>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Títulos y descripciones redactados por IA listos para copiar y pegar.</p>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-white/10 rounded-md text-white">Próximamente</span>
                         </div>
                         <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 opacity-70 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 mb-4"><Calculator size={20}/></div>
                            <h4 className="font-bold text-white mb-1">Simulador de Presupuesto</h4>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Proyectá cuántas ventas tendrías si subís o bajás la inversión.</p>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-white/10 rounded-md text-white">Próximamente</span>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISTA: NUEVA AUDITORÍA (CON NUEVOS CAMPOS) */}
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

                {/* VISTA: LECTURA DE REPORTE (CON PESTAÑAS ENTERPRISE Y CHECKLIST INTERACTIVO) */}
                {vista === "reporte_lectura" && reporte && (
                  <div className="animate-fade-custom print:bg-white print:m-0 print:p-0 relative z-10">
                    
                    <div className="mb-6 flex justify-between items-center print:hidden">
                       <button onClick={() => setVista("dashboard")} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors"><ArrowLeft size={18} /> {t[idioma].volver}</button>
                       
                       <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1 shadow-lg">
                          <button onClick={() => setSubVistaReporte("diagnostico")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'diagnostico' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}><FileText size={16}/> {t[idioma].tabDiag}</button>
                          <button onClick={() => setSubVistaReporte("checklist")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'checklist' ? 'bg-[#FEAFAE]/20 text-[#FEAFAE]' : 'text-slate-500 hover:text-slate-300'}`}><ListChecks size={16}/> {t[idioma].tabCheck}</button>
                          <button onClick={() => setSubVistaReporte("avanzado")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${subVistaReporte === 'avanzado' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16}/> {t[idioma].tabAvanzado}</button>
                       </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                      
                      <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-slate-200 pb-6">
                        <div>{modoPlan === 'agencia' && perfil?.agencia_logo ? <img src={perfil.agencia_logo} alt="Logo Agencia" className="h-16 object-contain" /> : <div className="flex items-center gap-2"><span className="text-3xl">🐾</span><span className="text-3xl font-black text-slate-800">Mora</span></div>}</div>
                        <div className="text-right">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{modoPlan === 'agencia' && perfil?.agencia_nombre ? perfil.agencia_nombre : "Auditoría Estratégica"}</h2>
                          {modoPlan === 'agencia' && agenciaWeb && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{agenciaWeb}</p>}
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
                        {subVistaReporte === "diagnostico" && modoPlan === 'agencia' && <button onClick={descargarPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all print:hidden shadow-sm">{t[idioma].exportar}</button>}
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
                            <h2 className="text-2xl font-bold text-white">{modoPlan === 'agencia' ? t[idioma].monitoreo : "Historial de Auditorías"}</h2>
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
          </>
        )}
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