"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
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

// --- PALETA PASTEL (Landing Page) ---
const pastelColors = {
  bg: "#FDE8D3",       
  textDark: "#262B27", 
  textMuted: "#657166",
  peach: "#F3C3B2",    
  blue: "#99CDD8",     
  mint: "#DAEBE3",     
  sage: "#CFD6C4"      
};

// --- PALETA DASHBOARD (Off-Black Olive) ---
const dashColors = {
  bg: "#131714",       
  card: "#1A1F1B",     
  border: "#2C352E",   
  textPrimary: "#E8EBE4", 
  textMuted: "#8A968C",   
  peach: "#F3C3B2",    
  red: "#E66767",      
  green: "#99CDD8",    
  yellow: "#EAB308"    
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

// --- FONDO LANDING: ESFERA DE AUDITORÍA ---
const AuditWireframeBackground = () => {
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

    const nodes: any[] = [];
    const edges: number[][] = [];
    let radius = width > 1024 ? 400 : 280; 

    for (let i = 0; i <= 16; i++) {
      let lat = Math.PI * i / 16;
      for (let j = 0; j <= 32; j++) {
        let lon = 2 * Math.PI * j / 32;
        let x = radius * Math.sin(lat) * Math.cos(lon);
        let y = radius * Math.sin(lat) * Math.sin(lon);
        let z = radius * Math.cos(lat);
        const isErrorCandidate = (i > 8 && i < 13) && (j > 3 && j < 11);
        const isError = isErrorCandidate && Math.random() > 0.4;
        nodes.push({ x, y, z, isError, glow: 0, scaleFactor: 1 });
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      let nextInLat = i + 1;
      if (i % 33 !== 32 && nextInLat < nodes.length) edges.push([i, nextInLat]);
      let nextInLon = i + 33;
      if (nextInLon < nodes.length) edges.push([i, nextInLon]);
    }

    let angleX = 0;
    let angleY = 0;
    let scanY = -height * 0.5; 
    let pulses: any[] = []; 
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angleX += 0.0006;
      angleY += 0.0012;
      scanY += 3.5; 
      if (scanY > height * 1.3) scanY = -height * 0.4;

      const centerX = width > 1024 ? width * 0.76 : width * 0.5;
      const centerY = height * 0.5;

      const projectedNodes = nodes.map(node => {
        let x = node.x * Math.cos(angleY) - node.z * Math.sin(angleY);
        let z = node.x * Math.sin(angleY) + node.z * Math.cos(angleY);
        let y = node.y;

        let y2 = y * Math.cos(angleX) - z * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z * Math.cos(angleX);
        x = x; y = y2; z = z2;

        const fov = 1100;
        const scale = fov / (fov + z);
        const x2d = (x * scale) + centerX;
        const y2d = (y * scale) + centerY;
        
        const zNormalized = (z2 + radius) / (radius * 2);
        const depthAlpha = 0.15 + 0.85 * zNormalized; 
        
        const distToScan = Math.abs(y2d - scanY);
        if (distToScan < 45) {
           node.glow = 1.0; 
           node.scaleFactor = node.isError ? 1.6 : 1.2; 
        } else {
           node.glow *= node.isError ? 0.98 : 0.88; 
           node.scaleFactor = 1 + (node.scaleFactor - 1) * 0.96; 
        }
        
        return { x: x2d, y: y2d, scale: scale * node.scaleFactor, isError: node.isError, glow: Math.max(0.05, node.glow), depthAlpha: depthAlpha };
      });

      if (scanY > -100 && scanY < height + 100) {
         const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
         scanGradient.addColorStop(0, 'rgba(218, 235, 227, 0)');
         scanGradient.addColorStop(0.5, 'rgba(218, 235, 227, 0.4)'); 
         scanGradient.addColorStop(1, 'rgba(218, 235, 227, 0)');
         ctx.fillStyle = scanGradient;
         ctx.fillRect(centerX - radius * 1.5, scanY - 20, radius * 3, 40);
         ctx.beginPath();
         ctx.strokeStyle = 'rgba(218, 235, 227, 0.8)';
         ctx.lineWidth = 1.5;
         ctx.moveTo(centerX - radius * 1.2, scanY);
         ctx.lineTo(centerX + radius * 1.2, scanY);
         ctx.stroke();
      }

      ctx.lineWidth = 1.2; 
      edges.forEach(edge => {
        const p1 = projectedNodes[edge[0]];
        const p2 = projectedNodes[edge[1]];
        const edgeAlpha = (p1.depthAlpha + p2.depthAlpha) / 2;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(38, 43, 39, ${0.35 * edgeAlpha})`; 
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      if (Math.random() < 0.08) {
        const randomEdge = edges[Math.floor(Math.random() * edges.length)];
        pulses.push({ from: randomEdge[0], to: randomEdge[1], progress: 0, speed: 0.03 + Math.random() * 0.04 });
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        let pulse = pulses[i];
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) { pulses.splice(i, 1); continue; }
        const p1 = projectedNodes[pulse.from];
        const p2 = projectedNodes[pulse.to];
        const pulseDepth = (p1.depthAlpha + p2.depthAlpha) / 2;

        if (pulseDepth > 0.5) {
           const curX = p1.x + (p2.x - p1.x) * pulse.progress;
           const curY = p1.y + (p2.y - p1.y) * pulse.progress;
           const tailProg = Math.max(0, pulse.progress - 0.2);
           const tailX = p1.x + (p2.x - p1.x) * tailProg;
           const tailY = p1.y + (p2.y - p1.y) * tailProg;
           ctx.beginPath();
           const pulseGradient = ctx.createLinearGradient(curX, curY, tailX, tailY);
           pulseGradient.addColorStop(0, `rgba(153, 205, 216, ${0.9 * pulseDepth})`); 
           pulseGradient.addColorStop(1, `rgba(153, 205, 216, 0)`); 
           ctx.strokeStyle = pulseGradient;
           ctx.lineWidth = 3 * p1.scale;
           ctx.lineCap = "round";
           ctx.moveTo(curX, curY);
           ctx.lineTo(tailX, tailY);
           ctx.stroke();
        }
      }

      projectedNodes.forEach(pn => {
        let baseAlpha = 0.5 * pn.depthAlpha;
        let fillColor = `rgba(38, 43, 39, ${baseAlpha})`;
        if (pn.glow > 0.08) {
           let glowStrength = pn.glow * pn.depthAlpha; 
           if (pn.isError) {
              fillColor = `rgba(239, 68, 68, ${0.3 + glowStrength * 0.7})`;
              ctx.shadowBlur = 20 * glowStrength; 
              ctx.shadowColor = `rgba(239, 68, 68, 1)`; 
           } else {
              fillColor = `rgba(74, 222, 128, ${0.3 + glowStrength * 0.7})`;
              ctx.shadowBlur = 12 * glowStrength; 
              ctx.shadowColor = `rgba(74, 222, 128, 0.8)`;
           }
        } else {
           ctx.shadowBlur = 0;
           ctx.shadowColor = 'transparent';
        }
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        let nodeRadius = (pn.glow > 0.08) ? (pn.isError ? 3.5 : 2.2) : 1.8; 
        ctx.arc(pn.x, pn.y, nodeRadius * pn.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; 
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; radius = width > 1024 ? 400 : 280; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[1] print:hidden opacity-90" />;
};

// --- FONDO DASHBOARD: RUIDO VISUAL (NOISE TEXTURE) PREMIUM ---
const NoiseBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[1] print:hidden opacity-[0.03]" style={{ mixBlendMode: 'overlay' }}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
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

  // Diccionario con traducciones actualizadas
  const t = {
    es: { dashboard: "Dashboard", panelPrin: "Panel Principal", panelDesc: "Resumen del rendimiento global de tus cuentas.", saludG: "Salud Promedio", totAud: "Total Cuentas", fugasDet: "Fugas Críticas", oporMej: "Oportunidades", ultAud: "Últimas Auditorías", actRec: "Actividad Reciente", verTodas: "Ver todas →", generada: "Se auditó la cuenta", hace: "Hace", afectaA: "Afecta principalmente a", buscarGlobal: "Buscar cuenta por nombre...", nueva: "Auditor IA", clientes: "Panel de Clientes", reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración General", facturacion: "Ver Facturación", salir: "Cerrar Sesión", placeholderNombre: "Nombre del Cliente o Cuenta", btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF", score: "Score", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes", login: "Iniciar sesión", tabDiag: "Diagnóstico IA", tabCheck: "Plan de Acción", tabAvanzado: "Análisis Avanzado", autoApply: "Corregir Ahora", msgAutoApply: "Disponible próximamente", pacingTit: "Pacing de Presupuesto", pacingDesc: "Ritmo de gasto proyectado", matrizTit: "Campaign Matrix", matrizDesc: "Distribución del gasto vs rendimiento", escalar: "ESTRELLAS (Escalar)", apagar: "BASURA (Apagar)", observar: "DUDOSOS (Observar)", potenciales: "POTENCIALES (Testear)", abrirAud: "Ver reporte", thCliente: "Cliente / Cuenta", thFecha: "Fecha", thEstado: "Estado", thAccion: "Acción", cuentaSinNombre: "Cuenta sin nombre", ingresos: "Ingresa los datos", buzonSug: "Buzón de sugerencias", facturacionTitulo: "Facturación y Planes", facturacionDesc: "Administrá tu suscripción", planActual: "Plan Actual", activa: "Activa", gestionarStripe: "Gestionar en Stripe", pronto: "Pronto", ayudanos: "Ayudanos a mejorar", bug: "¿Encontraste un error?", escribiSug: "Escribí tu sugerencia aquí...", enviando: "Enviando...", enviarSug: "Enviar Sugerencia", persPdf: "Personalización de Marca Blanca", nomAgencia: "Nombre de Agencia", sitioWeb: "Sitio Web", logoPdf: "Logo PDF", subeLogo: "Subir", piePagina: "Pie de página legal", preferencias: "Preferencias Regionales", monedaDef: "Moneda Base", metricaDef: "Métrica Principal", guardando: "Guardando...", guardarAj: "Guardar Ajustes", puntajeBasado: "Puntaje de salud en base al rendimiento y estructura general.", ingresaDatos: "Completá los datos de la campaña a auditar.", presupuestoObj: "Presupuesto Mensual", placeholderPres: "Ej: 1000", gastoAct: "Gasto actual", placeholderGasto: "Ej: 450", conversiones: "Conversiones", cparoas: "CPA / ROAS Actual", tipoCamp: "Campaign Type", contexto: "Contexto y Notas", placeholderConv: "Ej: 120", placeholderContexto: "Añadí contexto extra para la IA.", monitoreo: "Monitoreo", tenes: "Tenés", registradas: "cuentas registradas.", todos: "Todos", criticos: "Críticos", atencion: "Atención", optimos: "Óptimos", thTendencia: "Tendencia", volver: "Volver atrás", detalleCliente: "Detalle del Cliente" },
    en: { dashboard: "Dashboard", panelPrin: "Main Dashboard", panelDesc: "Global overview of your accounts performance.", saludG: "Avg Health Score", totAud: "Total Accounts", fugasDet: "Critical Leaks", oporMej: "Opportunities", ultAud: "Recent Audits", actRec: "Recent Activity", verTodas: "View all →", generada: "Audit generated for", hace: "Ago", afectaA: "Mainly affecting", buscarGlobal: "Search account by name...", nueva: "AI Auditor", clientes: "Client Dashboard", reportes: "Reports", feedback: "Feedback", configuracion: "General Settings", facturacion: "Billing", salir: "Sign Out", placeholderNombre: "Client or Account Name", btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF", score: "Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths", login: "Log In", tabDiag: "AI Diagnosis", tabCheck: "Action Plan", tabAvanzado: "Advanced Analysis", autoApply: "Auto-Apply", msgAutoApply: "Coming soon", pacingTit: "Budget Pacing", pacingDesc: "Projected spend rhythm", matrizTit: "Campaign Matrix", matrizDesc: "Spend distribution vs performance", escalar: "STARS (Scale)", apagar: "TRASH (Pause)", observar: "DOUBTFUL (Observe)", potenciales: "POTENCIALES (Test)", abrirAud: "View report", thCliente: "Client / Account", thFecha: "Date", thEstado: "Status", thAccion: "Action", cuentaSinNombre: "Unnamed Account", ingresos: "Enter details", buzonSug: "Suggestion Box", facturacionTitulo: "Billing and Plans", facturacionDesc: "Manage your subscription", planActual: "Current Plan", activa: "Active", gestionarStripe: "Manage on Stripe", pronto: "Soon", ayudanos: "Help us improve", bug: "Found a bug?", escribiSug: "Write your suggestion here...", enviando: "Sending...", enviarSug: "Send Suggestion", persPdf: "White Label Customization", nomAgencia: "Agency Name", sitioWeb: "Website", logoPdf: "PDF Logo", subeLogo: "Upload", piePagina: "Legal Footer", preferencias: "Regional Preferences", monedaDef: "Base Currency", metricaDef: "Main Metric", guardando: "Saving...", guardarAj: "Save Settings", puntajeBasado: "Health score based on overall performance and structure.", ingresaDatos: "Fill in the details for the campaign audit.", presupuestoObj: "Monthly Budget", placeholderPres: "E.g. 1000", gastoAct: "Current Spend", placeholderGasto: "E.g. 450", conversiones: "Conversions", cparoas: "Current CPA / ROAS", tipoCamp: "Campaign Type", contexto: "Context & Notes", placeholderConv: "E.g. 120", placeholderContexto: "Add extra context for the AI.", monitoreo: "Monitoring", tenes: "You have", registradas: "accounts registered.", todos: "All", criticos: "Critical", atencion: "Warning", optimos: "Optimal", thTendencia: "Trend", volver: "Go Back", detalleCliente: "Client Details" }
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
    if (!window.confirm("¿Seguro que querés eliminar esta auditoría? Esta acción no se puede deshacer.")) return;
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

      let pacingStatus = "optimo", pacingColor = "text-[#99CDD8]", pacingBg = "bg-[#99CDD8]", pacingMsg = idioma === 'es' ? `🟢 Pacing Perfecto: Proyecta gastar $${projectedSpend}` : `🟢 Perfect Pacing: Projected spend $${projectedSpend}`;

      if (spendPercentage > 110) { pacingStatus = "overspend"; pacingColor = "text-[#E66767]"; pacingBg = "bg-[#E66767]"; pacingMsg = idioma === 'es' ? `🔴 Peligro Overspend: Proyecta gastar $${projectedSpend} (${spendPercentage}%)` : `🔴 Overspend Warning: Projected spend $${projectedSpend} (${spendPercentage}%)`; } 
      else if (spendPercentage < 90) { pacingStatus = "underspend"; pacingColor = "text-[#EAB308]"; pacingBg = "bg-[#EAB308]"; pacingMsg = idioma === 'es' ? `🟡 Peligro Underspend: Proyecta gastar solo $${projectedSpend}` : `🟡 Underspend Warning: Projected spend only $${projectedSpend}`; }

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

  const getDashboardStatus = (score: number) => {
    if (score < 50) return { 
      label: "Crítico", color: "text-[#E66767]", bgTints: "bg-[#E66767]/10", 
      border: "border-[#E66767]/20", borderLeft: "border-l-[#E66767]", icon: AlertTriangle, 
      msg: "Atención urgente requerida" 
    };
    if (score < 80) return { 
      label: "Atención", color: "text-[#EAB308]", bgTints: "bg-[#EAB308]/10", 
      border: "border-[#EAB308]/20", borderLeft: "border-l-[#EAB308]", icon: Zap, 
      msg: "Métricas bajo observación" 
    };
    return { 
      label: "Óptimo", color: "text-[#99CDD8]", bgTints: "bg-[#99CDD8]/10", 
      border: "border-[#99CDD8]/20", borderLeft: "border-l-[#99CDD8]", icon: CheckCircle2, 
      msg: "Cuentas estables y sanas" 
    };
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
  const avgStatus = getDashboardStatus(promedioScore);
  
  let totalFugas = 0; let totalOportunidades = 0;
  let totalCriticas = 0; let totalOptimas = 0;
  
  const cuentasRojas: {nombre: string, cant: number, reporte: any}[] = []; 
  const cuentasAmarillas: {nombre: string, cant: number, reporte: any}[] = [];

  historial.forEach(h => {
      const nombre = h.nombre_cuenta || t[idioma].cuentaSinNombre;
      if (h.score < 50) totalCriticas++;
      if (h.score >= 80) totalOptimas++;

      if (h.reporte_json?.hallazgos?.graves_rojo) { 
        const cantRojas = h.reporte_json.hallazgos.graves_rojo.length; 
        if (cantRojas > 0) { totalFugas += cantRojas; cuentasRojas.push({ nombre, cant: cantRojas, reporte: h.reporte_json }); } 
      }
      if (h.reporte_json?.hallazgos?.debiles_amarillo) { 
        const cantAma = h.reporte_json.hallazgos.debiles_amarillo.length; 
        if (cantAma > 0) { totalOportunidades += cantAma; cuentasAmarillas.push({ nombre, cant: cantAma, reporte: h.reporte_json }); } 
      }
  });

  cuentasRojas.sort((a,b) => b.cant - a.cant); cuentasAmarillas.sort((a,b) => b.cant - a.cant);
  const ultimaAuditoria = historial.length > 0 ? historial[0] : null;
  const fugasIndividuales = ultimaAuditoria?.reporte_json?.hallazgos?.graves_rojo?.length || 0;

  if (status === "loading") return (
    <div className="h-screen w-full flex justify-center items-center bg-[#FDE8D3]">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#262B27] text-4xl shadow-lg bg-[#F3C3B2] animate-pulse">M</div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700;900&display=swap');
        
        /* Tema de la Landing Page (Solo activo cuando no hay sesión) */
        ${!session ? `
          body { font-family: 'Inter', sans-serif; background-color: #FDE8D3 !important; color: #262B27; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .translate-z-[-60px] { transform: translateZ(-60px); }
          .translate-z-[0px] { transform: translateZ(0px); }
          .translate-z-[40px] { transform: translateZ(40px); }
          .translate-z-[50px] { transform: translateZ(50px); }
          .translate-z-[60px] { transform: translateZ(60px); }
          .translate-z-[80px] { transform: translateZ(80px); }
          .rotate-x-[15deg] { transform: rotateX(15deg) rotateY(-25deg); }
          .hover\\:rotate-x-[-5deg]:hover { transform: rotateX(-5deg) rotateY(5deg); }
        ` : `
          /* Tema Dashboard SaaS: Limpio, oscuro verdoso, sin fondos animados */
          body { font-family: 'Inter', sans-serif; background-color: #131714 !important; color: #E8EBE4; }
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; height: auto !important; }
            @page { margin: 15mm; }
            .print-container { height: auto !important; overflow: visible !important; position: static !important; }
          }
        `}

        @keyframes fadeInCustom { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-custom { animation: fadeInCustom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Custom Scrollbar for Dashboard */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2C352E; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #8A968C; }
      `}} />

      <div className={`flex h-screen w-full font-sans overflow-hidden print-container relative ${!session ? "bg-[#FDE8D3] selection:bg-[#F3C3B2] selection:text-[#262B27] text-[#262B27]" : "bg-[#131714] selection:bg-[#F3C3B2] selection:text-[#131714] text-[#E8EBE4]"}`}>
        
        {/* FONDO LANDING: Esfera de alambre */}
        {!session && <AuditWireframeBackground />}

        {/* FONDO DASHBOARD: Ruido visual premium (Solo logueados) */}
        {session && <NoiseBackground />}

        {/* ========================================================================= */}
        {/* VISTA: LANDING PAGE (USUARIOS NO LOGUEADOS - TEMA CLARO Y PASTEL)         */ }
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

            <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-28 overflow-hidden z-10 px-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[75vh]">
              <FadeInOnScroll>
                <div className="flex flex-col items-start text-left lg:pr-10">
                  <div className="border border-[#CFD6C4]/80 bg-[#CFD6C4]/30 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 flex items-center gap-3 text-[#262B27]">
                     <span className="w-2 h-2 rounded-full bg-[#F3C3B2] animate-pulse"></span>
                     Auditorías con IA
                  </div>
                  <h1 className="text-[3rem] md:text-6xl lg:text-[4.5rem] font-serif text-[#262B27] font-black leading-[1.05] mb-6 tracking-tight">
  Auditorías <span className="italic text-[#C05621]">automáticas</span> para escalar tus campañas de Google Ads.
</h1>
                  <p className="text-[#657166] text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
                    Conectá tu cuenta de Google Ads y dejá que nuestra IA audite tus campañas, traduzca las métricas y genere reportes marca blanca en segundos.
                  </p>
                  <button onClick={() => signIn("google", { prompt: "select_account" })} className="bg-[#262B27] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(38,43,39,0.4)] flex items-center justify-center gap-2 w-full sm:w-auto">
                    Comenzar prueba gratis <ArrowRight size={20} />
                  </button>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8 text-[13px] text-[#657166] font-semibold w-full">
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Sin tarjeta de crédito</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Conexión segura de solo lectura</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#99CDD8]" strokeWidth={3} /> Cancelá cuando quieras</span>
                  </div>
                </div>
              </FadeInOnScroll>

              <FadeInOnScroll delay={200}>
                <div className="relative w-full h-[500px] lg:h-[650px] flex justify-center items-center mt-10 lg:mt-0 perspective-1000">
                   <div className="relative w-full max-w-md lg:max-w-lg transform-style-3d transition-transform duration-[1000ms] hover:rotate-x-[-5deg] rotate-x-[15deg]">
                     
                      {/* CARD: GASTO DIARIO */}
                      <div className="absolute top-[-60px] left-[-80px] w-72 bg-white/60 backdrop-blur-md border border-[#CFD6C4]/60 shadow-[0_20px_40px_rgba(207,214,196,0.3)] rounded-2xl p-7 translate-z-[-60px]">
                         <p className="text-[10px] font-bold text-[#657166] uppercase tracking-widest mb-4">Gasto Diario</p>
                         <div className="flex items-end gap-2 h-24 opacity-80">
                           {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                              <div key={i} className="flex-1 bg-[#99CDD8]/40 rounded-t-sm" style={{height: `${h}%`}}></div>
                           ))}
                         </div>
                      </div>

                      {/* CARD: RESUMEN IA NUEVA */}
                      <div className="absolute top-[30px] left-[-110px] z-30 bg-white/95 backdrop-blur-xl border border-[#CFD6C4]/80 shadow-[0_15px_30px_rgba(38,43,39,0.1)] rounded-2xl p-5 translate-z-[50px] w-56 hidden md:block">
                          <p className="text-[10px] font-bold text-[#657166] uppercase tracking-widest mb-3">Resumen de IA</p>
                          <div className="space-y-2">
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#262B27]">Fugas críticas:</span> <span className="text-xs font-black text-[#E66767]">3</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#262B27]">Oportunidades:</span> <span className="text-xs font-black text-[#EAB308]">5</span></div>
                              <div className="border-t border-[#CFD6C4]/50 pt-2 mt-2 flex justify-between items-center"><span className="text-xs font-bold text-[#262B27]">Ahorro est.:</span> <span className="text-sm font-black text-[#99CDD8]">$850/m</span></div>
                          </div>
                      </div>

                      {/* CARD PRINCIPAL */}
                      <div className="relative z-10 w-full bg-white/95 backdrop-blur-2xl border border-[#CFD6C4]/80 shadow-[0_30px_60px_rgba(38,43,39,0.15)] rounded-[2rem] p-8 translate-z-[0px]">
                         <div className="flex justify-between items-center mb-6 border-b border-[#CFD6C4]/50 pb-4">
                            <p className="font-bold text-[#262B27] flex items-center gap-2 text-lg"><LayoutGrid size={20}/> Rendimiento</p>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#DAEBE3]/50 text-[#262B27] px-3 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#DAEBE3] border border-[#262B27]/20 animate-pulse"></span> Search
                            </span>
                         </div>
                         <div className="flex justify-center items-center flex-col py-2 mb-6">
                            <p className="text-xs font-bold text-[#657166] uppercase tracking-widest mb-3">Score de Salud</p>
                            <div className="w-32 h-32 rounded-full flex items-center justify-center border-[8px] border-[#FDE8D3] text-5xl font-black text-[#262B27] shadow-inner bg-[#DAEBE3]">
                              84
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#FDE8D3]/50 p-5 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#657166] uppercase tracking-wider mb-1">Gasto Total</p>
                               <p className="text-3xl font-black text-[#262B27]">$8.2k</p>
                            </div>
                            <div className="bg-[#FDE8D3]/50 p-5 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#657166] uppercase tracking-wider mb-1">Conversiones</p>
                               <p className="text-3xl font-black text-[#262B27]">142</p>
                            </div>
                         </div>
                      </div>

                      {/* CARD: FUGA CRITICA (Agrandada y con borde rojo) */}
                      <div className="absolute bottom-[-50px] right-[-60px] z-20 w-80 bg-white/95 backdrop-blur-xl border border-[#E66767]/40 shadow-[0_20px_40px_rgba(230,103,103,0.15)] rounded-2xl p-6 translate-z-[80px]">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#E66767]/10 flex items-center justify-center flex-shrink-0 border border-[#E66767]/30">
                               <AlertTriangle size={24} className="text-[#E66767]" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-[#E66767] leading-tight mb-1">Fuga Crítica Detectada</p>
                               <p className="text-xs text-[#657166] font-medium">Keywords irrelevantes</p>
                               <span className="inline-block mt-3 text-sm font-black text-white bg-[#E66767] px-3 py-1.5 rounded-md shadow-sm">-$620 / mes</span>
                            </div>
                         </div>
                      </div>

                      {/* CARD: SINCRONIZADO */}
                      <div className="absolute top-[-25px] right-[20px] z-30 bg-[#DAEBE3] text-[#262B27] px-4 py-2 rounded-full font-bold text-[10px] uppercase shadow-lg border border-[#CFD6C4] translate-z-[40px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#262B27] rounded-full animate-pulse"></span> Sincronizado
                      </div>

                      {/* CARD: ROAS */}
                      <div className="absolute bottom-[80px] left-[-50px] z-30 bg-[#99CDD8] text-[#262B27] p-5 rounded-2xl shadow-[0_15px_30px_rgba(153,205,216,0.6)] translate-z-[60px] flex flex-col border border-[#CFD6C4]">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">ROAS Proyectado</p>
                        <p className="text-3xl font-black flex items-center gap-1"><TrendingUp size={20} strokeWidth={4}/> +12.4%</p>
                      </div>

                   </div>
                </div>
              </FadeInOnScroll>
            </section>

            <FadeInOnScroll delay={100}>
              <section className="max-w-[1400px] mx-auto px-6 py-20 border-t border-[#CFD6C4]/40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12 items-end">
                   <div className="lg:col-span-1">
                     <p className="inline-block px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase text-[#262B27] bg-[#99CDD8]/40 mb-4">Cómo funciona</p>
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

            <FadeInOnScroll>
              <section className="max-w-[1400px] mx-auto px-6 py-20 border-t border-[#CFD6C4]/40">
                <div className="text-center mb-16">
                  <p className="inline-block px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase text-[#262B27] bg-[#DAEBE3] mb-4">Precios Simples</p>
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
          /* VISTA: DASHBOARD LOGUEADO (NUEVO TEMA SAAS EMPRESARIAL)                   */
          /* ========================================================================= */
          <>
            <aside className="w-64 bg-[#1A1F1B] border-r border-[#2C352E] flex flex-col justify-between print:hidden z-20 relative shadow-2xl">
              <div>
                <div className="h-20 flex items-center px-6 border-b border-[#2C352E] gap-3">
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[#262B27] text-xl shadow-sm bg-[#F3C3B2]">M</div>
                   <span className="text-xl font-bold text-[#E8EBE4] tracking-wide">Mora</span>
                </div>

                <div className="px-4 mt-6 mb-4">
                  <button onClick={() => { setVista("nueva"); setReporte(null); setMostrarPagos(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[#262B27] bg-[#F3C3B2] hover:bg-[#eab3a1] transition-colors">
                    <Plus size={18} strokeWidth={3} /> {t[idioma].nueva}
                  </button>
                </div>

                <div className="px-4 mb-2 mt-6">
                  <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest px-2 mb-2">Principal</p>
                  {[ 
                    { icon: LayoutGrid, text: t[idioma].dashboard, view: 'dashboard' }, 
                    { icon: Users, text: t[idioma].clientes, view: 'historial' }
                  ].map((link, idx) => (
                    <button key={idx} onClick={() => { setVista(link.view as any); setReporte(null); setMostrarPagos(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${ (vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "bg-[#2C352E] text-[#E8EBE4]" : "text-[#8A968C] hover:bg-[#2C352E]/50 hover:text-[#E8EBE4]" }`}>
                      <link.icon size={18} strokeWidth={2} className={(vista === link.view || (vista === 'reporte_lectura' && link.view === 'historial')) ? "text-[#99CDD8]" : ""} /> 
                      {link.text}
                      {link.view === 'historial' && totalAuditorias > 0 && (
                        <span className="ml-auto bg-[#E66767] text-[#131714] text-[10px] font-bold px-2 py-0.5 rounded-full">{totalAuditorias}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mx-4 mb-6 p-4 rounded-xl bg-[#131714] border border-[#2C352E]">
                 <div className="flex items-center gap-3 mb-3">
                   <div>
                     <p className={`text-xs font-bold text-[#E8EBE4]`}>Soporte VIP</p>
                     <p className="text-[10px] text-[#8A968C] mt-0.5">Línea directa · 1h respuesta</p>
                   </div>
                 </div>
                 <button onClick={() => window.location.href = "mailto:soporte@tuagencia.com"} className="w-full py-2 text-xs font-bold text-[#F3C3B2] border border-[#F3C3B2]/30 bg-[#F3C3B2]/5 hover:bg-[#F3C3B2]/10 rounded-lg transition-colors">
                   Contactar Soporte
                 </button>
              </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-y-auto z-10 print:overflow-visible print:h-auto print:static bg-transparent">
              
              <header className="h-20 flex justify-between items-center px-8 print:hidden border-b border-[#2C352E] bg-[#131714]/80 backdrop-blur-md sticky top-0 z-30">
                <h2 className="text-xl font-bold text-[#E8EBE4] tracking-tight min-w-[200px]">
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
                      <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8A968C] group-focus-within:text-[#E8EBE4] transition-colors" />
                      <input type="text" placeholder={t[idioma].buscarGlobal} value={busqueda} onChange={(e) => {setBusqueda(e.target.value); if (vista !== "historial" && e.target.value !== "") setVista("historial"); }} className="w-full bg-[#1A1F1B] border border-[#2C352E] rounded-full pl-10 pr-4 py-2 text-sm text-[#E8EBE4] focus:outline-none focus:border-[#8A968C] transition-all placeholder:text-[#8A968C]" />
                   </div>
                </div>
                
                <div className="relative min-w-[200px] flex justify-end items-center gap-4">
                   
                   <div className="hidden lg:flex items-center bg-[#1A1F1B] border border-[#2C352E] rounded-full p-1 mr-2">
                     <button onClick={() => setModoPlan('individual')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${modoPlan === 'individual' ? 'bg-[#2C352E] text-[#E8EBE4]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}>Individual</button>
                     <button onClick={() => setModoPlan('agencia')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${modoPlan === 'agencia' ? 'bg-[#2C352E] text-[#E8EBE4]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}>Agencia</button>
                   </div>

                   <div className="relative">
                     <button onClick={() => {setMenuNotificaciones(!menuNotificaciones); setMenuPerfil(false)}} className="p-2 hover:bg-[#1A1F1B] border border-transparent hover:border-[#2C352E] rounded-full transition-colors relative">
                       <Bell size={18} className="text-[#8A968C] hover:text-[#E8EBE4]" />
                       {totalCriticas > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E66767] rounded-full border border-[#131714]"></span>}
                     </button>
                   </div>

                   <button onClick={() => {setMenuPerfil(!menuPerfil); setMenuNotificaciones(false)}} className="flex items-center gap-3 hover:bg-[#1A1F1B] p-1.5 rounded-full transition-colors border border-transparent hover:border-[#2C352E] pr-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#99CDD8] flex items-center justify-center text-[#131714] font-bold text-xs">
                          {session.user?.name?.charAt(0) || 'U'}
                        </div>
                        {/* Puntito verde de estado Online/Plan Activo */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#131714] rounded-full"></span>
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-bold text-[#E8EBE4] leading-tight">{session.user?.name?.split(' ')[0] || "User"}</p>
                        <p className="text-[10px] text-[#8A968C] font-medium mt-0.5">{modoPlan === 'agencia' ? 'Agency' : 'Individual'} <ChevronDown size={10} className="inline ml-1"/></p>
                      </div>
                   </button>

                   {menuPerfil && (
                     <>
                       <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuPerfil(false)}></div>
                       <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1F1B] border border-[#2C352E] rounded-xl shadow-2xl py-2 z-50 animate-fade-custom">
                          <div className="py-1">
                            <button onClick={() => { setVista("perfil"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#8A968C] hover:bg-[#2C352E]/50 hover:text-[#E8EBE4] transition-colors"><Settings size={16} /> {t[idioma].configuracion}</button>
                            <button onClick={() => { setVista("facturacion"); setMenuPerfil(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#8A968C] hover:bg-[#2C352E]/50 hover:text-[#E8EBE4] transition-colors"><CreditCard size={16} /> {t[idioma].facturacion}</button>
                          </div>
                          <div className="border-t border-[#2C352E] mt-1 pt-2">
                            <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#E66767] hover:bg-[#E66767]/10 transition-colors font-medium"><LogOut size={16} /> {t[idioma].salir}</button>
                          </div>
                       </div>
                     </>
                   )}
                </div>
              </header>

              <div className="p-8 pb-32 max-w-[1400px] mx-auto w-full print:p-0 print:pb-0" key={vista}>
                
                {vista === "dashboard" && modoPlan === "agencia" && (
                  <div className="animate-fade-custom print:hidden flex flex-col gap-8">
                    <div>
                      <h2 className="text-2xl font-bold text-[#E8EBE4]">{t[idioma].panelPrin}</h2>
                      <p className="text-[#8A968C] text-sm mt-1">{t[idioma].panelDesc}</p>
                    </div>
                    
                    {/* METRIC CARDS SUPERIORES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       
                       {/* 1. Salud Promedio */}
                       <div className={`bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col min-h-[180px] border-l-4 ${avgStatus.borderLeft} ${avgStatus.bgTints}`}>
                          <p className={`text-[10px] font-bold ${avgStatus.color} uppercase tracking-widest mb-4 flex items-center gap-2`}><Activity size={14}/> {t[idioma].saludG}</p>
                          <div className="flex items-baseline gap-1 mt-auto">
                            {/* SCORE MASIVO */}
                            <span className={`text-[5.5rem] font-black ${avgStatus.color} leading-[0.8] tracking-tighter`}>{promedioScore}</span>
                            <span className="text-[#8A968C] font-bold text-xl mb-1">/100</span>
                          </div>
                          <div className="mt-5">
                             {/* ALERTA DE PESO (Badge) */}
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${avgStatus.bgTints} ${avgStatus.color} border ${avgStatus.border}`}>
                               <avgStatus.icon size={14}/> {avgStatus.msg}
                             </span>
                          </div>
                       </div>

                       {/* 2. Total Cuentas */}
                       <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col justify-between min-h-[180px] border-l-4 border-l-[#99CDD8]">
                          <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> {t[idioma].totAud}</p>
                          <div className="mt-auto">
                            <span className="text-[4rem] font-black text-[#E8EBE4] tracking-tighter leading-none">{totalAuditorias}</span>
                            <p className="text-xs text-[#8A968C] mt-3 font-medium">Cuentas auditadas</p>
                          </div>
                          {totalAuditorias > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#2C352E] grid grid-cols-2 gap-2 text-center">
                               <div className="bg-[#E66767]/10 rounded py-1 border border-[#E66767]/20"><p className="text-[10px] font-bold text-[#E66767] uppercase">{totalCriticas} Críticas</p></div>
                               <div className="bg-[#99CDD8]/10 rounded py-1 border border-[#99CDD8]/20"><p className="text-[10px] font-bold text-[#99CDD8] uppercase">{totalOptimas} Óptimas</p></div>
                            </div>
                          )}
                       </div>

                       {/* 3. Fugas Críticas */}
                       <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col justify-between min-h-[180px] border-l-4 border-l-[#E66767]">
                          <p className="text-[10px] font-bold text-[#E66767] uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={14}/> {t[idioma].fugasDet}</p>
                          <div className="mt-auto">
                            <span className="text-[4rem] font-black text-[#E8EBE4] tracking-tighter leading-none">{totalFugas}</span>
                            <p className="text-xs text-[#8A968C] mt-3 font-medium">Problemas activos</p>
                          </div>
                          {cuentasRojas.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#2C352E]">
                              <p className="text-[9px] text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].afectaA}</p>
                              <div className="space-y-1.5">
                                {cuentasRojas.slice(0, 2).map((c,i) => (
                                  <div key={i} className="flex justify-between items-center text-xs">
                                     <span className="text-[#E8EBE4] truncate pr-2">{c.nombre}</span>
                                     <span className="text-[#E66767] font-bold bg-[#E66767]/10 px-1.5 rounded">{c.cant}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                       </div>

                       {/* 4. Oportunidades */}
                       <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col justify-between min-h-[180px] border-l-4 border-l-[#EAB308]">
                          <p className="text-[10px] font-bold text-[#EAB308] uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={14}/> {t[idioma].oporMej}</p>
                          <div className="mt-auto">
                            <span className="text-[4rem] font-black text-[#E8EBE4] tracking-tighter leading-none">{totalOportunidades}</span>
                            <p className="text-xs text-[#8A968C] mt-3 font-medium">Áreas de mejora</p>
                          </div>
                          {cuentasAmarillas.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#2C352E]">
                              <p className="text-[9px] text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].afectaA}</p>
                              <div className="space-y-1.5">
                                {cuentasAmarillas.slice(0, 2).map((c,i) => (
                                  <div key={i} className="flex justify-between items-center text-xs">
                                     <span className="text-[#E8EBE4] truncate pr-2">{c.nombre}</span>
                                     <span className="text-[#EAB308] font-bold bg-[#EAB308]/10 px-1.5 rounded">{c.cant}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* TABLA DE AUDITORÍAS DENSA */}
                        <div className="lg:col-span-2 bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col">
                           <div className="flex justify-between items-center mb-6">
                             <h3 className="text-lg font-bold text-[#E8EBE4]">{t[idioma].ultAud}</h3>
                             <button onClick={() => setVista("historial")} className="text-xs font-bold text-[#8A968C] hover:text-[#E8EBE4] transition-colors">{t[idioma].verTodas}</button>
                           </div>
                           
                           {historial.length === 0 ? (
                             <div className="flex-1 flex items-center justify-center text-[#8A968C] text-sm font-medium py-10 border border-dashed border-[#2C352E] rounded-xl">No hay auditorías recientes.</div>
                           ) : (
                             <div className="flex-1 border-t border-[#2C352E]">
                               <div className="grid grid-cols-12 gap-4 py-3 border-b border-[#2C352E] text-[9px] font-bold text-[#8A968C] uppercase tracking-widest">
                                 <div className="col-span-5">{t[idioma].thCliente}</div>
                                 <div className="col-span-3 text-center">{t[idioma].score}</div>
                                 <div className="col-span-2 text-center">{t[idioma].thEstado}</div>
                                 <div className="col-span-2 text-right">{t[idioma].thAccion}</div>
                               </div>
                               <div className="divide-y divide-[#2C352E]">
                                 {historial.slice(0, 5).map((item, index) => {
                                   const st = getDashboardStatus(item.score);
                                   return (
                                     <div key={index} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-[#2C352E]/30 transition-colors -mx-4 px-4 rounded-lg">
                                       
                                       <div className="col-span-5 flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${st.bgTints} ${st.color} border border-transparent`}>{item.score}</div>
                                         <div>
                                           <p className="font-bold text-[#E8EBE4] text-sm truncate">{item.nombre_cuenta || "Sin nombre"}</p>
                                           <p className="text-[10px] text-[#8A968C] mt-0.5">{parseDate(item.created_at)}</p>
                                         </div>
                                       </div>
                                       
                                       <div className="col-span-3 flex flex-col justify-center px-4">
                                          <div className="flex justify-between items-end mb-1">
                                            <span className={`text-sm font-bold ${st.color}`}>{item.score}</span>
                                            <span className="text-[9px] text-[#8A968C]">/100</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-[#131714] rounded-full overflow-hidden border border-[#2C352E]/50">
                                            <div className={`h-full rounded-full transition-all`} style={{width: `${item.score}%`, backgroundColor: st.color.replace('text-[', '').replace(']', '')}}></div>
                                          </div>
                                       </div>

                                       <div className="col-span-2 flex justify-center">
                                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold ${st.bgTints} ${st.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full bg-current`}></span> {st.label}
                                          </span>
                                       </div>

                                       <div className="col-span-2 flex justify-end items-center gap-2">
                                         {/* BOTÓN "VER REPORTE" EN VEZ DE PDF */}
                                         <button onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta || "Sin nombre"); setSubVistaReporte("diagnostico"); setVista("reporte_lectura"); }} className="text-[10px] uppercase tracking-widest font-bold border border-[#2C352E] hover:bg-[#2C352E] text-[#E8EBE4] px-3 py-1.5 rounded transition-colors">
                                           {t[idioma].abrirAud}
                                         </button>
                                         <button onClick={() => borrarAuditoria(item.id)} className="text-[#8A968C] hover:text-[#E66767] p-1.5 transition-colors"><Trash2 size={14} /></button>
                                       </div>

                                     </div>
                                   )
                                 })}
                               </div>
                             </div>
                           )}
                        </div>

                        {/* ACTIVIDAD RECIENTE */}
                        <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6">
                           <h3 className="text-sm font-bold text-[#E8EBE4] mb-6">{t[idioma].actRec}</h3>
                           {historial.length === 0 ? (
                             <div className="text-[#8A968C] text-sm font-medium text-center py-10">No hay actividad.</div>
                           ) : (
                             <ul className="space-y-6">
                                {historial.slice(0, 5).map((item, i) => {
                                   const st = getDashboardStatus(item.score);
                                   return (
                                     <li key={i} className="flex gap-4 items-start relative">
                                        {i !== historial.slice(0,5).length - 1 && <div className="absolute left-[3px] top-4 bottom-[-24px] w-px bg-[#2C352E]"></div>}
                                        <div className={`w-2 h-2 mt-1.5 rounded-full z-10 flex-shrink-0`} style={{backgroundColor: st.color.replace('text-[', '').replace(']', '')}}></div>
                                        <div>
                                           <p className="text-xs text-[#8A968C] font-medium leading-tight">Se auditó la cuenta <span className="text-[#E8EBE4] font-bold">{item.nombre_cuenta || "Sin nombre"}</span></p>
                                           <div className="flex items-center gap-2 mt-1.5">
                                             <p className="text-[10px] text-[#8A968C]">{parseDate(item.created_at)}</p>
                                             <span className={`text-[9px] font-bold px-1.5 rounded ${st.color} ${st.bgTints}`}>Score {item.score}</span>
                                           </div>
                                        </div>
                                     </li>
                                   )
                                })}
                             </ul>
                           )}
                        </div>
                    </div>
                  </div>
                )}

                {/* DASHBOARD INDIVIDUAL (Diseño Separado) */}
                {vista === "dashboard" && modoPlan === "individual" && (
                  <div className="animate-fade-custom print:hidden flex flex-col gap-8 relative z-10">
                    <div>
                      <h2 className="text-2xl font-bold text-[#E8EBE4]">Resumen de Negocio</h2>
                      <p className="text-[#8A968C] text-sm mt-1">El estado de tu cuenta de Google Ads y herramientas para crecer.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       
                       {/* SALUD DE LA CUENTA INDIVIDUAL */}
                       <div className={`bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col min-h-[180px] border-l-4 ${ultimaAuditoria ? getDashboardStatus(ultimaAuditoria.score).borderLeft : 'border-[#2C352E]'}`}>
                          <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> Salud de la Cuenta</p>
                          {ultimaAuditoria ? (
                            <div className="flex flex-col h-full">
                               <div className="flex items-baseline gap-1 mt-auto mb-4">
                                 <span className={`text-[5rem] font-black leading-[0.8] tracking-tighter ${getDashboardStatus(ultimaAuditoria.score).color}`}>
                                   {ultimaAuditoria.score}
                                 </span>
                                 <span className="text-[#8A968C] font-bold text-xl mb-1">/100</span>
                               </div>
                               <button onClick={() => { setReporte(ultimaAuditoria.reporte_json); setNombreCuenta(ultimaAuditoria.nombre_cuenta); setVista("reporte_lectura"); }} className="w-full text-[10px] uppercase tracking-widest font-bold border border-[#2C352E] bg-[#131714] hover:bg-[#2C352E] text-[#E8EBE4] px-4 py-2.5 rounded-lg transition-colors mt-auto text-center">
                                 {t[idioma].abrirAud}
                               </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-[#8A968C] text-sm font-medium">No hay datos.</div>
                          )}
                       </div>

                       {/* FUGAS CRÍTICAS */}
                       <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-2xl p-6 flex flex-col justify-between min-h-[180px] border-l-4 border-[#E66767]">
                          <p className="text-[10px] font-bold text-[#E66767] uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14}/> Fugas Críticas</p>
                          {ultimaAuditoria ? (
                            <div className="mt-auto">
                              <span className="text-[4rem] font-black text-[#E8EBE4] tracking-tighter leading-none">{fugasIndividuales}</span>
                              <p className="text-xs text-[#8A968C] mt-3 font-medium">Problemas consumiendo presupuesto ahora mismo.</p>
                            </div>
                          ) : (
                             <div className="flex-1 flex items-center justify-center text-[#8A968C] text-sm font-medium">No hay datos.</div>
                          )}
                       </div>

                       {/* EJECUTAR AUDITORÍA */}
                       <div className="bg-[#1A1F1B] border border-dashed border-[#8A968C]/50 hover:border-[#F3C3B2] rounded-2xl p-6 flex flex-col justify-center items-center text-center min-h-[180px] transition-colors cursor-pointer group" onClick={() => setVista("nueva")}>
                          <div className="w-12 h-12 rounded-full bg-[#131714] border border-[#2C352E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <Zap size={20} className="text-[#F3C3B2]" />
                          </div>
                          <h3 className="font-bold text-[#E8EBE4] text-sm">Ejecutar Nueva Auditoría</h3>
                          <p className="text-xs text-[#8A968C] mt-2 px-2">Actualizá los datos de tu cuenta para ver el score de hoy.</p>
                       </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-4 mt-6 px-2">Herramientas Exclusivas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-xl p-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed relative overflow-hidden group">
                            <div className="absolute top-4 right-4"><span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-[#131714] border border-[#2C352E] rounded text-[#8A968C] group-hover:text-[#F3C3B2] group-hover:border-[#F3C3B2]/50 transition-colors">Pronto</span></div>
                            <div className="w-8 h-8 rounded-lg bg-[#99CDD8]/10 flex items-center justify-center text-[#99CDD8] mb-4"><BookOpen size={16}/></div>
                            <h4 className="font-bold text-[#E8EBE4] text-sm mb-1">Traductor de Métricas IA</h4>
                            <p className="text-xs text-[#8A968C] leading-relaxed">Leé tu cuenta de Google Ads en lenguaje de negocios simple.</p>
                         </div>
                         <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-xl p-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed relative overflow-hidden group">
                            <div className="absolute top-4 right-4"><span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-[#131714] border border-[#2C352E] rounded text-[#8A968C] group-hover:text-[#F3C3B2] group-hover:border-[#F3C3B2]/50 transition-colors">Pronto</span></div>
                            <div className="w-8 h-8 rounded-lg bg-[#F3C3B2]/10 flex items-center justify-center text-[#F3C3B2] mb-4"><Type size={16}/></div>
                            <h4 className="font-bold text-[#E8EBE4] text-sm mb-1">Generador de Anuncios</h4>
                            <p className="text-xs text-[#8A968C] leading-relaxed">Títulos y descripciones redactados por IA listos para usar.</p>
                         </div>
                         <div className="bg-[#1A1F1B] border border-[#2C352E] rounded-xl p-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed relative overflow-hidden group">
                            <div className="absolute top-4 right-4"><span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-[#131714] border border-[#2C352E] rounded text-[#8A968C] group-hover:text-[#F3C3B2] group-hover:border-[#F3C3B2]/50 transition-colors">Pronto</span></div>
                            <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center text-[#4ADE80] mb-4"><Calculator size={16}/></div>
                            <h4 className="font-bold text-[#E8EBE4] text-sm mb-1">Simulador de Presupuesto</h4>
                            <p className="text-xs text-[#8A968C] leading-relaxed">Proyectá cuántas ventas tendrías si subís o bajás la inversión.</p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISTA: NUEVA AUDITORÍA */}
                {vista === "nueva" && (
                  <div className="animate-fade-custom print:hidden relative z-10">
                    <div className="bg-[#1A1F1B] border border-[#2C352E] p-8 md:p-12 rounded-[2rem] shadow-xl mb-8 max-w-4xl mx-auto">
                      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#2C352E]">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#262B27] shadow-sm bg-[#F3C3B2]"><Zap size={24} /></div>
                        <div><h1 className="text-2xl font-bold text-[#E8EBE4]">{t[idioma].nueva}</h1><p className="text-[#8A968C] text-sm mt-1">{t[idioma].ingresaDatos}</p></div>
                      </div>
                      
                      <div className="mb-6"><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].placeholderNombre}</label><input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all text-sm" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} /></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].presupuestoObj}</label><input type="number" placeholder={t[idioma].placeholderPres} className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all text-sm" value={presupuestoObjetivo} onChange={(e) => setPresupuestoObjetivo(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].gastoAct}</label><input type="number" placeholder={t[idioma].placeholderGasto} className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all text-sm" value={gastoActual} onChange={(e) => setGastoActual(e.target.value)} /></div>
                        
                        <div><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].conversiones}</label><input type="number" placeholder={t[idioma].placeholderConv} className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all text-sm" value={conversiones} onChange={(e) => setConversiones(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].cparoas}</label><input type="text" placeholder={`Ej: ${metrica} objetivo...`} className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all text-sm" value={cpaRoas} onChange={(e) => setCpaRoas(e.target.value)} /></div>
                      </div>

                      <div className="mb-6">
                          <label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].tipoCamp}</label>
                          <div className="relative"><select className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all appearance-none cursor-pointer text-sm" value={tipoCampana} onChange={(e) => setTipoCampana(e.target.value)}><option value="Búsqueda (Search)">Búsqueda (Search)</option><option value="Performance Max">Performance Max</option><option value="Display">Display</option><option value="Shopping">Shopping</option><option value="Video (YouTube)">Video (YouTube)</option><option value="Mix de Campañas">Mix de Campañas</option></select><ChevronDown size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8A968C] pointer-events-none" /></div>
                      </div>

                      <div className="mb-8"><label className="block text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].contexto}</label><textarea className="w-full h-24 p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none transition-all resize-none text-sm" placeholder={t[idioma].placeholderContexto} value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
                      
                      <button onClick={analizarCampaña} disabled={loading || !nombreCuenta || !presupuestoObjetivo || !gastoActual || !conversiones} className="w-full text-[#262B27] bg-[#F3C3B2] hover:bg-[#eab3a1] px-6 py-4 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-md flex justify-center items-center gap-2">
                        {loading ? <span className="animate-pulse">{t[idioma].btnAnalizando}</span> : <><Sparkles size={18}/> {t[idioma].btnAnalizar}</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* VISTA: LECTURA DE REPORTE */}
                {vista === "reporte_lectura" && reporte && (
                  <div className="animate-fade-custom print:bg-white print:m-0 print:p-0 relative z-10 max-w-5xl mx-auto">
                    
                    <div className="mb-6 flex justify-between items-center print:hidden">
                       <button onClick={() => setVista("dashboard")} className="flex items-center gap-2 text-[#8A968C] hover:text-[#E8EBE4] font-medium transition-colors text-sm"><ArrowLeft size={16} /> {t[idioma].volver}</button>
                       
                       <div className="flex bg-[#1A1F1B] border border-[#2C352E] rounded-lg p-1 gap-1">
                          <button onClick={() => setSubVistaReporte("diagnostico")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${subVistaReporte === 'diagnostico' ? 'bg-[#2C352E] text-[#E8EBE4]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}><FileText size={14}/> {t[idioma].tabDiag}</button>
                          <button onClick={() => setSubVistaReporte("checklist")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${subVistaReporte === 'checklist' ? 'bg-[#F3C3B2]/20 text-[#F3C3B2]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}><ListChecks size={14}/> {t[idioma].tabCheck}</button>
                          <button onClick={() => setSubVistaReporte("avanzado")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${subVistaReporte === 'avanzado' ? 'bg-[#2C352E] text-[#E8EBE4]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}><LayoutGrid size={14}/> {t[idioma].tabAvanzado}</button>
                       </div>
                    </div>

                    <div className="bg-[#1A1F1B] border border-[#2C352E] p-10 rounded-2xl shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                      
                      <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-slate-200 pb-6">
                        <div>{modoPlan === 'agencia' && perfil?.agencia_logo ? <img src={perfil.agencia_logo} alt="Logo Agencia" className="h-16 object-contain" /> : <div className="flex items-center gap-2"><span className="text-3xl">🐾</span><span className="text-3xl font-black text-slate-800">Mora</span></div>}</div>
                        <div className="text-right">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{modoPlan === 'agencia' && perfil?.agencia_nombre ? perfil.agencia_nombre : "Auditoría Estratégica"}</h2>
                          {modoPlan === 'agencia' && agenciaWeb && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{agenciaWeb}</p>}
                          <p className="text-sm font-medium text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-10 pb-10 border-b border-[#2C352E] print:border-slate-200 print:mb-12">
                        <div>
                          <h2 className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2 print:text-slate-500 print:text-xs">{nombreCuenta || t[idioma].cuentaSinNombre}</h2>
                          <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center border-2 border-[#2C352E] text-2xl font-black text-[#E8EBE4] print:border-slate-300 print:text-slate-800`}>{reporte.score_general}</div>
                            <div><h3 className="text-2xl font-bold text-[#E8EBE4] print:text-slate-900">{t[idioma].score}</h3><p className="text-[#8A968C] text-xs mt-1 print:text-slate-500">{t[idioma].puntajeBasado}</p></div>
                          </div>
                        </div>
                        {subVistaReporte === "diagnostico" && modoPlan === 'agencia' && <button onClick={descargarPDF} className="bg-[#2C352E] hover:bg-[#8A968C] text-[#E8EBE4] px-4 py-2 rounded-lg text-sm font-bold transition-all print:hidden shadow-sm">{t[idioma].exportar}</button>}
                      </div>
                      
                      {subVistaReporte === "diagnostico" && (
                        <div className="space-y-6 animate-fade-custom">
                          {reporte.hallazgos?.graves_rojo?.length > 0 && (
                            <div className="border-l-4 border-l-[#E66767] bg-[#E66767]/5 p-6 rounded-xl border border-[#2C352E] print:bg-red-50 print:border-red-100 print:shadow-sm">
                              <h3 className="text-sm font-bold text-[#E66767] uppercase tracking-widest mb-4 flex items-center gap-2 print:text-red-700"><AlertTriangle size={18}/> {t[idioma].problemas}</h3>
                              {reporte.hallazgos.graves_rojo.map((item: any, i: number) => (<p key={i} className="mb-4 text-[#8A968C] text-sm leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-[#E8EBE4] print:text-slate-900 font-bold">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                            </div>
                          )}
                          {reporte.hallazgos?.debiles_amarillo?.length > 0 && (
                            <div className="border-l-4 border-l-[#EAB308] bg-[#EAB308]/5 p-6 rounded-xl border border-[#2C352E] print:bg-amber-50 print:border-amber-100 print:shadow-sm">
                              <h3 className="text-sm font-bold text-[#EAB308] uppercase tracking-widest mb-4 flex items-center gap-2 print:text-amber-700"><Zap size={18}/> {t[idioma].mejoras}</h3>
                              {reporte.hallazgos.debiles_amarillo.map((item: any, i: number) => (<p key={i} className="mb-4 text-[#8A968C] text-sm leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-[#E8EBE4] print:text-slate-900 font-bold">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                            </div>
                          )}
                          {reporte.hallazgos?.bien_verde?.length > 0 && (
                            <div className="border-l-4 border-l-[#99CDD8] bg-[#99CDD8]/5 p-6 rounded-xl border border-[#2C352E] print:bg-emerald-50 print:border-emerald-100 print:shadow-sm">
                              <h3 className="text-sm font-bold text-[#99CDD8] uppercase tracking-widest mb-4 flex items-center gap-2 print:text-emerald-700"><CheckCircle2 size={18}/> {t[idioma].aciertos}</h3>
                              {reporte.hallazgos.bien_verde.map((item: any, i: number) => (<p key={i} className="mb-4 text-[#8A968C] text-sm leading-relaxed print:text-slate-700 print:break-inside-avoid"><b className="text-[#E8EBE4] print:text-slate-900 font-bold">{item.titulo}:</b> <br/>{item.descripcion}</p>))}
                            </div>
                          )}
                        </div>
                      )}

                      {subVistaReporte === "checklist" && (
                         <div className="animate-fade-custom bg-[#131714] border border-[#2C352E] rounded-xl p-8">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2C352E]">
                               <div>
                                 <h3 className="text-lg font-bold text-[#E8EBE4] flex items-center gap-2"><ListChecks size={20} className="text-[#F3C3B2]" /> Optimización Rápida</h3>
                                 <p className="text-[#8A968C] text-xs mt-1">Completá estas tareas para mejorar el Score.</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest">Progreso</p>
                                 <p className="text-lg font-bold text-[#F3C3B2]">{tareasCompletadas.length} / {reporte.checklist?.length || 0}</p>
                               </div>
                            </div>

                            {reporte.checklist ? (
                              <div className="space-y-3">
                                {reporte.checklist.map((item: any, i: number) => {
                                  const esCompletada = tareasCompletadas.includes(i);
                                  return (
                                    <div key={i} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border transition-all duration-300 ${esCompletada ? "bg-[#99CDD8]/5 border-[#99CDD8]/20 opacity-50" : "bg-[#1A1F1B] border-[#2C352E] hover:border-[#F3C3B2]/50"}`}>
                                       <div className="flex items-start gap-4">
                                         <button onClick={() => toggleTarea(i)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${esCompletada ? "bg-[#99CDD8] border-[#99CDD8] text-[#131714]" : "border-[#8A968C] hover:border-[#F3C3B2]"}`}>
                                            {esCompletada && <CheckSquare size={14} strokeWidth={3} />}
                                         </button>
                                         <div>
                                           <p className={`font-bold text-sm transition-all ${esCompletada ? "line-through text-[#8A968C]" : "text-[#E8EBE4]"}`}>{item.tarea}</p>
                                           <div className="flex gap-2 mt-1.5">
                                             <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.color === 'rojo' ? 'bg-[#E66767]/10 text-[#E66767]' : 'bg-[#EAB308]/10 text-[#EAB308]'}`}>Prioridad {item.impacto}</span>
                                           </div>
                                         </div>
                                       </div>
                                       <button onClick={() => setMostrarConfirmacion(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-widest bg-[#2C352E] text-[#E8EBE4] hover:bg-[#8A968C] transition-colors group">
                                          <Sparkles size={12} className="text-[#F3C3B2] group-hover:animate-pulse" /> {t[idioma].autoApply}
                                       </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center text-[#8A968C] text-sm py-10">Esta auditoría no tiene Checklist.</div>
                            )}
                         </div>
                      )}

                      {subVistaReporte === "avanzado" && (
                         <div className="animate-fade-custom grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {reporte.pacing ? (
                              <div className="bg-[#131714] border border-[#2C352E] rounded-xl p-6 flex flex-col justify-center">
                                 <h3 className="text-sm font-bold text-[#E8EBE4] mb-1 flex items-center gap-2"><Clock size={16} className={reporte.pacing.color}/> {t[idioma].pacingTit}</h3>
                                 <p className="text-xs text-[#8A968C] mb-6">{t[idioma].pacingDesc}</p>
                                 
                                 <div className="flex justify-between items-end mb-2">
                                    <div><p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest">Gasto Actual</p><p className="text-2xl font-black text-[#E8EBE4] mt-1">${reporte.pacing.gasto}</p></div>
                                    <div className="text-right"><p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest">Presupuesto</p><p className="text-lg font-bold text-[#8A968C] mt-1">${reporte.pacing.presupuesto}</p></div>
                                 </div>
                                 <div className="w-full bg-[#1A1F1B] rounded-full h-2 mb-4 border border-[#2C352E] overflow-hidden">
                                   <div className={`${reporte.pacing.bg} h-2 rounded-full transition-all duration-1000`} style={{width: `${reporte.pacing.porcentajeActual}%`}}></div>
                                 </div>
                                 <p className={`text-[10px] font-bold ${reporte.pacing.color} uppercase tracking-widest`}>
                                   {reporte.pacing.mensaje}
                                 </p>
                              </div>
                            ) : (
                              <div className="bg-[#131714] border border-[#2C352E] rounded-xl p-6 flex items-center justify-center text-[#8A968C] text-xs text-center">
                                Este reporte no tiene datos de presupuesto.
                              </div>
                            )}

                            <div className="bg-[#131714] border border-[#2C352E] rounded-xl p-6">
                               <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <h3 className="text-sm font-bold text-[#E8EBE4] mb-1 flex items-center gap-2"><LayoutGrid size={16} className="text-[#F3C3B2]"/> {t[idioma].matrizTit}</h3>
                                   <p className="text-xs text-[#8A968C]">{t[idioma].matrizDesc}</p>
                                 </div>
                                 <span className="px-2 py-0.5 bg-[#2C352E] text-[#8A968C] text-[9px] font-bold rounded uppercase tracking-widest">Pronto</span>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-2 h-32 opacity-30 grayscale cursor-not-allowed">
                                  <div className="bg-[#99CDD8]/10 border border-[#99CDD8]/20 rounded-lg p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-bold text-[#99CDD8] uppercase">{t[idioma].escalar}</span>
                                    <span className="text-lg font-black text-[#E8EBE4]">?</span>
                                  </div>
                                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-bold text-blue-400 uppercase">{t[idioma].potenciales}</span>
                                    <span className="text-lg font-black text-[#E8EBE4]">?</span>
                                  </div>
                                  <div className="bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-lg p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-bold text-[#EAB308] uppercase">{t[idioma].observar}</span>
                                    <span className="text-lg font-black text-[#E8EBE4]">?</span>
                                  </div>
                                  <div className="bg-[#E66767]/10 border border-[#E66767]/20 rounded-lg p-2 flex flex-col justify-between">
                                    <span className="text-[9px] font-bold text-[#E66767] uppercase">{t[idioma].apagar}</span>
                                    <span className="text-lg font-black text-[#E8EBE4]">?</span>
                                  </div>
                               </div>
                            </div>

                         </div>
                      )}

                      <div className="hidden print:block mt-16 pt-6 border-t border-slate-200 text-center"><p className="text-xs text-slate-400 font-medium">{agenciaPie}</p></div>
                    </div>
                  </div>
                )}

                {/* VISTA: HISTORIAL */}
                {vista === "historial" && (
                  <div className="animate-fade-custom bg-[#1A1F1B] border border-[#2C352E] p-8 rounded-2xl shadow-xl flex flex-col min-h-[600px] print:hidden relative z-10 max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                       <div>
                         <h2 className="text-2xl font-bold text-[#E8EBE4]">{modoPlan === 'agencia' ? t[idioma].monitoreo : "Historial de Auditorías"}</h2>
                         <p className="text-sm text-[#8A968C] mt-1">{t[idioma].tenes} {historial.length} {t[idioma].registradas}</p>
                       </div>

                       <div className="flex bg-[#131714] p-1 rounded-lg border border-[#2C352E]">
                           <button onClick={() => setFiltroEstado("todos")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filtroEstado === 'todos' ? 'bg-[#2C352E] text-[#E8EBE4]' : 'text-[#8A968C] hover:text-[#E8EBE4]'}`}>{t[idioma].todos}</button>
                           <button onClick={() => setFiltroEstado("critico")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${filtroEstado === 'critico' ? 'bg-[#E66767]/10 text-[#E66767]' : 'text-[#8A968C] hover:text-[#E66767]'}`}><span className="w-1.5 h-1.5 rounded-full bg-current"></span> {t[idioma].criticos}</button>
                           <button onClick={() => setFiltroEstado("atencion")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${filtroEstado === 'atencion' ? 'bg-[#EAB308]/10 text-[#EAB308]' : 'text-[#8A968C] hover:text-[#EAB308]'}`}><span className="w-1.5 h-1.5 rounded-full bg-current"></span> {t[idioma].atencion}</button>
                       </div>
                    </div>
                    
                    <div className="flex-1 border-t border-[#2C352E]">
                      <div className="grid grid-cols-12 gap-4 py-3 border-b border-[#2C352E] text-[10px] font-bold text-[#8A968C] uppercase tracking-widest items-center px-4">
                        <div className="col-span-4">{t[idioma].thCliente}</div>
                        <div className="col-span-2 text-center">{t[idioma].thFecha}</div>
                        <div className="col-span-2 text-center">{t[idioma].score}</div>
                        <div className="col-span-2 text-center">Estado</div>
                        <div className="col-span-2 text-right">{t[idioma].thAccion}</div>
                      </div>

                      {clientesFiltrados.length === 0 ? (
                        <div className="p-10 text-center text-[#8A968C] text-sm font-medium border border-dashed border-[#2C352E] rounded-xl mt-4">No se encontraron auditorías.</div>
                      ) : (
                        <div className="divide-y divide-[#2C352E]">
                          {clientesFiltrados.map((item, index) => {
                            const st = getDashboardStatus(item.score);

                            return (
                              <div key={index} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-[#2C352E]/30 transition-colors px-4 rounded-lg">
                                <div className="col-span-4 flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${st.bgTints} ${st.color} border border-transparent flex-shrink-0`}>{item.score}</div>
                                  <p className="font-bold text-[#E8EBE4] text-sm truncate">{item.nombre_cuenta || t[idioma].cuentaSinNombre}</p>
                                </div>
                                <div className="col-span-2 text-center"><p className="text-xs text-[#8A968C] font-medium">{parseDate(item.created_at)}</p></div>
                                
                                <div className="col-span-2 flex flex-col justify-center px-2">
                                  <div className="w-full h-1.5 bg-[#131714] rounded-full overflow-hidden border border-[#2C352E]/50">
                                    <div className={`h-full rounded-full transition-all`} style={{width: `${item.score}%`, backgroundColor: st.color.replace('text-[', '').replace(']', '')}}></div>
                                  </div>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold ${st.bgTints} ${st.color}`}><st.icon size={10} /> {st.label}</span>
                                </div>

                                <div className="col-span-2 flex justify-end items-center gap-3">
                                  <button onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta || t[idioma].cuentaSinNombre); setSubVistaReporte("diagnostico"); setVista("reporte_lectura"); }} className="text-[10px] uppercase tracking-widest font-bold text-[#8A968C] border border-[#2C352E] hover:text-[#E8EBE4] hover:bg-[#2C352E] px-3 py-1.5 rounded transition-colors">
                                    {t[idioma].abrirAud}
                                  </button>
                                  <button onClick={() => borrarAuditoria(item.id)} className="text-[#8A968C] hover:text-[#E66767] transition-colors p-1" title="Eliminar">
                                    <Trash2 size={14} />
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

                {/* VISTA: CONFIGURACIÓN / PERFIL */}
                {vista === "perfil" && (
                  <div className="animate-fade-custom bg-[#1A1F1B] border border-[#2C352E] p-10 rounded-2xl shadow-xl max-w-4xl mx-auto print:hidden relative z-10">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#2C352E]">
                       <div className="w-10 h-10 bg-[#2C352E] rounded-xl flex items-center justify-center text-[#E8EBE4]"><Settings size={20} /></div>
                       <div>
                          <h2 className="text-xl font-bold text-[#E8EBE4]">{t[idioma].configuracion}</h2>
                          <p className="text-[#8A968C] text-xs mt-1">{t[idioma].persPdf}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-4">Marca Blanca Visual</h3>
                        <div><label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].nomAgencia}</label><input type="text" className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#8A968C] focus:outline-none transition-all text-sm" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].sitioWeb}</label><input type="text" placeholder="Ej: www.tuagencia.com" className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#8A968C] focus:outline-none transition-all text-sm" value={agenciaWeb} onChange={(e) => setAgenciaWeb(e.target.value)} /></div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].logoPdf}</label>
                          <div className="flex items-center gap-6 p-4 border border-[#2C352E] rounded-xl bg-[#131714]">
                            {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-12 h-12 object-contain rounded bg-white p-1" /> : <div className="w-12 h-12 bg-[#2C352E] rounded flex items-center justify-center text-[#8A968C] text-[9px] uppercase font-bold text-center border border-dashed border-[#8A968C]">Sube</div>}
                            <div className="flex-1"><input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-xs text-[#8A968C] cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-[#2C352E] file:text-[#E8EBE4] hover:file:bg-[#8A968C] transition-all" /></div>
                          </div>
                        </div>
                        <div><label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].piePagina}</label><textarea className="w-full h-20 p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] text-sm focus:border-[#8A968C] focus:outline-none transition-all resize-none" value={agenciaPie} onChange={(e) => setAgenciaPie(e.target.value)} /></div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-4">Preferencias de Trabajo</h3>
                        <div>
                          <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].monedaDef}</label>
                          <div className="relative"><select className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#8A968C] focus:outline-none transition-all appearance-none cursor-pointer text-sm" value={moneda} onChange={(e) => setMoneda(e.target.value)}><option value="USD ($)">Dólares USD ($)</option><option value="EUR (€)">Euros EUR (€)</option><option value="ARS ($)">Pesos Argentinos ARS ($)</option><option value="MXN ($)">Pesos Mexicanos MXN ($)</option></select><ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8A968C] pointer-events-none" /></div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#8A968C] mb-2 uppercase tracking-widest">{t[idioma].metricaDef}</label>
                          <div className="relative"><select className="w-full p-3.5 bg-[#131714] border border-[#2C352E] rounded-xl text-[#E8EBE4] focus:border-[#8A968C] focus:outline-none transition-all appearance-none cursor-pointer text-sm" value={metrica} onChange={(e) => setMetrica(e.target.value)}><option value="ROAS">ROAS (Retorno de Inversión)</option><option value="CPA">CPA (Costo por Adquisición)</option><option value="ROI">ROI</option></select><ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8A968C] pointer-events-none" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[#2C352E] mt-10 pt-6">
                      <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="w-full md:w-auto md:px-8 text-[#262B27] bg-[#F3C3B2] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#eab3a1] disabled:opacity-50 transition-colors shadow-sm">{loading ? t[idioma].guardando : t[idioma].guardarAj}</button>
                    </div>
                  </div>
                )}

                {/* VISTA: FACTURACIÓN */}
                {vista === "facturacion" && (
                  <div className="animate-fade-custom bg-[#1A1F1B] border border-[#2C352E] p-10 rounded-2xl shadow-xl max-w-2xl mx-auto print:hidden relative z-10">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#2C352E]">
                       <div className="w-10 h-10 bg-[#2C352E] rounded-xl flex items-center justify-center text-[#E8EBE4]"><CreditCard size={20} /></div>
                       <div>
                          <h2 className="text-xl font-bold text-[#E8EBE4]">{t[idioma].facturacionTitulo}</h2>
                          <p className="text-[#8A968C] text-xs mt-1">{t[idioma].facturacionDesc}</p>
                       </div>
                    </div>
                    <div className="bg-[#131714] border border-[#2C352E] rounded-xl p-6 mb-6 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-2">{t[idioma].planActual}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-[#E8EBE4]">{perfil?.plan === 'pro' ? 'Mora Pro' : 'Mora Free'}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#99CDD8]/10 text-[#99CDD8] uppercase tracking-widest">{t[idioma].activa}</span>
                        </div>
                        {/* FECHA DE RENOVACIÓN AÑADIDA */}
                        <p className="text-xs text-[#8A968C] mt-2 font-medium">Renueva el 14 de Abril, 2026</p>
                      </div>
                    </div>
                    <button className="w-full text-[#E8EBE4] bg-[#2C352E] px-6 py-3.5 rounded-xl text-sm font-bold transition-colors mt-2 flex justify-center items-center gap-2 cursor-not-allowed opacity-70"><CreditCard size={16} /> {t[idioma].gestionarStripe} <span className="text-[#F3C3B2] text-[9px] uppercase tracking-widest ml-2">{t[idioma].pronto}</span></button>
                  </div>
                )}

                {/* VISTA: FEEDBACK */}
                {vista === "feedback" && (
                  <div className="animate-fade-custom bg-[#1A1F1B] border border-[#2C352E] p-10 rounded-2xl shadow-xl max-w-2xl mx-auto text-center print:hidden relative z-10">
                    <div className="flex justify-center mb-6"><div className="w-12 h-12 bg-[#2C352E] rounded-xl flex items-center justify-center text-[#E8EBE4]"><MessageSquare size={24} /></div></div>
                    <h2 className="text-xl font-bold mb-2 text-[#E8EBE4]">{t[idioma].ayudanos}</h2>
                    <p className="text-[#8A968C] text-sm mb-8 font-medium">{t[idioma].bug}</p>
                    <textarea className="w-full h-32 p-4 bg-[#131714] border border-[#2C352E] rounded-xl mb-6 text-[#E8EBE4] focus:border-[#F3C3B2] focus:outline-none resize-none transition-all text-sm" placeholder={t[idioma].escribiSug} value={mensajeFeedback} onChange={(e) => setMensajeFeedback(e.target.value)} />
                    <button onClick={mandarFeedback} disabled={enviandoFeedback || !mensajeFeedback} className="w-full text-[#262B27] bg-[#F3C3B2] hover:bg-[#eab3a1] px-6 py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">{enviandoFeedback ? t[idioma].enviando : t[idioma].enviarSug}</button>
                  </div>
                )}

              </div>
            </main>
          </>
        )}
      </div>

      {/* BOTÓN FLOTANTE DE FEEDBACK (Vuelve a estar activo si hay sesión) */}
      {session && (
        <button onClick={() => { setVista("feedback"); setReporte(null); setMenuPerfil(false); }} className="fixed bottom-8 right-8 z-50 bg-[#F3C3B2] text-[#131714] hover:bg-[#eab3a1] px-5 py-3 rounded-full font-bold shadow-2xl hover:-translate-y-1 transition-transform flex items-center gap-2 border border-[#F3C3B2]/20 print:hidden">
          <MessageSquare size={18} /> {t[idioma].feedback}
        </button>
      )}

      {/* MODAL CONFIRMACIÓN AUTO-APPLY */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-[#131714]/90 backdrop-blur-sm cursor-pointer" onClick={() => setMostrarConfirmacion(false)}></div>
          <div className="bg-[#1A1F1B] border border-[#2C352E] shadow-2xl rounded-2xl w-full max-w-md relative z-10 animate-fade-custom overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#EAB308]"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308] flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#E8EBE4] leading-tight">Confirmar Acción</h3>
                  <p className="text-xs text-[#8A968C] mt-1">Conexión con Google Ads</p>
                </div>
              </div>
              <p className="text-[#8A968C] text-sm leading-relaxed mb-8">
                <strong className="text-[#E8EBE4]">⚠️ ATENCIÓN:</strong> Estás por ejecutar cambios directos en el presupuesto y estado de las campañas.<br/><br/>
                ¿Confirmás que revisaste el impacto de esta acción y deseás aplicar los cambios?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setMostrarConfirmacion(false)} className="px-5 py-2.5 rounded-lg font-bold text-xs text-[#E8EBE4] bg-[#2C352E] hover:bg-[#8A968C] transition-colors w-full uppercase tracking-widest">
                  Cancelar
                </button>
                <button onClick={aplicarCambios} className="px-5 py-2.5 rounded-lg font-bold text-xs text-[#262B27] bg-[#F3C3B2] hover:bg-[#eab3a1] transition-colors w-full flex justify-center items-center gap-2 uppercase tracking-widest">
                  <Sparkles size={14} /> Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST UNDO */}
      {toastState.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[120] bg-[#1A1F1B] border border-[#2C352E] shadow-2xl rounded-xl overflow-hidden flex flex-col w-80 animate-fade-custom">
           <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 {toastState.status === 'success' && <CheckCircle2 className="text-[#99CDD8]" size={18} />}
                 {toastState.status === 'undoing' && <RefreshCcw className="text-[#EAB308] animate-spin" size={18} />}
                 {toastState.status === 'reverted' && <Undo2 className="text-[#8A968C]" size={18} />}
                 
                 <div>
                    <p className="text-xs font-bold text-[#E8EBE4]">
                      {toastState.status === 'success' ? 'Cambios aplicados.' : 
                       toastState.status === 'undoing' ? 'Revertiendo...' : 'Cambios revertidos.'}
                    </p>
                    {toastState.status === 'success' && <p className="text-[9px] text-[#8A968C] font-medium uppercase tracking-widest mt-0.5">Permanentes en {toastState.timeLeft}s</p>}
                 </div>
              </div>
              {toastState.status === 'success' && (
                <button onClick={deshacerCambios} className="text-[#F3C3B2] hover:text-[#E8EBE4] font-bold text-[10px] uppercase tracking-widest transition-colors px-2 py-1 bg-[#F3C3B2]/10 rounded">
                   Deshacer
                </button>
              )}
           </div>
           {toastState.status === 'success' && (
              <div className="w-full bg-[#131714] h-1">
                 <div className="bg-[#99CDD8] h-1 transition-all duration-1000 ease-linear" style={{ width: `${(toastState.timeLeft / 15) * 100}%` }}></div>
              </div>
           )}
        </div>
      )}
    </>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}