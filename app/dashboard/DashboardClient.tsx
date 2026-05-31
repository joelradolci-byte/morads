"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Target, Users, Building2, LogOut, ChevronDown, 
  Zap, AlertTriangle, CheckCircle2, CreditCard, Settings, 
  Search, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, LayoutPanelLeft,
  FileText, BarChart3, ShieldCheck, Plus, Clock, Activity, Trash2, Lock, 
  ListChecks, LayoutGrid, CheckSquare, Sparkles, Undo2, RefreshCcw, Type, Calculator, BookOpen,
  Upload, Copy, Check, TrendingUp as TrendUp, ChevronRight, Folder, LayoutDashboard, X, Loader2
} from 'lucide-react';
import { extraerDatosGoogle, construirDatosAuditoria } from '../../lib/googleAds'; 
import {
  calcularPlanRobinHood,
  type DestripadorReporte,
  type DaypartingReporte,
  type SimuladorPresupuestoReporte,
} from '../../lib/motorMora';
import {
  type CampanasQueryInicial,
  type CampanasSubVista,
  type FiltroCampanaTag,
} from '../../lib/campanasEvaluacion';
import { useCampanasEvaluadas } from '../../lib/useCampanasEvaluadas';
import PacingResumenCuenta from './campanas/PacingResumenCuenta';
import MatrizResumenCuenta from './campanas/MatrizResumenCuenta';
import GestorCampanasView from './campanas/GestorCampanasView';
import type { PacingAccionPendiente } from './campanas/PacingCampanasVista';
import { etiquetaBadgeSalud, type NivelSalud } from '../../lib/saludMora';
import type { TipoHallazgo } from '../../lib/types/hallazgoDetalle';
import {
  loadDestripadorEstado,
  marcarTerminosCopiados,
  marcarTerminosMitigados,
  terminoKey,
  type DestripadorEstadoPersistido,
} from '../../lib/destripadorEstado';
import {
  createSafeApplyPlan,
  executeLocalSafeApply,
  rollbackLocalSafeApply,
  type SafeApplyAuditEntry,
  type SafeApplyChange,
  type SafeApplyPlan,
} from '../../lib/safeApply';
import { supabase } from "../../lib/supabase/browser";
import { moraAuthHeaders } from "../../lib/auth/client-headers";
import { downloadAuditPdf } from "../../lib/pdf/downloadAuditPdf";
import { downloadComparacionPdf } from "../../lib/pdf/downloadComparacionPdf";
import type { UsageSnapshot } from "../../lib/usage/config";
import DestripadorPanel from './DestripadorPanel';
import DaypartingPanel from './DaypartingPanel';
import PresupuestoSimulatorPanel from './PresupuestoSimulatorPanel';
import AdGeneratorPanel, { type AdGeneratorContext } from './AdGeneratorPanel';
import ResumenFacilPanel, { type ItemResumenHallazgo } from './ResumenFacilPanel';
import HallazgoDetallePanel from './HallazgoDetallePanel';
import HistorialAuditoriasSection from './reportes/HistorialAuditoriasSection';
import LecturaAuditoriaView from './reportes/LecturaAuditoriaView';
import FeedbackFab from './feedback/FeedbackFab';
import ComparacionHallazgosBloque from './reportes/ComparacionHallazgosBloque';
import {
  buildQuickWinsFromReporte,
  buildPositivosFromReporte,
  countHallazgosAccionables,
} from './reportes/buildQuickWinsFromReporte';
import ConfiguracionView from '../configuracion/ConfiguracionView';
import GoogleAdsConnectBlock from '../components/GoogleAdsConnectBlock';
import { LocaleProvider, useLocale } from '../../lib/i18n/LocaleProvider';
import { copyResumen } from '../../lib/copyResumen';
import { getCurrencyCodeFromReporte } from '../../lib/formatoMoneda';
import {
  buildPdfFilename,
  comparacionEsMismaCuenta,
} from './reportes/historialReportesUtils';
import type { DetalleHallazgo } from '../../lib/types/hallazgoDetalle';
import { esAuditoriaHistorica } from '../../lib/copyHistorico';
import {
  resolverAccionHallazgo,
  introPanelDesdeResumen,
  textoHallazgoParaUsuario,
  type AccionResumenPanel,
} from '../../lib/resumenFacil';
import GlosarioTip from '../components/GlosarioTip';
import {
  loadDaypartingEstado,
  marcarFranjasAplicadas,
  type DaypartingEstadoPersistido,
} from '../../lib/daypartingEstado';

export type AuditorVista = "dashboard" | "nueva" | "historial" | "perfil" | "reporte_lectura" | "facturacion" | "detalle_hallazgo" | "campañas";

const vistaPorRuta: Record<string, AuditorVista> = {
  "/dashboard": "dashboard",
  "/campanas": "campañas",
  "/reportes": "historial",
  "/configuracion": "perfil",
  "/facturacion": "facturacion",
};

type BadgeAuditoria = "recomendado" | "desactualizada";

function diasCalendarioDesde(iso: string): number {
  const fecha = new Date(iso);
  const hoy = new Date();
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.floor((inicioHoy.getTime() - inicioFecha.getTime()) / (1000 * 60 * 60 * 24));
}

function formatearHoraLocal(fecha: Date): string {
  return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatearUltimaAuditoria(createdAt: string | undefined | null): string | null {
  if (!createdAt) return null;
  const fecha = new Date(createdAt);
  if (Number.isNaN(fecha.getTime())) return null;
  const dias = diasCalendarioDesde(createdAt);
  if (dias === 0) return `hoy a las ${formatearHoraLocal(fecha)}`;
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}

function parseDate(dateString: string): string {
  if (!dateString) return new Date().toLocaleDateString();
  return new Date(dateString).toLocaleDateString();
}

function getBadgeAuditoria(createdAt: string | undefined | null): BadgeAuditoria | null {
  if (!createdAt) return null;
  const dias = diasCalendarioDesde(createdAt);
  if (dias < 3) return null;
  if (dias <= 6) return "recomendado";
  return "desactualizada";
}

/** Texto breve por Quick Win: solo la descripción del hallazgo, sin fallback a `descripcion`. */
function textoQuickWin(hallazgo: {
  descripcion_simple?: string;
  descripcion_tecnica?: string;
}): string {
  const texto = textoHallazgoParaUsuario(hallazgo, true);
  if (texto.length > 360) {
    return `${texto.slice(0, 357).trimEnd()}…`;
  }
  return texto;
}

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

const CurveTop = () => (
  <svg className="absolute right-0 top-[-32px] w-8 h-8 text-[#F4F4F5] pointer-events-none" viewBox="0 0 32 32" fill="currentColor">
    <path d="M0 32 L32 32 L32 0 A32 32 0 0 0 0 32 Z" />
  </svg>
);

const CurveBottom = () => (
  <svg className="absolute right-0 bottom-[-32px] w-8 h-8 text-[#F4F4F5] pointer-events-none" viewBox="0 0 32 32" fill="currentColor">
    <path d="M0 0 L32 0 L32 32 A32 32 0 0 1 0 0 Z" />
  </svg>
);

function ScoreRing({ score, size = 150 }: { score: number, size?: number }) {
  const stroke = 12;
  const radius = (size / 2) - stroke;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const color = score < 50 ? "#E07070" : score < 80 ? "#D4A843" : "#7EB893";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-2xl opacity-20" style={{ backgroundColor: color }}></div>
      <svg height={size} width={size} className="transform -rotate-90 relative z-10">
        <circle stroke="rgba(0,0,0,0.4)" fill="transparent" strokeWidth={stroke} r={radius} cx={size/2} cy={size/2} />
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={radius} cx={size/2} cy={size/2} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <span className="text-6xl font-black text-white tracking-tighter drop-shadow-md">{score}</span>
      </div>
    </div>
  );
}

function ScoreSparkline({ data, fechas }: { data: number[], fechas: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 500;
  const h = 140; 
  const padX = 40;
  const padY = 45; 

  const coords = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2);
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return { x, y, v };
  });

  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ');
  const areaPoints = `${coords[0].x},${h} ${polyline} ${coords[coords.length-1].x},${h}`;

  const formatFecha = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}`;
  };

  return (
    <div className="relative w-full" style={{height: '160px'}}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{height:'140px'}} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="sparkGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3C3B2" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F3C3B2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map(val => {
          const y = h - padY - ((val - min) / range) * (h - padY * 2);
          if (y < padY || y > h - padY + 5) return null;
          return (
            <line key={val} x1={padX} y1={y} x2={w - padX} y2={y}
              stroke="#44403C" strokeWidth="1" strokeDasharray="4,4" />
          );
        })}

        <polygon points={areaPoints} fill="url(#sparkGrad2)" />
        <polyline points={polyline} fill="none" stroke="#F3C3B2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="5" fill="#F3C3B2" stroke="#292524" strokeWidth="2" />
            <circle cx={c.x} cy={c.y} r="16" fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{cursor: 'pointer'}}
            />
            {hovered === i && (
              <g>
                <rect x={c.x - 28} y={c.y - 38} width="56" height="28" rx="6" fill="#1C1917" stroke="#44403C" strokeWidth="1" />
                <text x={c.x} y={c.y - 23} textAnchor="middle" fill="#F5F0EB" fontSize="11" fontWeight="bold">{c.v}/100</text>
                <text x={c.x} y={c.y - 12} textAnchor="middle" fill="#A8A29E" fontSize="9" fontWeight="500">{formatFecha(fechas[i])}</text>
              </g>
            )}
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-1" style={{ paddingLeft: `${(padX/w)*100}%`, paddingRight: `${(padX/w)*100}%` }}>
        {fechas.map((f, i) => (
          <span key={i} className={`text-[10px] font-bold transition-colors ${hovered === i ? 'text-[#F5F0EB]' : 'text-[#A8A29E]'}`}>
            {formatFecha(f)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AuditorDashboard({
  initialVista = "dashboard",
  initialCampanasQuery,
}: {
  initialVista?: AuditorVista;
  initialCampanasQuery?: CampanasQueryInicial;
} = {}) {
  const { locale, setLocale, resumenAutoAbrir } = useLocale();
  const idioma = locale;
  const copyR = copyResumen(locale);

  const [campanas, setCampanas] = useState<any[]>([]);
  const [cargandoCampanas, setCargandoCampanas] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState("loading");
  const [nombreCuenta, setNombreCuenta] = useState("");
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorAuditoria, setErrorAuditoria] = useState<string | null>(null);
  const [quickWinsCompletados, setQuickWinsCompletados] = useState<string[]>([]);
  const [vista, setVista] = useState<AuditorVista>(initialVista);
  const [subVistaReporte, setSubVistaReporte] = useState<"diagnostico" | "checklist" | "avanzado">("diagnostico");
  const [detalleHallazgo, setDetalleHallazgo] = useState<DetalleHallazgo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [comparacionIds, setComparacionIds] = useState<(number | string)[]>([]);
  const [vistaComparacion, setVistaComparacion] = useState(false);
  const [auditoriaActivaId, setAuditoriaActivaId] = useState<number | string | null>(null);
  const [pdfDescargandoId, setPdfDescargandoId] = useState<number | string | null>(null);
  const [pdfComparacionCargando, setPdfComparacionCargando] = useState(false);
  const [hintComparacionMax, setHintComparacionMax] = useState(false);
  const deepLinkAuditoriaHandled = useRef(false);
  const [resumenFacilAbierto, setResumenFacilAbierto] = useState(false);
  const [panelIntroResumen, setPanelIntroResumen] = useState<AccionResumenPanel | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "critico" | "atencion" | "optimo">("todos");
  const [busqueda, setBusqueda] = useState(""); 
  const [perfil, setPerfil] = useState<any>(null);
  const [usageSnapshot, setUsageSnapshot] = useState<UsageSnapshot | null>(null);
  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaLogo, setAgenciaLogo] = useState("");
  const [agenciaWeb, setAgenciaWeb] = useState("");
  const [agenciaPie, setAgenciaPie] = useState("Auditoría generada con tecnología IA - Reporte Confidencial.");
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [googleAdsChecking, setGoogleAdsChecking] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tareasCompletadas, setTareasCompletadas] = useState<number[]>([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [toastState, setToastState] = useState<{show: boolean, status: 'success' | 'undoing' | 'reverted', timeLeft: number}>({show: false, status: 'success', timeLeft: 15});
  const [pacingAccionPendiente, setPacingAccionPendiente] = useState<PacingAccionPendiente | null>(null);
  const [pacingUndo, setPacingUndo] = useState<SafeApplyPlan | null>(null);
  const [robinAccionPendiente, setRobinAccionPendiente] = useState<SafeApplyPlan | null>(null);
  const [safeApplyAuditLog, setSafeApplyAuditLog] = useState<SafeApplyAuditEntry[]>([]);
  const [pacingToast, setPacingToast] = useState<{
    show: boolean;
    status: "success" | "undoing" | "reverted" | "review";
    timeLeft: number;
    message: string;
  }>({ show: false, status: "success", timeLeft: 10, message: "" });
  const [destripadorAbierto, setDestripadorAbierto] = useState(false);
  const [daypartingAbierto, setDaypartingAbierto] = useState(false);
  const [simuladorAbierto, setSimuladorAbierto] = useState(false);
  const [adGeneratorContext, setAdGeneratorContext] = useState<AdGeneratorContext | null>(null);
  const [destripadorEstado, setDestripadorEstado] = useState<DestripadorEstadoPersistido>({
    mitigados: {},
    copiados: {},
  });
  const [daypartingEstado, setDaypartingEstado] = useState<DaypartingEstadoPersistido>({
    aplicados: {},
  });

  const navegar = (nextVista: AuditorVista, path: string) => {
    setVista(nextVista);
    window.history.pushState(null, "", path);
  };

  useEffect(() => {
    setVista(initialVista);
  }, [initialVista]);

  useEffect(() => {
    const sincronizarVistaConRuta = () => {
      const nextVista = vistaPorRuta[window.location.pathname];
      if (nextVista) {
        setVista(nextVista);
        if (nextVista === "historial" && !new URLSearchParams(window.location.search).get("id")) {
          setAuditoriaActivaId(null);
          setReporte(null);
          setVistaComparacion(false);
        }
      }
    };

    window.addEventListener("popstate", sincronizarVistaConRuta);
    return () => window.removeEventListener("popstate", sincronizarVistaConRuta);
  }, []);

  useEffect(() => {
    const formatSession = (supaSession: any) => {
      if (!supaSession) return null;
      return {
        user: {
          id: supaSession.user.id,
          email: supaSession.user.email,
          name: supaSession.user.user_metadata?.full_name || supaSession.user.user_metadata?.name || "Usuario",
          image: supaSession.user.user_metadata?.avatar_url
        }
      };
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(formatSession(data.session));
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      setSession(formatSession(supaSession));
      setStatus(supaSession ? "authenticated" : "unauthenticated");

      if (supaSession?.provider_refresh_token) {
        setTimeout(() => {
          void supabase
            .from('google_ads_tokens')
            .upsert({
              user_id: supaSession.user.id,
              refresh_token: supaSession.provider_refresh_token,
              actualizado_el: new Date().toISOString(),
            })
            .then(() => {
              setGoogleAdsConnected(true);
              setGoogleAdsChecking(false);
            });
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarUsoMensual = async () => {
    try {
      const headers = await moraAuthHeaders();
      const res = await fetch("/api/usage", { headers });
      if (res.ok) {
        const data = (await res.json()) as UsageSnapshot;
        setUsageSnapshot(data);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (session?.user?.id) void cargarUsoMensual();
  }, [session?.user?.id]);

  const auditoriasRestantes = useMemo(() => {
    if (!usageSnapshot) return null;
    return Math.max(
      0,
      usageSnapshot.limits.audit.monthly - usageSnapshot.usage.audit
    );
  }, [usageSnapshot]);

  const pdfRestantes = useMemo(() => {
    if (!usageSnapshot) return null;
    return Math.max(0, usageSnapshot.limits.pdf.monthly - usageSnapshot.usage.pdf);
  }, [usageSnapshot]);

  const pdfExportDisabled = pdfRestantes === 0;

  const pdfQuotaLabel = usageSnapshot
    ? `PDFs este mes: ${usageSnapshot.usage.pdf}/${usageSnapshot.limits.pdf.monthly}${
        usageSnapshot.tier === "trial" ? " (trial)" : ""
      }`
    : null;

  const auditoriaBloqueadaPorCuota = auditoriasRestantes === 0;

  const conectarGoogleAds = async (redirectPath = "/dashboard") => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        scopes: "https://www.googleapis.com/auth/adwords",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const iniciarSesion = () => conectarGoogleAds("/dashboard");

  const verificarConexionGoogleAds = async (userId?: string) => {
    const uid = userId ?? session?.user?.id;
    if (!uid) {
      setGoogleAdsConnected(false);
      setGoogleAdsChecking(false);
      return;
    }
    setGoogleAdsChecking(true);
    try {
      const { data } = await supabase
        .from("google_ads_tokens")
        .select("refresh_token")
        .eq("user_id", uid)
        .maybeSingle();
      setGoogleAdsConnected(!!data?.refresh_token);
    } catch {
      setGoogleAdsConnected(false);
    } finally {
      setGoogleAdsChecking(false);
    }
  };

  const MENSAJE_ERROR_AUDITORIA =
    "El análisis no está disponible en este momento. Intentá de nuevo en unos minutos.";

  const ejecutarAuditoriaConIA = async () => {
    setLoading(true);
    setErrorAuditoria(null);
    try {
      console.log("Extrayendo métricas...");
      const datosParaAuditar = await construirDatosAuditoria();

      console.log("Enviando datos a Mora...");
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: await moraAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          datos: datosParaAuditar,
          idioma_ui: locale,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensaje =
          typeof body?.message === "string"
            ? body.message
            : MENSAJE_ERROR_AUDITORIA;
        setErrorAuditoria(mensaje);
        return;
      }

      const parsedReporte = body;
      setReporte(parsedReporte);
      setQuickWinsCompletados([]);
      console.log("Completado!");

      const userId = session?.user?.id;
      if (userId) {
        await supabase.from('historial_auditorias').insert([{ 
            user_id: userId, 
            score: parsedReporte.health_score, 
            reporte_json: parsedReporte, 
            nombre_cuenta: nombreCuenta || "Cuenta Prueba" 
        }]);
        cargarHistorial();
      }

      void cargarUsoMensual();

      if (resumenAutoAbrir) {
        setResumenFacilAbierto(true);
      }

    } catch (error) {
      console.error("Fallo crítico en la auditoría:", error);
      setErrorAuditoria(MENSAJE_ERROR_AUDITORIA);
    } finally {
      setLoading(false);
    }
  };

  const cerrarDetalle = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDetalleHallazgo(null);
      setIsClosing(false);
    }, 400); 
  };
  
  const ultimaAuditoria = historial.length > 0 ? historial[0] : null;

  const auditoriaContextual = useMemo(() => {
    if (vista === "reporte_lectura" && auditoriaActivaId != null) {
      return historial.find((h) => h.id === auditoriaActivaId) ?? ultimaAuditoria;
    }
    return ultimaAuditoria;
  }, [vista, auditoriaActivaId, historial, ultimaAuditoria]);

  const auditoriaResumen = auditoriaContextual;

  const modoHistoricoAuditoria = useMemo(
    () => esAuditoriaHistorica(auditoriaResumen?.id, ultimaAuditoria?.id),
    [auditoriaResumen?.id, ultimaAuditoria?.id]
  );

  const fechaAuditoriaResumen = useMemo(
    () =>
      auditoriaResumen?.created_at
        ? parseDate(auditoriaResumen.created_at)
        : undefined,
    [auditoriaResumen?.created_at]
  );

  useEffect(() => {
    const auditId = auditoriaContextual?.id;
    if (auditId == null) {
      setDestripadorEstado({ mitigados: {}, copiados: {} });
      setDaypartingEstado({ aplicados: {} });
      return;
    }
    setDestripadorEstado(loadDestripadorEstado(auditId));
    setDaypartingEstado(loadDaypartingEstado(auditId));
  }, [auditoriaContextual?.id]);

  const mitigadosKeys = useMemo(
    () => new Set(Object.keys(destripadorEstado.mitigados)),
    [destripadorEstado.mitigados]
  );
  const copiadosKeys = useMemo(
    () => new Set(Object.keys(destripadorEstado.copiados)),
    [destripadorEstado.copiados]
  );
  const daypartingAplicadosIds = useMemo(
    () => new Set(Object.keys(daypartingEstado.aplicados)),
    [daypartingEstado.aplicados]
  );

  const quickWinsDelDia = useMemo(
    () => buildQuickWinsFromReporte(ultimaAuditoria?.reporte_json),
    [ultimaAuditoria?.reporte_json]
  );

  const quickWinsResumen = useMemo(
    () => buildQuickWinsFromReporte(auditoriaResumen?.reporte_json),
    [auditoriaResumen?.reporte_json]
  );

  const positivosResumen = useMemo(
    () => buildPositivosFromReporte(auditoriaResumen?.reporte_json),
    [auditoriaResumen?.reporte_json]
  );

  const totalHallazgosResumen = useMemo(
    () => countHallazgosAccionables(auditoriaResumen?.reporte_json),
    [auditoriaResumen?.reporte_json]
  );

  const currencyCodeActiva = useMemo(
    () => getCurrencyCodeFromReporte(auditoriaResumen?.reporte_json ?? reporte),
    [auditoriaResumen?.reporte_json, reporte]
  );

  const diagnosticoSalud = ultimaAuditoria?.reporte_json?.diagnostico_salud ?? null;
  const { cpaPromedio: cpaPromedioCampanas, evaluadas: campanasEvaluadas, activas: campanasActivas, buckets: matrizBuckets } =
    useCampanasEvaluadas(campanas, diagnosticoSalud);

  const pacingUndoIds = useMemo(
    () => pacingUndo?.changes.map(c => String(c.targetId)) ?? [],
    [pacingUndo]
  );

  const cuentaSinCambiosUrgentes =
    ultimaAuditoria?.reporte_json?.cuenta_sin_cambios_urgentes === true ||
    ultimaAuditoria?.reporte_json?.diagnostico_salud?.cuenta?.cuenta_sin_cambios_urgentes === true;

  const razonesCuentaSana: string[] =
    ultimaAuditoria?.reporte_json?.diagnostico_salud?.cuenta?.razones ?? [];

  const planRobin = useMemo(() => {
    if (campanasActivas.length === 0) return null;
    const gastoTotal = campanasActivas.reduce((acc, e) => acc + (e.campana.gasto_mensual || 0), 0);
    const convTotales = campanasActivas.reduce((acc, e) => acc + (e.campana.conversiones || 0), 0);
    return calcularPlanRobinHood(
      campanasActivas.map(e => e.campana),
      cpaPromedioCampanas,
      "ecommerce",
      gastoTotal,
      convTotales
    );
  }, [campanasActivas, cpaPromedioCampanas]);

  const actualizarUrlCampanas = (params: { vista?: CampanasSubVista; q?: string; tag?: FiltroCampanaTag }) => {
    const sp = new URLSearchParams();
    const vista = params.vista ?? initialCampanasQuery?.subVista ?? "lista";
    if (vista !== "lista") sp.set("vista", vista);
    const q = params.q ?? "";
    if (q) sp.set("q", q);
    const tag = params.tag;
    if (tag && tag !== "todos") sp.set("tag", tag);
    const qs = sp.toString();
    window.history.pushState(null, "", qs ? `/campanas?${qs}` : "/campanas");
  };

  const renderGestorCampañas = () => (
    <GestorCampanasView
      campanas={campanas}
      cargando={cargandoCampanas}
      diagnosticoSalud={diagnosticoSalud}
      reporteJson={ultimaAuditoria?.reporte_json ?? null}
      initialSubVista={initialCampanasQuery?.subVista ?? "lista"}
      initialBusqueda={initialCampanasQuery?.q ?? ""}
      initialTag={(initialCampanasQuery?.tag as FiltroCampanaTag | undefined) ?? "todos"}
      initialCampanaId={initialCampanasQuery?.campanaId ?? ""}
      onRefresh={() => cargarCampanas()}
      onSubVistaChange={v => actualizarUrlCampanas({ vista: v })}
      onAbrirDetalle={(h, tipo, reporte) => abrirDetalleHallazgo(h, tipo, reporte)}
      onAbrirGenerador={abrirGeneradorAnuncios}
      onPacingAccion={setPacingAccionPendiente}
      pacingUndoIds={pacingUndoIds}
    />
  );

  const t: any = {
    es: { dashboard: "Dashboard", panelPrin: "Panel Principal", panelDesc: "Resumen del rendimiento global de tus cuentas.", saludG: "Salud Promedio", totAud: "Total Cuentas", fugasDet: "Fugas Críticas", oporMej: "Oportunidades", ultAud: "Últimas Auditorías", actRec: "Actividad Reciente", verTodas: "Ver todas →", generada: "Se auditó la cuenta", hace: "Hace", afectaA: "Afecta principalmente a", buscarGlobal: "Buscar cuenta por nombre...", nueva: "Auditor IA", clientes: "Panel de Clientes", reportes: "Reportes", feedback: "Sugerencias", configuracion: "Configuración", facturacion: "Facturación", salir: "Cerrar Sesión", placeholderNombre: "Nombre del Cliente o Cuenta", btnAnalizar: "Ejecutar Auditoría", btnAnalizando: "Analizando métricas...", exportar: "Exportar a PDF", score: "Score", problemas: "Problemas Graves", mejoras: "Áreas Débiles", aciertos: "Puntos Fuertes", login: "Iniciar sesión", tabDiag: "Diagnóstico IA", tabCheck: "Plan de Acción", tabAvanzado: "Análisis Avanzado", autoApply: "Corregir Ahora", msgAutoApply: "Disponible próximamente", pacingTit: "Pacing de Presupuesto", pacingDesc: "Ritmo de gasto proyectado", matrizTit: "Campaign Matrix", matrizDesc: "Distribución del gasto vs rendimiento", escalar: "ESTRELLAS (Escalar)", apagar: "BASURA (Apagar)", observar: "DUDOSOS (Observar)", potenciales: "POTENCIALES (Testear)", abrirAud: "Ver reporte", thCliente: "Cliente / Cuenta", thFecha: "Fecha", thEstado: "Estado", thAccion: "Acción", cuentaSinNombre: "Cuenta sin nombre", ingresos: "Ingresa los datos", buzonSug: "Buzón de sugerencias", facturacionTitulo: "Facturación y Planes", facturacionDesc: "Administrá tu suscripción", planActual: "Plan Actual", activa: "Active", gestionarSuscripcion: "Gestionar suscripción", pronto: "Pronto", ayudanos: "Ayudanos a mejorar", bug: "¿Encontraste un error?", escribiSug: "Escribí tu sugerencia aquí...", enviando: "Enviando...", enviarSug: "Enviar Sugerencia", persPdf: "Personalización de Marca Blanca", nomAgencia: "Nombre de Agencia", sitioWeb: "Sitio Web", logoPdf: "PDF Logo", subeLogo: "Subir", piePagina: "Pie de página legal", preferencias: "Preferencias Regionales", monedaDef: "Moneda Base", metricaDef: "Métrica Principal", guardando: "Guardando...", guardarAj: "Guardar Ajustes", puntajeBasado: "Puntaje en base a ineficiencias del presupuesto.", ingresaDatos: "Completá los datos de la campaña a auditar.", presupuestoObj: "Presupuesto Mensual", placeholderPres: "Ej: 1000", gastoAct: "Gasto actual", placeholderGasto: "Ej: 450", conversiones: "Conversiones", cparoas: "CPA / ROAS Actual", tipoCamp: "Campaign Type", contexto: "Context y Notas", placeholderConv: "Ej: 120", placeholderContexto: "Añadí contexto extra para la IA.", monitoreo: "Monitoreo", tenes: "Tenés", registradas: "cuentas registradas.", todos: "Todos", criticos: "Críticos", atencion: "Atención", optimos: "Óptimos", thTendencia: "Tendencia", volver: "Volver atrás", detalleCliente: "Detalle del Cliente" },
    en: { dashboard: "Dashboard", panelPrin: "Main Dashboard", panelDesc: "Global overview of your accounts performance.", saludG: "Avg Health Score", totAud: "Total Accounts", fugasDet: "Critical Leaks", oporMej: "Opportunities", ultAud: "Recent Audits", actRec: "Recent Activity", verTodas: "View all →", generada: "Audit generated for", hace: "Ago", afectaA: "Mainly affecting", buscarGlobal: "Search account by name...", nueva: "AI Auditor", clientes: "Client Dashboard", reportes: "Reports", feedback: "Feedback", configuracion: "Settings", facturacion: "Billing", salir: "Sign Out", placeholderNombre: "Client or Account Name", btnAnalizar: "Run Audit", btnAnalizando: "Analyzing metrics...", exportar: "Export to PDF", score: "Score", problemas: "Critical Issues", mejoras: "Weak Areas", aciertos: "Strengths", login: "Log In", tabDiag: "AI Diagnosis", tabCheck: "Action Plan", tabAvanzado: "Advanced Analysis", autoApply: "Auto-Apply", msgAutoApply: "Coming soon", pacingTit: "Budget Pacing", pacingDesc: "Projected spend rhythm", matrizTit: "Campaign Matrix", matrizDesc: "Spend distribution vs performance", escalar: "STARS (Scale)", apagar: "TRASH (Pause)", observar: "DOUBTFUL (Observe)", potenciales: "POTENCIALES (Test)", abrirAud: "View report", thCliente: "Client / Account", thFecha: "Date", thEstado: "Status", thAccion: "Action", cuentaSinNombre: "Unnamed Account", ingresos: "Enter details", buzonSug: "Suggestion Box", facturacionTitulo: "Billing and Plans", facturacionDesc: "Manage your subscription", planActual: "Current Plan", activa: "Active", gestionarSuscripcion: "Manage subscription", pronto: "Soon", ayudanos: "Help us improve", bug: "Found a bug?", escribiSug: "Write your suggestion here...", enviando: "Sending...", enviarSug: "Send Suggestion", persPdf: "White Label Customization", nomAgencia: "Agency Name", sitioWeb: "Website", logoPdf: "PDF Logo", subeLogo: "Upload", piePagina: "Legal Footer", preferences: "Regional Preferences", monedaDef: "Base Currency", metricaDef: "Main Metric", guardando: "Saving...", guardarAj: "Save Settings", puntajeBasado: "Score based on budget inefficiencies.", ingresaDatos: "Fill in the details for the campaign audit.", presupuestoObj: "Monthly Budget", placeholderPres: "E.g. 1000", gastoAct: "Current Spend", placeholderGasto: "E.g. 450", conversiones: "Conversions", cparoas: "Current CPA / ROAS", tipoCamp: "Campaign Type", contexto: "Context & Notes", placeholderConv: "E.g. 120", placeholderContexto: "Add extra context for the AI.", monitoreo: "Monitoring", tenes: "You have", registradas: "accounts registered.", todos: "All", criticos: "Critical", atencion: "Warning", optimos: "Optimal", thTendencia: "Trend", volver: "Go Back", detalleCliente: "Client Details" }
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

  useEffect(() => {
    if (!pacingToast.show || pacingToast.status !== "success") return;
    if (pacingToast.timeLeft <= 0) {
      setPacingToast(prev => ({ ...prev, show: false }));
      setPacingUndo(null);
      return;
    }
    const timer = setTimeout(() => {
      setPacingToast(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [pacingToast.show, pacingToast.status, pacingToast.timeLeft]);

  const confirmarAccionPacing = () => {
    if (!pacingAccionPendiente) return;
    const { campanaId, campanaNombre, valorAnterior, valorPropuesto } = pacingAccionPendiente;
    const safePlan = createSafeApplyPlan({
      id: `pacing-${campanaId}-${Date.now()}`,
      title: `Ajuste de presupuesto: ${campanaNombre}`,
      scope: "budget",
      risk: "medio",
      reason: pacingAccionPendiente.motivo,
      expectedImpact: pacingAccionPendiente.impacto,
      changes: [{
        targetId: campanaId,
        targetName: campanaNombre,
        field: "presupuesto_mensual",
        before: valorAnterior,
        after: valorPropuesto,
        reason: pacingAccionPendiente.motivo,
      }],
    });
    const result = executeLocalSafeApply(campanas, safePlan);
    setCampanas(result.entities);
    setSafeApplyAuditLog(prev => [result.audit, ...prev].slice(0, 20));
    setPacingUndo(result.status === "aplicado" ? safePlan : null);
    setPacingAccionPendiente(null);
    setPacingToast({
      show: true,
      status: result.status === "requiere_revision" ? "review" : result.status === "cancelado" ? "reverted" : "success",
      timeLeft: result.status === "aplicado" ? 10 : 0,
      message: result.status === "aplicado" ? `Presupuesto ajustado para ${campanaNombre}.` : result.message,
    });
  };

  const deshacerAccionPacing = () => {
    if (!pacingUndo) return;
    setPacingToast(prev => ({ ...prev, status: "undoing", message: "Deshaciendo cambio..." }));
    setTimeout(() => {
      const result = rollbackLocalSafeApply(campanas, pacingUndo);
      setCampanas(result.entities);
      setSafeApplyAuditLog(prev => [result.audit, ...prev].slice(0, 20));
      setPacingUndo(null);
      setPacingToast({ show: true, status: "reverted", timeLeft: 0, message: result.message });
      setTimeout(() => setPacingToast(prev => ({ ...prev, show: false })), 2000);
    }, 800);
  };

  const crearPlanSeguroRobin = (robin: ReturnType<typeof calcularPlanRobinHood>): SafeApplyPlan | null => {
    if (!robin.aplica || !robin.destino) return null;
    const cambiosOrigen: SafeApplyChange[] = robin.origenes.map(origen => ({
      targetId: origen.campana_id,
      targetName: origen.nombre,
      field: "presupuesto_mensual",
      before: origen.presupuesto_actual,
      after: origen.presupuesto_propuesto,
      reason: origen.motivo,
    }));
    const cambioDestino: SafeApplyChange = {
      targetId: robin.destino.campana_id,
      targetName: robin.destino.nombre,
      field: "presupuesto_mensual",
      before: robin.destino.presupuesto_actual,
      after: robin.destino.presupuesto_propuesto,
      reason: robin.destino.motivo,
    };

    return createSafeApplyPlan({
      id: `robin-hood-${Date.now()}`,
      title: "Reasignación Robin Hood",
      scope: "budget",
      risk: robin.confianza === "alta" ? "medio" : "alto",
      reason: robin.justificacion,
      expectedImpact: `+${robin.proyeccion.conversiones_extra_mensuales} conversiones/mes estimadas y ${robin.proyeccion.reduccion_cpa_global_pct}% menos CPA global.`,
      changes: [...cambiosOrigen, cambioDestino],
    });
  };

  const confirmarAccionRobin = () => {
    if (!robinAccionPendiente) return;
    const result = executeLocalSafeApply(campanas, robinAccionPendiente);
    setCampanas(result.entities);
    setSafeApplyAuditLog(prev => [result.audit, ...prev].slice(0, 20));
    setPacingUndo(result.status === "aplicado" ? robinAccionPendiente : null);
    setRobinAccionPendiente(null);
    setPacingToast({
      show: true,
      status: result.status === "requiere_revision" ? "review" : result.status === "cancelado" ? "reverted" : "success",
      timeLeft: result.status === "aplicado" ? 10 : 0,
      message: result.status === "aplicado" ? "Reasignación Robin Hood aplicada y verificada." : result.message,
    });
  };

  const obtenerPerfil = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const { data: userProfile } = await supabase.from('suscripciones').select('*').eq('user_id', userId).maybeSingle();
    setPerfil(userProfile);
    const { data: configAgencia } = await supabase.from('configuracion_agencia').select('*').eq('user_id', userId).maybeSingle();
    if (configAgencia) {
      if (configAgencia.agencia_nombre) setAgenciaNombre(configAgencia.agencia_nombre);
      if (configAgencia.agencia_logo) setAgenciaLogo(configAgencia.agencia_logo);
      if (configAgencia.agencia_web) setAgenciaWeb(configAgencia.agencia_web);
      if (configAgencia.agencia_pie) setAgenciaPie(configAgencia.agencia_pie);
    }
  };
  const cargarHistorial = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setCargandoHistorial(true);
    const { data: registros, error } = await supabase
      .from('historial_auditorias')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && registros) setHistorial(registros);
    setCargandoHistorial(false);
  };

  const borrarAuditoria = async (id: number | string) => {
    if (!window.confirm("¿Seguro que querés eliminar esta auditoría? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from('historial_auditorias').delete().eq('id', id);
    if (!error) {
      setHistorial(historial.filter((item) => item.id !== id));
      setComparacionIds((prev) => prev.filter((cid) => cid !== id));
      if (auditoriaActivaId === id) setAuditoriaActivaId(null);
      if (vista === "reporte_lectura") navegar("historial", "/reportes");
    } else {
      alert("Error al eliminar la auditoría.");
    }
  };

  const toggleTarea = (index: number) => {
    if (tareasCompletadas.includes(index)) { setTareasCompletadas(tareasCompletadas.filter(i => i !== index)); } 
    else { setTareasCompletadas([...tareasCompletadas, index]); }
  };
  
  const cargarCampanas = async () => {
    setCargandoCampanas(true);
    try {
      const datos = await extraerDatosGoogle();
      setCampanas(datos);
    } catch (error) {
      console.error("Error al extraer los datos de Google Ads:", error);
    } finally {
      setCargandoCampanas(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      obtenerPerfil();
      cargarCampanas();
      void verificarConexionGoogleAds(session.user.id);
    }
    if (vista === "historial" || vista === "dashboard" || vista === "reporte_lectura")
      cargarHistorial();
    if ((vista === "historial" || vista === "reporte_lectura") && session)
      void cargarUsoMensual();
  }, [vista, session]);

  useEffect(() => {
    if (deepLinkAuditoriaHandled.current || cargandoHistorial || historial.length === 0)
      return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    const item = historial.find((h) => String(h.id) === id);
    if (item) {
      deepLinkAuditoriaHandled.current = true;
      abrirAuditoriaHistorial(item, { updateUrl: false });
    }
  }, [cargandoHistorial, historial]);

  const cerrarSesion = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await supabase.auth.signOut();
    window.location.href = "/";
  };
  
  const subirLogo = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const userId = session?.user?.id;
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      setAgenciaLogo(data.publicUrl);
    } catch (error) { console.error("Error subiendo logo:", error); alert("Error al subir imagen."); } finally { setUploading(false); }
  };

  const guardarAjustesAgencia = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.from('configuracion_agencia').upsert({
      user_id: userId,
      agencia_nombre: agenciaNombre,
      agencia_logo: agenciaLogo,
      agencia_web: agenciaWeb,
      agencia_pie: agenciaPie,
      idioma_ui: locale,
      resumen_auto_abrir: resumenAutoAbrir,
    });
    if (error) throw error;
    await obtenerPerfil();
    setLoading(false);
  };

  const abrirGeneradorAnuncios = (ctx: AdGeneratorContext) => {
    setAdGeneratorContext(ctx);
  };

  const cerrarPanelesHerramientas = () => {
    setPanelIntroResumen(null);
  };

  const abrirHerramientaDesdeDetalle = (idRastreo: string) => {
    if (vista === "reporte_lectura") return;

    const accion = resolverAccionHallazgo(idRastreo);
    setPanelIntroResumen(accion);
    switch (accion) {
      case "destripador":
        if (destripadorReporte) setDestripadorAbierto(true);
        break;
      case "dayparting":
        if (daypartingReporte) setDaypartingAbierto(true);
        break;
      case "simulador":
        if (simuladorReporte) setSimuladorAbierto(true);
        break;
      default:
        break;
    }
  };

  const handleResolverDesdeResumen = (item: ItemResumenHallazgo) => {
    if (vista === "reporte_lectura") return;

    setResumenFacilAbierto(false);
    const accion = resolverAccionHallazgo(item.id_rastreo);
    setPanelIntroResumen(accion);
    const reporte = auditoriaResumen?.reporte_json;

    switch (accion) {
      case "destripador":
        if (destripadorReporte) setDestripadorAbierto(true);
        else abrirDetalleHallazgo(item, item.tipo, reporte);
        break;
      case "dayparting":
        if (daypartingReporte) setDaypartingAbierto(true);
        else abrirDetalleHallazgo(item, item.tipo, reporte);
        break;
      case "simulador":
        if (simuladorReporte) setSimuladorAbierto(true);
        else abrirDetalleHallazgo(item, item.tipo, reporte);
        break;
      case "robin_hood":
        document.getElementById("robin-hood-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      default:
        abrirDetalleHallazgo(item, item.tipo, reporte);
    }
  };

  const abrirDetalleHallazgo = (hallazgo: any, tipo: TipoHallazgo, reporteData: any) => {
    if (vista === "reporte_lectura") return;

    if (hallazgo?.id_rastreo === "DAYPARTING_FUGAS_HORARIAS" && reporteData?.dayparting) {
      setDaypartingAbierto(true);
      return;
    }
    if (hallazgo?.id_rastreo === "GENERADOR_NEGATIVOS_URGENTE" && reporteData?.destripador) {
      setDestripadorAbierto(true);
      return;
    }
    if (hallazgo?.id_rastreo === "SIMULADOR_PRESUPUESTO" && reporteData?.simulador_presupuesto) {
      setSimuladorAbierto(true);
      return;
    }
    const keywords_prob = reporteData?.keywords_problematicas || [];
    const keywords_sug = reporteData?.keywords_sugeridas || [];
    const esSaludable = tipo === "saludable" || hallazgo.sin_accion_requerida === true;
    const textoRazonamiento =
      hallazgo.razonamiento ||
      hallazgo.pitch_vendedor ||
      (esSaludable
        ? undefined
        : reporteData?.pitch_vendedor) ||
      (esSaludable
        ? "La campaña rinde dentro del objetivo configurado."
        : "Esta optimización corta la hemorragia de presupuesto y redirige la inversión hacia tráfico con verdadera intención de compra.");
    setDetalleHallazgo({
      id_rastreo: hallazgo.id_rastreo,
      titulo: hallazgo.titulo || (esSaludable ? "Campaña en buen estado" : "Oportunidad detectada"),
      nivel_salud: hallazgo.nivel_salud as NivelSalud | undefined,
      tipo,
      problema_detalle:
        hallazgo.problema_detalle ||
        hallazgo.descripcion ||
        hallazgo.descripcion_simple ||
        hallazgo.descripcion_tecnica ||
        (esSaludable
          ? "No se detectaron cambios urgentes en esta campaña."
          : "Se detectó una ineficiencia técnica en la configuración de la campaña."),
      descripcion_simple: hallazgo.descripcion_simple,
      descripcion_tecnica: hallazgo.descripcion_tecnica,
      sugerencia:
        hallazgo.sugerencia ||
        (esSaludable ? "No hace falta cambiar nada por ahora." : "Aplicar las correcciones recomendadas en Google Ads."),
      razonamiento: textoRazonamiento,
      resultado_esperado:
        hallazgo.resultado_esperado ||
        (esSaludable
          ? "Mantener el rendimiento actual sin cambios obligatorios."
          : "Ahorro inmediato y mejora del CTR."),
      nota_escala_opcional: hallazgo.nota_escala_opcional ?? null,
      sin_accion_requerida: esSaludable,
      items:
        keywords_prob.length > 0
          ? keywords_prob
          : [{ nombre: "Sin datos de keywords disponibles", gasto: "-", clics: 0, conversiones: 0 }],
      sugerencias:
        keywords_sug.length > 0
          ? keywords_sug.map((k: { keyword: string; razon: string; cpc_estimado?: string }) => ({
              keyword: k.keyword,
              razon: `${k.razon}${k.cpc_estimado ? " · CPC est. " + k.cpc_estimado : ""}`,
            }))
          : [],
      reporteData,
    });
    setIsClosing(false);
  };

  const getDashboardStatus = (score: number) => {
    if (score < 50) return { label: "Crítico", color: "text-[#E66767]", bgTints: "bg-[#E66767]/10", hex: "#E66767", icon: AlertTriangle, msg: "Atención urgente requerida" };
    if (score < 80) return { label: "Atención", color: "text-[#EAB308]", bgTints: "bg-[#EAB308]/10", hex: "#EAB308", icon: Zap, msg: "Métricas bajo observación" };
    return { label: "Óptimo", color: "text-[#10B981]", bgTints: "bg-[#10B981]/10", hex: "#10B981", icon: CheckCircle2, msg: "Cuentas estables y sanas" };
  };

  const clientesFiltrados = historial.filter(item => {
    const coincideFiltro = filtroEstado === "todos" || (filtroEstado === "critico" && item.score < 50) || (filtroEstado === "atencion" && item.score >= 50 && item.score < 80) || (filtroEstado === "optimo" && item.score >= 80);
    const nombreSeguro = item.nombre_cuenta || t[idioma].cuentaSinNombre;
    const coincideBusqueda = nombreSeguro.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const comparacionSeleccionadas = useMemo(
    () => historial.filter((h) => comparacionIds.includes(h.id)),
    [historial, comparacionIds]
  );

  const comparacionMismaCuenta = useMemo(
    () => comparacionEsMismaCuenta(comparacionSeleccionadas),
    [comparacionSeleccionadas]
  );

  const auditoriaActiva = useMemo(
    () =>
      auditoriaActivaId != null
        ? historial.find((h) => h.id === auditoriaActivaId) ?? null
        : null,
    [historial, auditoriaActivaId]
  );

  const handleDescargarPdfHistorial = async (item: {
    id: number | string;
    nombre_cuenta?: string | null;
    created_at?: string;
  }) => {
    if (pdfDescargandoId !== null) return;
    setPdfDescargandoId(item.id);
    try {
      await downloadAuditPdf(
        String(item.id),
        buildPdfFilename(item.nombre_cuenta || "Cuenta", item.created_at)
      );
      void cargarUsoMensual();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo exportar el PDF.");
    } finally {
      setPdfDescargandoId(null);
    }
  };

  const handleDescargarComparacionPdf = async (idA: number | string, idB: number | string) => {
    if (pdfExportDisabled || pdfComparacionCargando) return;
    setPdfComparacionCargando(true);
    try {
      await downloadComparacionPdf(idA, idB);
      void cargarUsoMensual();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo exportar el PDF de comparación.");
    } finally {
      setPdfComparacionCargando(false);
    }
  };

  const toggleComparacionHistorial = (id: number | string) => {
    if (comparacionIds.includes(id)) {
      setComparacionIds(comparacionIds.filter((cid) => cid !== id));
      setHintComparacionMax(false);
      return;
    }
    if (comparacionIds.length >= 2) {
      setHintComparacionMax(true);
      return;
    }
    setComparacionIds([...comparacionIds, id]);
    setHintComparacionMax(false);
  };

  const abrirAuditoriaHistorial = (
    item: (typeof historial)[number],
    options?: { updateUrl?: boolean }
  ) => {
    setDetalleHallazgo(null);
    setDestripadorAbierto(false);
    setDaypartingAbierto(false);
    setSimuladorAbierto(false);
    setResumenFacilAbierto(false);
    cerrarPanelesHerramientas();
    setAuditoriaActivaId(item.id);
    setReporte(item.reporte_json);
    setNombreCuenta(item.nombre_cuenta || "Sin nombre");
    setSubVistaReporte("diagnostico");
    setVista("reporte_lectura");
    if (options?.updateUrl !== false) {
      window.history.pushState(
        null,
        "",
        `/reportes?id=${encodeURIComponent(String(item.id))}`
      );
    }
  };

  const volverAlHistorialReportes = () => {
    setAuditoriaActivaId(null);
    setReporte(null);
    deepLinkAuditoriaHandled.current = false;
    navegar("historial", "/reportes");
  };

  const compararConAnteriorHistorial = (item: (typeof historial)[number]) => {
    const accountAudits = historial.filter(
      (h) => h.nombre_cuenta === item.nombre_cuenta
    );
    const idx = accountAudits.findIndex((h) => h.id === item.id);
    if (idx === -1 || idx + 1 >= accountAudits.length) return;
    const anterior = accountAudits[idx + 1];
    setComparacionIds([anterior.id, item.id]);
    setHintComparacionMax(false);
    setVistaComparacion(true);
  };

  const iniciarComparacionHistorial = () => {
    if (comparacionIds.length !== 2 || !comparacionMismaCuenta) return;
    setVistaComparacion(true);
  };

  const totalAuditorias = historial.length;
  
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
  
  const fugasIndividuales = ultimaAuditoria?.reporte_json?.hallazgos?.graves_rojo?.length || 0;
  const oportunidadesIndividuales = ultimaAuditoria?.reporte_json?.hallazgos?.debiles_amarillo?.length || 0;

  const scoreHistorico = historial.slice(0, 8).reverse().map((h: any) => h.score);
  const fechasHistorico = historial.slice(0, 8).reverse().map((h: any) => h.created_at || '');

  const textoUltimaAuditoria = useMemo(
    () => formatearUltimaAuditoria(ultimaAuditoria?.created_at),
    [ultimaAuditoria?.created_at]
  );
  const badgeUltimaAuditoria = useMemo(
    () => getBadgeAuditoria(ultimaAuditoria?.created_at),
    [ultimaAuditoria?.created_at]
  );

  const destripadorReporte: DestripadorReporte | null =
    auditoriaContextual?.reporte_json?.destripador || null;
  const nGramaLegacy = auditoriaContextual?.reporte_json?.n_gramas || null;

  const daypartingReporte: DaypartingReporte | null =
    auditoriaContextual?.reporte_json?.dayparting?.heatmap
      ? (auditoriaContextual.reporte_json.dayparting as DaypartingReporte)
      : null;

  const simuladorReporte: SimuladorPresupuestoReporte | null =
    auditoriaContextual?.reporte_json?.simulador_presupuesto ?? null;

  const escenarioSimRecomendado = useMemo(() => {
    if (!simuladorReporte) return null;
    return (
      simuladorReporte.escenarios.find(
        e => e.id === simuladorReporte.escenario_recomendado_id
      ) ?? simuladorReporte.escenarios[1]
    );
  }, [simuladorReporte]);

  const franjasDaypartingPendientes = useMemo(() => {
    if (!daypartingReporte) return 0;
    return daypartingReporte.franjas_problematicas.filter(
      f => !daypartingAplicadosIds.has(f.id)
    ).length;
  }, [daypartingReporte, daypartingAplicadosIds]);

  const ahorroDaypartingPendiente = useMemo(() => {
    if (!daypartingReporte) return 0;
    return Math.round(
      daypartingReporte.franjas_problematicas
        .filter(f => !daypartingAplicadosIds.has(f.id))
        .reduce((acc, f) => acc + f.gasto_desperdiciado, 0)
    );
  }, [daypartingReporte, daypartingAplicadosIds]);

  const ahorroMensualDayparting = useMemo(() => {
    if (!daypartingReporte) return 0;
    return Math.round(
      daypartingReporte.ahorro_mensual_estimado ??
        daypartingReporte.patron_principal?.ahorro_mensual_estimado ??
        ahorroDaypartingPendiente
    );
  }, [daypartingReporte, ahorroDaypartingPendiente]);

  const terminosPendientesDestripador = useMemo(() => {
    if (!destripadorReporte) return [];
    return destripadorReporte.terminos.filter(
      t =>
        !t.protegido &&
        !mitigadosKeys.has(terminoKey(t)) &&
        !copiadosKeys.has(terminoKey(t))
    );
  }, [destripadorReporte, mitigadosKeys, copiadosKeys]);

  const terminosCopiadosDestripador = useMemo(() => {
    if (!destripadorReporte) return [];
    return destripadorReporte.terminos.filter(
      t =>
        !t.protegido &&
        copiadosKeys.has(terminoKey(t)) &&
        !mitigadosKeys.has(terminoKey(t))
    );
  }, [destripadorReporte, mitigadosKeys, copiadosKeys]);

  const terminosAplicadosDestripador = useMemo(() => {
    if (!destripadorReporte) return [];
    return destripadorReporte.terminos.filter(
      t => !t.protegido && mitigadosKeys.has(terminoKey(t))
    );
  }, [destripadorReporte, mitigadosKeys]);

  const ahorroPendienteDestripador = useMemo(
    () => terminosPendientesDestripador.reduce((acc, t) => acc + t.gasto, 0),
    [terminosPendientesDestripador]
  );

  const ahorroNGramas = Math.round(
    destripadorReporte
      ? ahorroPendienteDestripador
      : nGramaLegacy?.ahorro_estimado ?? 0
  );
  const palabrasBasura =
    destripadorReporte?.cantidad_palabras_basura ?? nGramaLegacy?.cantidad_palabras ?? 0;
  const terminosNegativizables = terminosPendientesDestripador.length;
  const cantidadCopiadosDestripador = terminosCopiadosDestripador.length;
  const cantidadAplicadosDestripador = terminosAplicadosDestripador.length;

  const handleDestripadorMitigar = (keys: string[], planId?: string) => {
    const auditId = auditoriaContextual?.id;
    if (auditId == null) return;
    setDestripadorEstado(marcarTerminosMitigados(auditId, keys, planId));
    setToastState({ show: true, status: 'success', timeLeft: 5 });
  };

  const handleDestripadorCopiar = (keys: string[]) => {
    const auditId = auditoriaContextual?.id;
    if (auditId == null) return;
    setDestripadorEstado(marcarTerminosCopiados(auditId, keys));
  };

  const handleDaypartingAplicar = (franjaIds: string[], planId?: string) => {
    const auditId = auditoriaContextual?.id;
    if (auditId == null) return;
    setDaypartingEstado(marcarFranjasAplicadas(auditId, franjaIds, planId));
    setToastState({ show: true, status: "success", timeLeft: 5 });
  };

  if (status === "loading") return (
    <div className="h-screen w-full flex justify-center items-center bg-[#FDE8D3]">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#0a0a0a] text-4xl shadow-lg bg-[#E0E7FF] animate-pulse">M</div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700;900&display=swap');
        
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: ${!session ? '#FDE8D3' : '#0a0a0a'} !important; 
          color: #0a0a0a; 
        }

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

        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; height: auto !important; }
          @page { margin: 15mm; }
          .print-container { height: auto !important; overflow: visible !important; position: static !important; }
          @keyframes shrinkBar { from { width: '100%'; } to { width: '0%'; } }
          .animate-shrink-bar { animation: shrinkBar 9.5s linear forwards; }
        }

        @keyframes fadeInCustom { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-custom { animation: fadeInCustom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #44403C; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #A8A29E; }

        @keyframes shrinkBar { from { width: '100%'; } to { width: '0%'; } }
        .animate-shrink-bar { animation: shrinkBar 9.5s linear forwards; }

      `}} />

      <div style={{ zoom: 0.75 }} className={`flex h-[133.33vh] w-full font-sans overflow-hidden print-container relative ${!session ? "bg-[#FDE8D3] selection:bg-[#E0E7FF] selection:text-[#0a0a0a]" : "bg-[#0a0a0a] selection:bg-[#F3C3B2] selection:text-[#0a0a0a]"}`}>
        
        {!session && <AuditWireframeBackground />}

        {!session ? (
          <div className="w-full h-full overflow-y-auto overflow-x-hidden relative z-10 text-[#0a0a0a]">
            <nav className="w-full max-w-[1600px] mx-auto px-8 md:px-10 py-8 flex justify-between items-center z-50 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[#0a0a0a] text-2xl shadow-sm bg-[#E0E7FF]">M</div>
                <span className="font-bold text-2xl tracking-tight text-[#0a0a0a]">Mora Analytics</span>
              </div>
              <div className="hidden md:flex items-center gap-8 font-medium text-[#4B5563]">
                <Link href="/como-funciona" className="hover:text-[#0a0a0a] transition-colors">Cómo funciona</Link>
                <Link href="/precios" className="hover:text-[#0a0a0a] transition-colors">Precios</Link>
                <Link href="/faq" className="hover:text-[#0a0a0a] transition-colors">FAQ</Link>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setLocale(idioma === "es" ? "en" : "es")} className="text-sm font-bold text-[#4B5563] hover:text-[#0a0a0a] transition-colors uppercase hidden sm:block">
                  {idioma}
                </button>
                <button onClick={iniciarSesion} className="bg-[#0a0a0a] text-[#FDE8D3] px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0a0a0a]/90 transition-colors shadow-lg border border-[#0a0a0a]">
                  {t[idioma].login}
                </button>
              </div>
            </nav>

            <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-32 overflow-hidden z-10 px-8 md:px-10 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center min-h-[75vh]">
              <FadeInOnScroll>
                <div className="flex flex-col items-start text-left lg:pr-10">
                  <div className="border border-[#CFD6C4]/80 bg-[#CFD6C4]/30 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 flex items-center gap-3 text-[#0a0a0a]">
                    <span className="w-2 h-2 rounded-full bg-[#E0E7FF] animate-pulse"></span>
                    Análisis con IA
                  </div>
                  <h1 className="text-[3.5rem] md:text-6xl lg:text-[4rem] font-serif text-[#0a0a0a] font-black leading-[1.1] mb-6 tracking-tight">
                    Detectá <br className="hidden lg:block" />
                    <span className="italic text-[#C4614A]">fugas de dinero</span> <br className="hidden lg:block" />
                    en tus campañas de Google&nbsp;Ads.
                  </h1>
                  <p className="text-[#4B5563] text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
                    Subí tu reporte de Google Ads y dejá que nuestra IA audite el gasto con precisión quirúrgica. Resultados en segundos.
                  </p>
                  <button onClick={iniciarSesion} className="bg-[#C4614A] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:bg-[#a84c38] transition-all shadow-[0_10px_30px_rgba(196,97,74,0.4)] flex items-center justify-center w-full sm:w-auto">
                    Comenzar prueba gratis
                  </button>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8 text-[13px] text-[#4B5563] font-semibold w-full">
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]" strokeWidth={3} /> Sin tarjeta de crédito</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]" strokeWidth={3} /> Solo subís un CSV</span>
                     <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#10B981]" strokeWidth={3} /> Cancelá cuando quieras</span>
                  </div>
                </div>
              </FadeInOnScroll>

              <FadeInOnScroll delay={200}>
                <div className="relative w-full h-[500px] lg:h-[650px] flex justify-center items-center mt-10 lg:mt-0 perspective-1000">
                   <div className="relative w-full max-w-md lg:max-w-lg transform-style-3d transition-transform duration-[1000ms] hover:rotate-x-[-5deg] rotate-x-[15deg]">
                     
                      <div className="absolute top-[-60px] left-[-80px] w-72 bg-white/60 backdrop-blur-md border border-[#CFD6C4]/60 shadow-[0_20px_40px_rgba(207,214,196,0.3)] rounded-2xl p-7 translate-z-[-60px]">
                         <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest mb-4">Gasto Diario</p>
                         <div className="flex items-end gap-2 h-24 opacity-80">
                           {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                              <div key={i} className="flex-1 bg-[#10B981]/40 rounded-t-sm" style={{height: `${h}%`}}></div>
                           ))}
                         </div>
                      </div>

                      <div className="absolute top-[30px] left-[-110px] z-30 bg-white/95 backdrop-blur-xl border border-[#CFD6C4]/80 shadow-[0_15px_30px_rgba(38,43,39,0.1)] rounded-2xl p-5 translate-z-[50px] w-56 hidden md:block">
                          <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest mb-3">Resumen de IA</p>
                          <div className="space-y-2">
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#0a0a0a]">Fugas críticas:</span> <span className="text-xs font-black text-[#E66767]">3</span></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#0a0a0a]">Oportunidades:</span> <span className="text-xs font-black text-[#EAB308]">5</span></div>
                              <div className="border-t border-[#CFD6C4]/50 pt-2 mt-2 flex justify-between items-center"><span className="text-xs font-bold text-[#0a0a0a]">Ahorro est.:</span> <span className="text-sm font-black text-[#10B981]">$850/m</span></div>
                          </div>
                      </div>

                      <div className="relative z-10 w-full bg-white/95 backdrop-blur-2xl border border-[#CFD6C4]/80 shadow-[0_30px_60px_rgba(38,43,39,0.15)] rounded-[2rem] p-8 translate-z-[0px]">
                         <div className="flex justify-between items-center mb-6 border-b border-[#CFD6C4]/50 pb-4">
                            <p className="font-bold text-[#0a0a0a] flex items-center gap-2 text-lg"><LayoutGrid size={20}/> Rendimiento</p>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#DAEBE3]/50 text-[#0a0a0a] px-3 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#DAEBE3] border border-[#0a0a0a]/20 animate-pulse"></span> Search
                            </span>
                         </div>
                         <div className="flex justify-center items-center flex-col py-2 mb-6">
                            <p className="text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-3">Score de Salud</p>
                            <div className="w-32 h-32 rounded-full flex items-center justify-center border-[8px] border-[#FDE8D3] text-5xl font-black text-[#0a0a0a] shadow-inner bg-[#DAEBE3]">
                              84
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#FDE8D3]/50 p-5 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">Gasto Total</p>
                               <p className="text-3xl font-black text-[#0a0a0a]">$8.2k</p>
                            </div>
                            <div className="bg-[#FDE8D3]/50 p-5 rounded-xl border border-[#CFD6C4]/40">
                               <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">Conversiones</p>
                               <p className="text-3xl font-black text-[#0a0a0a]">142</p>
                            </div>
                         </div>
                      </div>

                      <div className="absolute bottom-[-50px] right-[-60px] z-20 w-80 bg-white/95 backdrop-blur-xl border border-[#E66767]/40 shadow-[0_20px_40px_rgba(230,103,103,0.15)] rounded-2xl p-6 translate-z-[80px]">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#E66767]/10 flex items-center justify-center flex-shrink-0 border border-[#E66767]/30">
                               <AlertTriangle size={24} className="text-[#E66767]" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-[#E66767] leading-tight mb-1">Fuga Crítica Detectada</p>
                               <p className="text-xs text-[#4B5563] font-medium">Keywords irrelevantes</p>
                               <span className="inline-block mt-3 text-sm font-black text-white bg-[#E66767] px-3 py-1.5 rounded-md shadow-sm">-$620 / mes</span>
                            </div>
                         </div>
                      </div>

                      <div className="absolute top-[-25px] right-[20px] z-30 bg-[#DAEBE3] text-[#0a0a0a] px-4 py-2 rounded-full font-bold text-[10px] uppercase shadow-lg border border-[#CFD6C4] translate-z-[40px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#0a0a0a] rounded-full animate-pulse"></span> Análisis listo
                      </div>

                      <div className="absolute bottom-[80px] left-[-50px] z-30 bg-[#10B981] text-[#0a0a0a] p-5 rounded-2xl shadow-[0_15px_30px_rgba(153,205,216,0.6)] translate-z-[60px] flex flex-col border border-[#CFD6C4]">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">ROAS Proyectado</p>
                        <p className="text-3xl font-black flex items-center gap-1"><TrendingUp size={20} strokeWidth={4}/> +12.4%</p>
                      </div>

                   </div>
                </div>
              </FadeInOnScroll>
            </section>

            <FadeInOnScroll delay={100}>
              <section className="max-w-[1600px] mx-auto px-8 md:px-10 py-24 border-t border-[#CFD6C4]/40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12 items-end">
                   <div className="lg:col-span-1">
                     <p className="inline-block px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase text-[#0a0a0a] bg-[#10B981]/40 mb-4">Cómo funciona</p>
                     <h2 className="text-4xl md:text-5xl font-serif font-black text-[#0a0a0a] leading-tight">Optimización en<br/>3 pasos.</h2>
                   </div>
                   <div className="lg:col-span-2">
                     <p className="text-lg text-[#4B5563] lg:max-w-xl font-medium">Exportás tu reporte de Google Ads, lo subís, y en menos de 2 minutos tenés el diagnóstico completo listo para actuar.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#CFD6C4] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#CFD6C4]/40 flex items-center justify-center text-[#0a0a0a] mb-6 group-hover:scale-110 transition-transform"><Upload size={24} /></div>
                      <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">1. Exportá</h3>
                      <p className="text-[#4B5563] leading-relaxed font-medium">Descargá el reporte de keywords desde Google Ads en formato CSV.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#10B981] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#10B981]/40 flex items-center justify-center text-[#0a0a0a] mb-6 group-hover:scale-110 transition-transform"><Search size={24} /></div>
                      <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">2. Diagnosticá</h3>
                      <p className="text-[#4B5563] leading-relaxed font-medium">La IA detecta automáticamente los puntos exactos de desperdicio de dinero.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-8 rounded-[2rem] hover:bg-white hover:border-[#E0E7FF] transition-all shadow-sm group">
                      <div className="w-14 h-14 rounded-2xl bg-[#E0E7FF]/40 flex items-center justify-center text-[#0a0a0a] mb-6 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                      <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">3. Ejecutá</h3>
                      <p className="text-[#4B5563] leading-relaxed font-medium">Aplicá las recomendaciones directamente en Google Ads con guías paso a paso.</p>
                   </div>
                </div>
              </section>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <section className="max-w-[1600px] mx-auto px-8 md:px-10 py-24 border-t border-[#CFD6C4]/40">
                <div className="text-center mb-16">
                  <p className="inline-block px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase text-[#0a0a0a] bg-[#DAEBE3] mb-4">Precios Simples</p>
                  <h2 className="text-4xl md:text-5xl font-serif font-black text-[#0a0a0a] mb-4">Elegí tu camino.</h2>
                  <p className="text-[#4B5563] font-medium">Todos los planes incluyen 14 días de prueba gratis. Cancelá cuando quieras.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#DAEBE3] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(218,235,227,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Starter</h3>
                        <p className="text-[#4B5563] mb-8 text-sm font-medium">Para probar el poder de la IA en tu negocio.</p>
                        <div className="text-5xl font-black text-[#0a0a0a] mb-8">$0<span className="text-lg text-[#4B5563] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#0a0a0a]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#DAEBE3]" strokeWidth={3} /> 1 auditoría por mes</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#DAEBE3]" strokeWidth={3} /> Diagnóstico básico IA</li>
                          <li className="flex items-center gap-3 text-[#4B5563]/50 line-through"><CheckCircle2 size={18} className="text-[#CFD6C4]/30" strokeWidth={3} /> Historial de evolución</li>
                        </ul>
                      </div>
                      <button onClick={iniciarSesion} className="w-full bg-[#C4614A] hover:bg-[#a84c38] text-white font-bold py-4 rounded-xl transition-colors shadow-md mt-auto">Empezar gratis</button>
                    </div>
                  </TiltWrapper>

                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#10B981] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(153,205,216,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Individual</h3>
                        <p className="text-[#4B5563] mb-8 text-sm font-medium">Para emprendedores gentionando sus anuncios.</p>
                        <div className="text-5xl font-black text-[#0a0a0a] mb-8">$19<span className="text-lg text-[#4B5563] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#0a0a0a]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Auditorías ilimitadas</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Historial y evolución del score</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Exportación PDF</li>
                        </ul>
                      </div>
                      <button onClick={iniciarSesion} className="w-full bg-[#C4614A] hover:bg-[#a84c38] text-white font-bold py-4 rounded-xl transition-colors shadow-md mt-auto">Prueba de 14 días</button>
                    </div>
                  </TiltWrapper>

                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-[#E0E7FF] p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm hover:shadow-[0_20px_40px_rgba(243,195,178,0.4)] h-full cursor-pointer">
                      <div>
                        <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Agency</h3>
                        <p className="text-[#4B5563] mb-8 text-sm font-medium">El centro de comando para agencias.</p>
                        <div className="text-5xl font-black text-[#0a0a0a] mb-8">$49<span className="text-lg text-[#4B5563] font-medium">/mes</span></div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#0a0a0a]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#E0E7FF]" strokeWidth={3} /> Cuentas Ilimitadas</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#E0E7FF]" strokeWidth={3} /> Marca Blanca Total</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#E0E7FF]" strokeWidth={3} /> Dashboard Multi-Cliente</li>
                        </ul>
                      </div>
                      <button onClick={iniciarSesion} className="w-full bg-[#C4614A] hover:bg-[#a84c38] text-white font-bold py-4 rounded-xl transition-colors shadow-md mt-auto">Prueba de 14 días</button>
                    </div>
                  </TiltWrapper>
                </div>
              </section>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <section className="max-w-4xl mx-auto px-6 py-20 mb-12 border-t border-[#CFD6C4]/40">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-serif font-black text-[#0a0a0a]">Preguntas Frecuentes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#0a0a0a] mb-2">¿Mora hace cambios en mis campañas sin avisar?</h4>
                      <p className="text-[#4B5563] text-sm leading-relaxed font-medium">No. Mora audita y sugiere. Vos tenés el control total. Nunca tocaremos tu cuenta sin permiso.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#0a0a0a] mb-2">¿Necesito ser un experto en Google Ads?</h4>
                      <p className="text-[#4B5563] text-sm leading-relaxed font-medium">Para nada. Te decimos dónde estás perdiendo dinero y cómo solucionarlo en español claro.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#0a0a0a] mb-2">¿Qué formato usan para los reportes?</h4>
                      <p className="text-[#4B5563] text-sm leading-relaxed font-medium">Extraemos todo vía API para tu comodidad.</p>
                   </div>
                   <div className="bg-white/60 backdrop-blur-sm border border-[#CFD6C4]/60 p-6 rounded-2xl hover:bg-white transition-colors">
                      <h4 className="text-lg font-bold text-[#0a0a0a] mb-2">¿Mis datos están seguros?</h4>
                      <p className="text-[#4B5563] text-sm leading-relaxed font-medium">100%. Tus datos se usan solo para generar el análisis y no se comparten con terceros.</p>
                   </div>
                </div>
              </section>
            </FadeInOnScroll>

            <footer className="border-t border-[#CFD6C4]/50 bg-white/40 py-12 text-center text-[#4B5563] text-sm relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 rounded flex items-center justify-center font-black text-[#0a0a0a] text-xs bg-[#E0E7FF]">M</div>
                <span className="font-bold text-[#0a0a0a]">Mora Analytics</span>
              </div>
              <p className="mb-4 font-medium">© {new Date().getFullYear()} Mora Analytics. All rights reserved.</p>
              <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
                <Link href="/privacidad" className="hover:text-[#0a0a0a] transition-colors">Privacidad</Link>
                <Link href="/terminos" className="hover:text-[#0a0a0a] transition-colors">Términos</Link>
              </div>
            </footer>
          </div>
        ) : (
          <>
            {/* BARRA LATERAL OSCURA */}
            <aside className="w-64 md:w-72 bg-[#0a0a0a] flex-shrink-0 flex flex-col py-8 relative z-20 text-[#E5E7EB] shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
              <div className="px-8 mb-8">
                <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                  <span className="bg-[#F3C3B2] text-[#0a0a0a] w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm">M</span>
                  Mora
                </h1>
              </div>

              <nav className="flex-1 flex flex-col gap-2 relative px-4">
                <button 
                  onClick={() => navegar("dashboard", "/dashboard")}
                  className={`w-full text-left py-3.5 pr-4 flex items-center gap-3 font-bold transition-all duration-300 rounded-lg ${
                    vista === "dashboard" || vista === "detalle_hallazgo"
                    ? "bg-white/10 text-white border-l-4 border-[#F3C3B2] pl-5" 
                    : "text-[#8A968C] hover:bg-white/5 hover:text-white pl-6"
                  }`}
                >
                  <LayoutDashboard size={20} className={vista === "dashboard" || vista === "detalle_hallazgo" ? "text-[#F3C3B2]" : ""} />
                  Dashboard
                </button>

                <button 
                  onClick={() => navegar("campañas", "/campanas")}
                  className={`w-full text-left py-3.5 pr-4 flex items-center gap-3 font-bold transition-all duration-300 rounded-lg ${
                    vista === "campañas"
                    ? "bg-white/10 text-white border-l-4 border-[#F3C3B2] pl-5" 
                    : "text-[#8A968C] hover:bg-white/5 hover:text-white pl-6"
                  }`}
                >
                  <Folder size={20} className={vista === "campañas" ? "text-[#F3C3B2]" : ""} />
                  Campañas
                </button>

                <button 
                  onClick={() => navegar("historial", "/reportes")}
                  className={`w-full text-left py-3.5 pr-4 flex items-center gap-3 font-bold transition-all duration-300 rounded-lg ${
                    vista === "historial" || vista === "reporte_lectura"
                    ? "bg-white/10 text-white border-l-4 border-[#F3C3B2] pl-5" 
                    : "text-[#8A968C] hover:bg-white/5 hover:text-white pl-6"
                  }`}
                >
                  <FileText size={20} className={vista === "historial" || vista === "reporte_lectura" ? "text-[#F3C3B2]" : ""} />
                  Mis Reportes
                </button>

              </nav>
            </aside>

            {/* LIENZO PRINCIPAL */}
            <main className="flex-1 bg-[#1C1917] rounded-[2.5rem] relative z-10 flex flex-col overflow-hidden text-[#F5F0EB] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border border-[#44403C]/50 my-4 mr-4 md:my-5 md:mr-5">
              <header className="px-8 md:px-10 pt-8 pb-6 flex justify-between items-center shrink-0 w-full mx-auto relative z-50 border-b border-[#44403C]/30">
                <div>
                  <p className="text-[#A8A29E] font-black tracking-widest text-[10px] uppercase mb-1">
                     {vista === 'dashboard' && "Vista General"}
                     {vista === 'nueva' && "Nueva Auditoría"}
                     {vista === 'historial' && "Historial de Análisis"}
                     {vista === 'reporte_lectura' && "Detalle del Cliente"}
                     {vista === 'perfil' && "Preferencias"}
                     {vista === 'facturacion' && "Suscripción"}
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-[#F5F0EB]">
                     {vista === 'dashboard' ? `¡Hola, ${session?.user?.name?.split(' ')[0] || 'Valeria'}!` : 
                      vista === 'nueva' ? 'Auditor IA' :
                      vista === 'historial' ? 'Mis Reportes' :
                      vista === 'campañas' ? 'Gestor de Campañas' :
                      vista === 'reporte_lectura' ? (nombreCuenta || t[idioma].cuentaSinNombre) :
                      vista === 'perfil' ? 'Configuración' :
                      vista === 'facturacion' ? 'Facturación y Planes' : 'Mora Analytics'
                     }
                  </h1>
                </div>
                
                <div className="flex items-center gap-6">
                  {vista === 'historial' && (
                    <div className="hidden md:flex items-center bg-[#292524] border border-[#44403C] px-4 py-2.5 rounded-xl shadow-sm">
                       <Search size={16} className="text-[#A8A29E] mr-2" />
                       <input type="text" placeholder="Buscar cuenta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-transparent border-none outline-none text-sm text-[#F5F0EB] placeholder-[#A8A29E] w-48 font-bold" />
                    </div>
                  )}

                  {((vista === "dashboard" && ultimaAuditoria) ||
                    (vista === "reporte_lectura" && auditoriaActiva)) && (
                    <button
                      type="button"
                      onClick={() => setResumenFacilAbierto(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0E7FF]/50 bg-[#E0E7FF]/15 text-[#E0E7FF] hover:bg-[#E0E7FF]/25 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg"
                    >
                      <BookOpen size={14} />
                      {vista === "reporte_lectura" ? copyR.leerResumenSimple : copyR.verResumenSimple}
                    </button>
                  )}

                  <div className="flex items-center gap-3 bg-[#292524] border border-[#44403C] p-1.5 pr-4 rounded-full shadow-lg relative group cursor-pointer hover:bg-[#44403C]/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#F3C3B2]/20 border border-[#F3C3B2]/40 text-[#F3C3B2] flex items-center justify-center text-lg font-black">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'V'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#F5F0EB] font-bold text-sm leading-tight">{session?.user?.name?.split(' ')[0] || 'Valeria'}</span>
                      <span className="text-[#A8A29E] text-[9px] font-black uppercase tracking-widest mt-0.5">Mora Pro</span>
                    </div>
                    <ChevronDown size={14} className="text-[#A8A29E] ml-2 group-hover:rotate-180 transition-transform duration-300" />

                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#292524] border border-[#44403C] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden flex flex-col translate-y-2 group-hover:translate-y-0">
                       <button onClick={() => navegar("perfil", "/configuracion")} className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-[#A8A29E] hover:text-[#F5F0EB] hover:bg-[#44403C]/50 transition-colors text-left"><Settings size={16} /> Configuración</button>
                       <button onClick={() => navegar("facturacion", "/facturacion")} className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-[#A8A29E] hover:text-[#F5F0EB] hover:bg-[#44403C]/50 transition-colors text-left"><CreditCard size={16} /> Facturación</button>
                       <div className="h-px bg-[#44403C] w-full"></div>
                       <button type="button" onClick={cerrarSesion} className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-[#E07070] hover:bg-[#E07070]/10 transition-colors text-left"><LogOut size={16} /> Cerrar sesión</button>
                    </div>
                  </div>
                </div>
              </header>
              
              {/* CONTENEDOR SCROLLEABLE INTERNO */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 md:px-12 pb-32">

              {/* DASHBOARD INDIVIDUAL */}
              {vista === "dashboard" && (
                <div className="animate-fade-custom print:hidden flex flex-col gap-6 w-full mx-auto">
                  {errorAuditoria && (
                    <div
                      role="alert"
                      className="mt-6 rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <AlertTriangle size={22} className="text-[#D4A843] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#F5F0EB] font-medium leading-relaxed">
                          {errorAuditoria}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={ejecutarAuditoriaConIA}
                        disabled={loading}
                        className="shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Reintentando…" : "Reintentar"}
                      </button>
                    </div>
                  )}
                  {cargandoHistorial || googleAdsChecking ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 mt-6">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F3C3B2]" />
                      <p className="text-[#A8A29E] text-sm font-bold uppercase tracking-widest">
                        {locale === "en" ? "Loading…" : "Cargando…"}
                      </p>
                    </div>
                  ) : !googleAdsConnected && !ultimaAuditoria ? (
                    <div className="flex flex-col items-center justify-center text-center min-h-[min(70vh,640px)] px-8 py-20 mt-6 rounded-3xl border border-[#44403C] border-t-white/10 bg-gradient-to-b from-[#292524] to-[#1C1917] shadow-2xl">
                      <GoogleAdsConnectBlock
                        locale={locale}
                        connected={false}
                        checking={googleAdsChecking}
                        onConnect={() => void conectarGoogleAds()}
                        variant="hero"
                      />
                    </div>
                  ) : !ultimaAuditoria ? (
                    <div className="flex flex-col items-center justify-center text-center min-h-[min(70vh,640px)] px-8 py-20 mt-6 rounded-3xl border border-[#44403C] border-t-white/10 bg-gradient-to-b from-[#292524] to-[#1C1917] shadow-2xl">
                      <div className="w-full max-w-lg space-y-8">
                        <div>
                          <div className="w-16 h-16 rounded-2xl bg-[#F3C3B2]/15 border border-[#F3C3B2]/30 flex items-center justify-center mx-auto">
                            <Activity size={28} className="text-[#F3C3B2]" />
                          </div>
                          <h2 className="text-2xl md:text-3xl font-black text-[#F5F0EB] mt-8 max-w-xl tracking-tight mx-auto">
                            {locale === "en"
                              ? "Ready for your first audit"
                              : "Mora está lista para tu primera auditoría"}
                          </h2>
                          <p className="text-[#A8A29E] text-sm md:text-base mt-4 max-w-lg font-medium leading-relaxed mx-auto">
                            {locale === "en"
                              ? "Google Ads is connected. Run an audit to see your account health and opportunities."
                              : "Google Ads está conectado. Ejecutá una auditoría para ver el estado de tus campañas y las oportunidades de mejora."}
                          </p>
                        </div>
                        <GoogleAdsConnectBlock
                          locale={locale}
                          connected={googleAdsConnected}
                          checking={googleAdsChecking}
                          onConnect={() => void conectarGoogleAds()}
                          variant="inline"
                        />
                        <button
                          type="button"
                          onClick={ejecutarAuditoriaConIA}
                          disabled={loading || auditoriaBloqueadaPorCuota}
                          className="w-full px-8 py-4 rounded-2xl text-sm uppercase tracking-widest font-black bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading
                            ? locale === "en"
                              ? "ANALYZING…"
                              : "MORA ESTÁ ANALIZANDO…"
                            : auditoriaBloqueadaPorCuota
                              ? locale === "en"
                                ? "MONTHLY LIMIT REACHED"
                                : "LÍMITE MENSUAL ALCANZADO"
                              : locale === "en"
                                ? "RUN PRO AUDIT"
                                : "EJECUTAR AUDITORÍA PRO"}
                        </button>
                      </div>
                    </div>
                  ) : (
                  <>
                  {!googleAdsConnected && !googleAdsChecking && (
                    <div className="mt-6">
                      <GoogleAdsConnectBlock
                        locale={locale}
                        connected={false}
                        onConnect={() => void conectarGoogleAds()}
                        variant="inline"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
                     
                    {/* 1. Salud de la Cuenta */}
                    <div className="bg-gradient-to-b from-[#292524] to-[#1C1917] border border-[#44403C] border-t-white/10 shadow-2xl rounded-3xl p-6 flex items-center justify-between min-h-[220px] relative overflow-hidden">
                      <div className="flex flex-col h-full justify-between w-full relative z-10">
                        <p className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-[#F3C3B2]"/> Salud de la Cuenta</p>
                        
                        <div className="flex flex-col items-center gap-3 mt-2 w-full">
                          <ScoreRing score={ultimaAuditoria.score} size={120} />

                          {textoUltimaAuditoria && (
                            <p className="text-[10px] text-[#A8A29E] font-bold text-center leading-relaxed px-1">
                              Última auditoría:{" "}
                              <span className="text-[#F5F0EB]">{textoUltimaAuditoria}</span>
                            </p>
                          )}

                          {badgeUltimaAuditoria === "recomendado" && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] text-center">
                              Recomendado auditar
                            </span>
                          )}
                          {badgeUltimaAuditoria === "desactualizada" && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#D4A843]/40 bg-[#D4A843]/10 text-[#D4A843] text-center">
                              Auditoría desactualizada
                            </span>
                          )}

                          {(ultimaAuditoria.reporte_json?.cuenta_sin_cambios_urgentes === true ||
                            ultimaAuditoria.reporte_json?.diagnostico_salud?.cuenta
                              ?.cuenta_sin_cambios_urgentes === true) && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] text-center leading-snug">
                              Sin cambios urgentes
                            </span>
                          )}

                          {usageSnapshot && (
                            <p className="text-[9px] text-[#A8A29E] font-bold text-center leading-snug">
                              Auditorías este mes: {usageSnapshot.usage.audit}/
                              {usageSnapshot.limits.audit.monthly}
                              {usageSnapshot.tier === "trial" ? " (trial)" : ""}
                            </p>
                          )}

                          <button 
                            type="button"
                            onClick={ejecutarAuditoriaConIA} 
                            disabled={loading || auditoriaBloqueadaPorCuota}
                            className="w-full text-[10px] uppercase tracking-widest font-black border border-[#44403C] bg-[#F3C3B2]/10 text-[#F3C3B2] hover:bg-[#F3C3B2] hover:text-[#0a0a0a] transition-colors px-5 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading
                              ? "MORA ESTÁ ANALIZANDO..."
                              : auditoriaBloqueadaPorCuota
                                ? "LÍMITE MENSUAL"
                                : "EJECUTAR AUDITORÍA PRO"}
                          </button>
                        </div>
                      </div>
                    </div>

                     {/* 2. Fugas Críticas */}
                     <div className="bg-gradient-to-b from-[#292524] to-[#1C1917] border border-[#44403C] border-t-white/10 shadow-2xl rounded-3xl p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-[#E07070]/10 border border-[#E07070]/20 text-[#E07070] text-[9px] font-black uppercase tracking-widest">Crítico</div>
                        <div className="w-12 h-12 rounded-2xl bg-[#E07070]/15 flex items-center justify-center mb-3 border border-[#E07070]/30 shadow-inner">
                          <AlertTriangle size={22} className="text-[#E07070]" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter leading-none">{fugasIndividuales}</span>
                            <span className="text-xs font-black text-[#A8A29E] uppercase tracking-widest">Fugas</span>
                          </div>
                        </div>
                     </div>

                     {/* 3. DESTRIPADOR (Fugas en Palabras) */}
                     {(() => {
                       const tieneDatos =
                         !!destripadorReporte &&
                         (terminosNegativizables > 0 ||
                           cantidadCopiadosDestripador > 0 ||
                           cantidadAplicadosDestripador > 0 ||
                           palabrasBasura > 0);
                       const subtituloPartes: string[] = [];
                       if (terminosNegativizables > 0) subtituloPartes.push(`${terminosNegativizables} pendientes`);
                       if (cantidadCopiadosDestripador > 0) subtituloPartes.push(`${cantidadCopiadosDestripador} copiados`);
                       if (cantidadAplicadosDestripador > 0) subtituloPartes.push(`${cantidadAplicadosDestripador} aplicados`);
                       const subtitulo =
                         subtituloPartes.length > 0
                           ? subtituloPartes.join(" · ")
                           : palabrasBasura > 0
                             ? `En ${palabrasBasura} palabras basura`
                             : "Sin pendientes";
                       return (
                     <div 
                        onClick={() => {
                          if (tieneDatos) setDestripadorAbierto(true);
                        }}
                        className={`bg-gradient-to-b from-[#292524] to-[#1C1917] border border-[#44403C] border-t-white/10 shadow-2xl rounded-3xl p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden group transition-all ${tieneDatos ? 'cursor-pointer hover:border-[#F3C3B2]/50' : 'opacity-70 grayscale'}`}
                     >
                        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-[#F3C3B2]/10 border border-[#F3C3B2]/20 text-[#F3C3B2] text-[9px] font-black uppercase tracking-widest">N-gramas</div>
                        <div className="w-12 h-12 rounded-2xl bg-[#F3C3B2]/15 flex items-center justify-center mb-3 border border-[#F3C3B2]/30 shadow-inner">
                          <Trash2 size={22} className="text-[#F3C3B2]" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-[#F3C3B2] tracking-tighter leading-none">${ahorroNGramas.toLocaleString()}</span>
                            <span className="text-xs font-black text-[#A8A29E] uppercase tracking-widest">Recuperable</span>
                          </div>
                          <p className="text-[10px] text-[#A8A29E] mt-2 font-bold uppercase tracking-widest">
                            {subtitulo}
                          </p>
                        </div>
                     </div>
                       );
                     })()}

                     {/* 4. Dayparting */}
                     <div
                        onClick={() => {
                          if (daypartingReporte) setDaypartingAbierto(true);
                        }}
                        className={`bg-gradient-to-b from-[#292524] to-[#1C1917] border border-[#44403C] border-t-white/10 shadow-2xl rounded-3xl p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden group transition-all ${daypartingReporte ? "cursor-pointer hover:border-[#D4A843]/50" : "opacity-70 grayscale"}`}
                     >
                        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-[#D4A843]/10 border border-[#D4A843]/20 text-[#D4A843] text-[9px] font-black uppercase tracking-widest">Dayparting</div>
                        <div className="w-12 h-12 rounded-2xl bg-[#D4A843]/15 flex items-center justify-center mb-3 border border-[#D4A843]/30 shadow-inner">
                          <Clock size={22} className="text-[#D4A843]" />
                        </div>
                        {daypartingReporte ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span
                                className={`text-5xl font-black tracking-tighter leading-none ${
                                  franjasDaypartingPendientes > 0 ? "text-[#E07070]" : "text-[#D4A843]"
                                }`}
                              >
                                {franjasDaypartingPendientes}
                              </span>
                              <span className="text-xs font-black text-[#A8A29E] uppercase tracking-widest">
                                {franjasDaypartingPendientes === 1 ? "Patrón crítico" : "Patrones críticos"}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#A8A29E] mt-2 font-bold uppercase tracking-widest">
                              ${ahorroMensualDayparting.toLocaleString()} recuperable/mes
                            </p>
                            {daypartingReporte.patron_principal && (
                              <p className="text-[9px] text-[#A8A29E] mt-1.5 font-medium line-clamp-2 leading-snug opacity-90">
                                {daypartingReporte.patron_principal.dias.join(" · ")} ·{" "}
                                {String(daypartingReporte.patron_principal.hora_inicio).padStart(2, "0")}:00–
                                {String(daypartingReporte.patron_principal.hora_fin).padStart(2, "0")}:00
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-widest">Corré una auditoría</p>
                        )}
                     </div>

                     {/* 5. Simulador de presupuesto */}
                     <div
                        onClick={() => {
                          if (simuladorReporte) setSimuladorAbierto(true);
                        }}
                        className={`bg-gradient-to-b from-[#292524] to-[#1C1917] border border-[#44403C] border-t-white/10 shadow-2xl rounded-3xl p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden group transition-all ${simuladorReporte ? "cursor-pointer hover:border-[#10B981]/50" : "opacity-70 grayscale"}`}
                     >
                        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[9px] font-black uppercase tracking-widest">Simulador</div>
                        <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 flex items-center justify-center mb-3 border border-[#10B981]/30 shadow-inner">
                          <Calculator size={22} className="text-[#10B981]" />
                        </div>
                        {simuladorReporte && escenarioSimRecomendado ? (
                          <div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-3xl font-black text-[#10B981] tracking-tighter leading-none">
                                +{escenarioSimRecomendado.conversiones_extra.pesimista}–
                                {escenarioSimRecomendado.conversiones_extra.optimista}
                              </span>
                              <span className="text-xs font-black text-[#A8A29E] uppercase tracking-widest">Conv./mes</span>
                            </div>
                            <p className="text-[10px] text-[#A8A29E] mt-2 font-bold uppercase tracking-widest line-clamp-2">
                              Reasignando ${escenarioSimRecomendado.presupuesto_reasignable.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-widest">Corré una auditoría</p>
                        )}
                     </div>
                     
                  </div>

                  {/* QUICK WINS DEL DÍA */}
                  {(quickWinsDelDia.length > 0 || cuentaSinCambiosUrgentes) && (
                    <div className="bg-[#292524] border border-[#44403C] shadow-2xl rounded-3xl p-6 w-full animate-fade-custom">
                      {quickWinsDelDia.length === 0 && cuentaSinCambiosUrgentes ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center bg-[#10B981]/10 border-2 border-dashed border-[#10B981]/30 rounded-2xl">
                          <CheckCircle2 size={40} className="text-[#10B981] mb-4" />
                          <h3 className="text-xl font-black text-[#F5F0EB] tracking-tight">No hay acciones urgentes hoy</h3>
                          <p className="text-[#A8A29E] text-sm mt-2 max-w-md font-medium leading-relaxed">
                            {razonesCuentaSana.length > 0
                              ? razonesCuentaSana.join(" ")
                              : "Tu cuenta está en buen estado. Si tenés tiempo, revisá el detalle por campaña."}
                          </p>
                          <button
                            type="button"
                            onClick={() => navegar("campañas", "/campanas")}
                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#F3C3B2] hover:underline"
                          >
                            Ver detalle por campaña →
                          </button>
                        </div>
                      ) : quickWinsCompletados.length === quickWinsDelDia.length ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center bg-[#10B981]/10 border-2 border-dashed border-[#10B981]/30 rounded-2xl animate-fade-custom">
                          <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] mb-4 shadow-lg animate-bounce">
                            <CheckCircle2 size={32} strokeWidth={3} />
                          </div>
                          <h3 className="text-2xl font-black text-white tracking-tight">¡Cuenta blindada por hoy! 🎉</h3>
                          <p className="text-[#A8A29E] text-sm mt-2 max-w-md font-medium leading-relaxed">
                            Completaste las 3 acciones prioritarias recomendadas por Mora para este ciclo. El capital diario de tu cliente está seguro.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2">
                                <Zap className="text-[#F3C3B2]" size={20} /> Quick Wins del Día
                              </h3>
                              <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">Si tenés 10 minutos, empezá acá</p>
                            </div>
                            <span className="text-[10px] font-black bg-[#1C1917] border border-[#44403C] text-[#F3C3B2] px-3 py-1.5 rounded-lg">
                              {quickWinsCompletados.length} de {quickWinsDelDia.length} Completados
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {quickWinsDelDia.map((win: any, idx: number) => {
                              const winId = win.id_rastreo || `win-${idx}-${win.titulo}`;
                              const esCompletado = quickWinsCompletados.includes(winId);

                              return (
                                <div 
                                  key={winId} 
                                  className={`bg-[#1C1917] border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                                    esCompletado ? 'border-[#10B981]/30 opacity-50 bg-[#10B981]/5' : 'border-[#44403C] hover:border-[#44403C]/80 shadow-md'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-center mb-3">
                                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                        esCompletado 
                                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
                                          : win.tipo === 'critico' 
                                            ? 'bg-[#E07070]/10 text-[#E07070] border-[#E07070]/20' 
                                            : 'bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20'
                                      }`}>
                                        {esCompletado ? 'Solucionado' : win.tipo === 'critico' ? 'Urgente' : 'Optimización'}
                                      </span>
                                    </div>
                                    <h4 className={`text-sm font-bold text-[#F5F0EB] leading-tight ${esCompletado ? 'line-through opacity-60' : ''}`}>
                                      {win.titulo}
                                    </h4>
                                    <p className="text-[11px] text-[#A8A29E] mt-2 font-medium line-clamp-2 leading-relaxed">
                                      {textoQuickWin(win)}
                                    </p>
                                  </div>

                                  <div className="mt-5 pt-3 border-t border-[#44403C]/30 flex items-center justify-between gap-4 shrink-0">
                                    <button 
                                      onClick={() => abrirDetalleHallazgo(win, win.tipo, ultimaAuditoria?.reporte_json)}
                                      className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] hover:text-[#F5F0EB] transition-colors"
                                    >
                                      Ver detalle
                                    </button>
                                    
                                    {!esCompletado ? (
                                      <button 
                                        onClick={() => {
                                          if (win.id_rastreo === "GENERADOR_NEGATIVOS_URGENTE" && destripadorReporte) {
                                            setPanelIntroResumen("destripador");
                                            setDestripadorAbierto(true);
                                          } else if (win.id_rastreo === "SIMULADOR_PRESUPUESTO" && simuladorReporte) {
                                            setPanelIntroResumen("simulador");
                                            setSimuladorAbierto(true);
                                          } else if (win.id_rastreo === "DAYPARTING_FUGAS_HORARIAS" && daypartingReporte) {
                                            setPanelIntroResumen("dayparting");
                                            setDaypartingAbierto(true);
                                          } else {
                                            setQuickWinsCompletados([...quickWinsCompletados, winId]);
                                            setToastState({ show: true, status: 'success', timeLeft: 5 });
                                          }
                                        }}
                                        className="bg-[#F3C3B2] hover:bg-[#eab3a1] text-[#0a0a0a] font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm"
                                      >
                                        {win.id_rastreo === "GENERADOR_NEGATIVOS_URGENTE"
                                          ? "Abrir Destripador"
                                          : win.id_rastreo === "DAYPARTING_FUGAS_HORARIAS"
                                            ? "Abrir Dayparting"
                                            : win.id_rastreo === "SIMULADOR_PRESUPUESTO"
                                              ? "Abrir Simulador"
                                              : "Corregir Ahora"}
                                      </button>
                                    ) : (
                                      <span className="text-[#10B981] flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                        <Check size={14} strokeWidth={3} /> Listo
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <PacingResumenCuenta
                    evaluadas={campanasEvaluadas}
                    cargando={cargandoCampanas}
                    onVerTodas={() => navegar("campañas", "/campanas?vista=pacing")}
                  />

                  {/* EVOLUCIÓN DEL SCORE */}
                  {scoreHistorico.length >= 2 && (
                    <div className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 w-full">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-black text-[#F5F0EB]">Evolución del score</h3>
                          <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">Últimas {scoreHistorico.length} auditorías</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[9px] text-[#A8A29E] uppercase tracking-widest font-black">Mejor score</p>
                            <p className="text-sm font-black text-[#F3C3B2]">{Math.max(...scoreHistorico)}/100</p>
                          </div>
                          {(() => {
                            const delta = scoreHistorico[scoreHistorico.length - 1] - scoreHistorico[0];
                            const color = delta >= 0 ? 'text-[#7EB893] bg-[#7EB893]/10 border border-[#7EB893]/30' : 'text-[#E07070] bg-[#E07070]/10 border border-[#E07070]/30';
                            return (
                              <span className={`text-xs font-black px-3 py-1.5 rounded-lg shadow-sm ${color}`}>
                                {delta >= 0 ? '+' : ''}{delta} pts
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="mt-4 w-full">
                        <ScoreSparkline data={scoreHistorico} fechas={fechasHistorico} />
                      </div>
                    </div>
                  )}

                  {/* PROBLEMAS Y OPORTUNIDADES DETALLADOS */}
                  {ultimaAuditoria && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {ultimaAuditoria.reporte_json?.hallazgos?.graves_rojo?.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 cursor-pointer hover:border-[#E07070]/50 hover:shadow-xl transition-all group relative overflow-hidden"
                          onClick={() => abrirDetalleHallazgo(item, "critico", ultimaAuditoria.reporte_json)}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#E07070]"></div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#E07070]/10 flex items-center justify-center"><AlertTriangle size={12} className="text-[#E07070]" /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#E07070]">Impacto Alto</span>
                            </div>
                            <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[#F5F0EB] transition-colors" />
                          </div>
                          <p className="text-lg font-black text-[#F5F0EB] mt-2">{item.titulo}</p>
                          <p className="text-sm text-[#A8A29E] font-medium mt-2 leading-relaxed line-clamp-2">{textoHallazgoParaUsuario(item, true, { locale })}</p>
                        </div>
                      ))}
                      {ultimaAuditoria.reporte_json?.hallazgos?.debiles_amarillo?.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 cursor-pointer hover:border-[#D4A843]/50 hover:shadow-xl transition-all group relative overflow-hidden"
                          onClick={() => abrirDetalleHallazgo(item, "mejora", ultimaAuditoria.reporte_json)}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A843]"></div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#D4A843]/10 flex items-center justify-center"><Zap size={12} className="text-[#D4A843]" /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">Mejora</span>
                            </div>
                            <ChevronRight size={16} className="text-[#A8A29E] group-hover:text-[#F5F0EB] transition-colors" />
                          </div>
                          <p className="text-lg font-black text-[#F5F0EB] mt-2">{item.titulo}</p>
                          <p className="text-sm text-[#A8A29E] font-medium mt-2 leading-relaxed line-clamp-2">{textoHallazgoParaUsuario(item, true, { locale })}</p>
                        </div>
                      ))}
                      {ultimaAuditoria.reporte_json?.hallazgos?.bien_verde?.map((item: any, i: number) => {
                        const diagSalud = ultimaAuditoria.reporte_json?.diagnostico_salud;
                        let nivelVerde: NivelSalud = "estable";
                        if (item.id_rastreo === "CUENTA_SALUDABLE") {
                          nivelVerde = diagSalud?.cuenta?.nivel ?? "estable";
                        } else if (String(item.id_rastreo).startsWith("CAMPANA_SALUDABLE_")) {
                          const campId = String(item.id_rastreo).replace("CAMPANA_SALUDABLE_", "");
                          nivelVerde = diagSalud?.campanas?.[campId]?.nivel ?? "estable";
                        }
                        return (
                        <div
                          key={`verde-${i}`}
                          className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 relative overflow-hidden md:col-span-2"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]"></div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-md bg-[#10B981]/10 flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-[#10B981]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                              {etiquetaBadgeSalud(nivelVerde)}
                            </span>
                          </div>
                          <p className="text-lg font-black text-[#F5F0EB]">{item.titulo}</p>
                          <p className="text-sm text-[#A8A29E] font-medium mt-2 leading-relaxed">
                            {textoHallazgoParaUsuario(item, true, { locale })}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ROBIN HOOD + MATRIZ RESUMEN */}
                  <div className="w-full mt-6">
                    {planRobin && planRobin.estado !== "sin_oportunidad" && (
                      <div
                        id="robin-hood-section"
                        className={`mb-4 rounded-3xl border px-5 py-4 ${
                          planRobin.aplica
                            ? "border-[#D4A843]/40 bg-[#D4A843]/5"
                            : "border-[#44403C] bg-[#292524]"
                        }`}
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A843] mb-1">Robin Hood seguro</p>
                            <h4 className="text-lg font-black text-[#F5F0EB] leading-tight">
                              {planRobin.aplica ? "Reasignación lista para aplicar" : "Reasignación bloqueada por seguridad"}
                            </h4>
                            <p className="text-sm text-[#A8A29E] font-medium leading-relaxed mt-1">{planRobin.justificacion}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#44403C] text-[#F5F0EB] bg-[#1C1917]">
                              Confianza {planRobin.confianza}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#10B981]/20 text-[#10B981] bg-[#10B981]/10">
                              Safe Apply
                            </span>
                          </div>
                        </div>
                        {planRobin.aplica && planRobin.destino && (
                          <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
                              <div className="rounded-2xl border border-[#E07070]/20 bg-[#E07070]/5 p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#E07070] mb-2">Total a donar ahora</p>
                                <p className="text-2xl font-black text-[#F5F0EB]">${planRobin.total_reasignado.toLocaleString()}/mes</p>
                                {planRobin.presupuesto_rescatable > planRobin.total_reasignado && (
                                  <p className="text-[9px] text-[#A8A29E] font-bold mt-1 leading-snug">
                                    Potencial hasta ${planRobin.presupuesto_rescatable.toLocaleString()} · Mora aplica ${planRobin.total_reasignado.toLocaleString()} por seguridad.
                                  </p>
                                )}
                                <div className="mt-2 space-y-1">
                                  {planRobin.origenes.map(origen => (
                                    <div key={origen.campana_id} className="flex justify-between gap-2 text-[10px] font-bold text-[#A8A29E]">
                                      <span className="truncate" title={origen.nombre}>{origen.nombre}</span>
                                      <span className="text-[#E07070] shrink-0">recorte -${origen.monto_recortado.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/5 p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#10B981] mb-2">Recibe la donación</p>
                                <p className="text-sm font-black text-[#F5F0EB] truncate">{planRobin.destino.nombre}</p>
                                <p className="text-2xl font-black text-[#10B981] mt-1">+${planRobin.destino.monto_incrementado.toLocaleString()}/mes</p>
                                <p className="text-[10px] text-[#A8A29E] font-bold mt-1">
                                  Margen escalable {planRobin.destino.margen_escalabilidad}% · Score {planRobin.destino.score_escalabilidad}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#D4A843] mb-2">Victoria estimada</p>
                                <p className="text-2xl font-black text-[#F5F0EB] leading-tight">
                                  +{planRobin.proyeccion.conversiones_extra_mensuales}
                                  <span className="text-sm font-black text-[#A8A29E] ml-1">conversiones/mes</span>
                                </p>
                                <p className="text-[10px] text-[#A8A29E] font-bold mt-1">
                                  CPA global estimado -{planRobin.proyeccion.reduccion_cpa_global_pct}%
                                </p>
                                <p className="text-[9px] text-[#A8A29E] mt-2 leading-snug">{planRobin.proyeccion.supuesto}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const plan = crearPlanSeguroRobin(planRobin);
                                if (plan) setRobinAccionPendiente(plan);
                              }}
                              className="mt-4 w-full sm:w-auto text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border border-[#D4A843]/30 bg-[#D4A843]/10 text-[#D4A843] hover:bg-[#D4A843] hover:text-[#0a0a0a] transition-colors"
                            >
                              Aplicar reasignación Robin Hood
                            </button>
                          </>
                        )}
                        {!planRobin.aplica && planRobin.bloqueos.length > 0 && (
                          <p className="text-[10px] text-[#A8A29E] font-bold leading-relaxed mt-3">{planRobin.bloqueos[0]}</p>
                        )}
                      </div>
                    )}
                    <MatrizResumenCuenta
                      buckets={matrizBuckets}
                      cpaPromedio={cpaPromedioCampanas}
                      activasCount={campanasActivas.length}
                      onAbrirMatriz={() => navegar("campañas", "/campanas?vista=matriz")}
                    />
                  </div>
                  </>
                  )}
                </div>
              )}

              <ResumenFacilPanel
                open={resumenFacilAbierto}
                onClose={() => setResumenFacilAbierto(false)}
                score={auditoriaResumen?.score ?? 0}
                gastoDesperdiciado={
                  auditoriaResumen?.reporte_json?.resumen?.gasto_desperdiciado ?? 0
                }
                porcentajeDesperdiciado={
                  auditoriaResumen?.reporte_json?.resumen?.porcentaje_desperdiciado ?? 0
                }
                resumenEjecutivo={
                  typeof auditoriaResumen?.reporte_json?.resumen?.ejecutivo === "string"
                    ? auditoriaResumen.reporte_json.resumen.ejecutivo
                    : undefined
                }
                cuentaSinCambiosUrgentes={
                  auditoriaResumen?.reporte_json?.cuenta_sin_cambios_urgentes === true ||
                  auditoriaResumen?.reporte_json?.diagnostico_salud?.cuenta
                    ?.cuenta_sin_cambios_urgentes === true
                }
                nivelCuenta={
                  auditoriaResumen?.reporte_json?.diagnostico_salud?.cuenta?.nivel
                }
                razonesCuenta={
                  Array.isArray(
                    auditoriaResumen?.reporte_json?.diagnostico_salud?.cuenta?.razones
                  )
                    ? auditoriaResumen.reporte_json.diagnostico_salud.cuenta.razones
                    : []
                }
                items={quickWinsResumen}
                itemsPositivos={positivosResumen}
                totalHallazgosAccionables={totalHallazgosResumen}
                locale={locale}
                currencyCode={currencyCodeActiva}
                onResolver={handleResolverDesdeResumen}
                onVerReporteCompleto={() => {
                  setResumenFacilAbierto(false);
                  if (vista !== "reporte_lectura" && auditoriaResumen) {
                    abrirAuditoriaHistorial(auditoriaResumen);
                  }
                }}
                soloLectura={vista === "reporte_lectura"}
                modoHistorico={modoHistoricoAuditoria}
                fechaAuditoria={fechaAuditoriaResumen}
              />

              {/* DESTRIPADOR DE BÚSQUEDAS — Panel especializado */}
              <DestripadorPanel
                destripador={destripadorReporte}
                open={destripadorAbierto}
                auditId={auditoriaContextual?.id ?? null}
                mitigadosKeys={mitigadosKeys}
                copiadosKeys={copiadosKeys}
                introDesdeResumen={
                  panelIntroResumen === "destripador"
                    ? introPanelDesdeResumen("destripador", locale)
                    : null
                }
                tituloLenguajeClaro
                onClose={() => {
                  setDestripadorAbierto(false);
                  cerrarPanelesHerramientas();
                }}
                onMitigar={handleDestripadorMitigar}
                onCopiar={handleDestripadorCopiar}
              />

              <DaypartingPanel
                dayparting={daypartingReporte}
                open={daypartingAbierto}
                auditId={auditoriaContextual?.id ?? null}
                aplicadosIds={daypartingAplicadosIds}
                introDesdeResumen={
                  panelIntroResumen === "dayparting"
                    ? introPanelDesdeResumen("dayparting", locale)
                    : null
                }
                tituloLenguajeClaro
                onClose={() => {
                  setDaypartingAbierto(false);
                  cerrarPanelesHerramientas();
                }}
                onAplicar={handleDaypartingAplicar}
              />

              <PresupuestoSimulatorPanel
                simulador={simuladorReporte}
                open={simuladorAbierto}
                auditId={auditoriaContextual?.id ?? null}
                introDesdeResumen={
                  panelIntroResumen === "simulador"
                    ? introPanelDesdeResumen("simulador", locale)
                    : null
                }
                tituloLenguajeClaro
                onClose={() => {
                  setSimuladorAbierto(false);
                  cerrarPanelesHerramientas();
                }}
              />

              <AdGeneratorPanel
                open={!!adGeneratorContext}
                contexto={adGeneratorContext}
                onClose={() => setAdGeneratorContext(null)}
              />

              <HallazgoDetallePanel
                detalle={detalleHallazgo}
                open={!!detalleHallazgo && !isClosing}
                isClosing={isClosing}
                locale={locale}
                onClose={cerrarDetalle}
                onAbrirResumen={() => {
                  cerrarDetalle();
                  setTimeout(() => setResumenFacilAbierto(true), 400);
                }}
                onAbrirHerramienta={(idRastreo) => {
                  cerrarDetalle();
                  setTimeout(() => abrirHerramientaDesdeDetalle(idRastreo), 400);
                }}
                onGenerarAnuncios={(ctx) => {
                  cerrarDetalle();
                  setTimeout(() => abrirGeneradorAnuncios(ctx), 400);
                }}
              />

              {/* VISTA: MIS REPORTES */}
              {vista === "historial" && !vistaComparacion && (
                <HistorialAuditoriasSection
                  cargando={cargandoHistorial}
                  totalHistorial={historial.length}
                  items={clientesFiltrados}
                  historialCompleto={historial}
                  filtroEstado={filtroEstado}
                  onFiltroEstado={setFiltroEstado}
                  busqueda={busqueda}
                  onBusqueda={setBusqueda}
                  comparacionIds={comparacionIds}
                  comparacionMismaCuenta={comparacionMismaCuenta}
                  hintComparacionMax={hintComparacionMax}
                  onToggleComparacion={toggleComparacionHistorial}
                  onCompararSeleccion={iniciarComparacionHistorial}
                  onCompararConAnterior={compararConAnteriorHistorial}
                  pdfDescargandoId={pdfDescargandoId}
                  pdfExportDisabled={pdfExportDisabled}
                  pdfQuotaLabel={pdfQuotaLabel}
                  onDescargarPdf={handleDescargarPdfHistorial}
                  onBorrar={borrarAuditoria}
                  onAbrirAuditoria={abrirAuditoriaHistorial}
                  onIrAEjecutarAuditoria={() => navegar("dashboard", "/dashboard")}
                  getDashboardStatus={getDashboardStatus}
                  parseDate={parseDate}
                />
              )}

              {/* VISTA: COMPARACIÓN */}
              {vista === "historial" && vistaComparacion && (() => {
                 const selected = historial.filter(h => comparacionIds.includes(h.id)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                 if (selected.length !== 2) return null;
                 if (!comparacionEsMismaCuenta(selected)) {
                   return (
                     <div className="animate-fade-custom max-w-[1400px] mx-auto p-8 text-center">
                       <p className="text-[#E07070] font-bold mb-4">Las auditorías seleccionadas no son de la misma cuenta.</p>
                       <button
                         type="button"
                         onClick={() => { setVistaComparacion(false); setComparacionIds([]); }}
                         className="px-6 py-3 rounded-xl bg-[#292524] border border-[#44403C] text-[#F5F0EB] font-black text-sm"
                       >
                         Volver al historial
                       </button>
                     </div>
                   );
                 }
                 const auditA = selected[0]; 
                 const auditB = selected[1]; 

                 const deltaScore = auditB.score - auditA.score;
                 const wasteA = auditA.reporte_json?.resumen?.gasto_desperdiciado || 0;
                 const wasteB = auditB.reporte_json?.resumen?.gasto_desperdiciado || 0;
                 const deltaWaste = wasteA - wasteB; 
                 
                 const fugasA = auditA.reporte_json?.hallazgos?.graves_rojo || [];
                 const fugasB = auditB.reporte_json?.hallazgos?.graves_rojo || [];
                 const mejorasA = auditA.reporte_json?.hallazgos?.debiles_amarillo || [];
                 const mejorasB = auditB.reporte_json?.hallazgos?.debiles_amarillo || [];

                 return (
                  <div className="animate-fade-custom print:hidden relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8">
                    <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#44403C]/50 pb-6">
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => { setVistaComparacion(false); setComparacionIds([]); setHintComparacionMax(false); }} className="p-2.5 rounded-xl bg-[#292524] border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] transition-colors"><ArrowLeft size={18} /></button>
                        <div>
                          <h2 className="text-3xl font-black text-[#F5F0EB]">Rendición de Cuentas</h2>
                          <p className="text-[#A8A29E] text-sm mt-1 font-medium uppercase tracking-widest text-[10px] font-black">{auditA.nombre_cuenta}</p>
                          {pdfQuotaLabel && (
                            <p className="text-[10px] font-bold text-[#A8A29E] mt-2 uppercase tracking-widest">{pdfQuotaLabel}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={pdfExportDisabled || pdfComparacionCargando || pdfDescargandoId !== null}
                        title={pdfExportDisabled ? "Límite mensual de PDFs alcanzado" : undefined}
                        onClick={() => void handleDescargarComparacionPdf(auditA.id, auditB.id)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] disabled:opacity-50 transition-all"
                      >
                        {pdfComparacionCargando ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileText size={14} />
                        )}
                        Exportar comparación PDF
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-6 items-stretch">
                       <div className="bg-[#1C1917] border border-[#44403C] rounded-3xl p-8 opacity-60">
                         <p className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest mb-6 bg-[#292524] w-max px-3 py-1.5 rounded-lg border border-[#44403C]">Foto Pasada ({parseDate(auditA.created_at)})</p>
                         <div className="flex justify-between items-end">
                           <div><p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest">Score Antiguo</p><p className="text-5xl font-black text-[#F5F0EB]">{auditA.score}</p></div>
                           <div className="text-right"><p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest">Desperdicio</p><p className="text-2xl font-black text-[#E07070]">-${wasteA}</p></div>
                         </div>
                       </div>

                       <div className="flex flex-col justify-center items-center bg-[#292524] border-2 border-[#44403C] rounded-3xl p-8 shadow-2xl relative">
                          <p className="absolute top-[-12px] bg-[#1C1917] px-4 py-1 rounded-full text-[10px] font-black text-[#A8A29E] uppercase tracking-widest border border-[#44403C]">Impacto Generado</p>
                          <div className="text-center mb-6 w-full">
                            <p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest mb-1">Evolución de Salud</p>
                            <span className={`text-6xl font-black tracking-tighter ${deltaScore >= 0 ? 'text-[#10B981]' : 'text-[#E07070]'}`}>
                              {deltaScore > 0 ? '+' : ''}{deltaScore} <span className="text-xl">pts</span>
                            </span>
                          </div>
                          <div className="w-full h-px bg-[#44403C]/50 mb-6"></div>
                          <div className="text-center w-full">
                            <p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest mb-1">Evolución de Presupuesto</p>
                            <span className={`text-3xl font-black ${deltaWaste >= 0 ? 'text-[#10B981]' : 'text-[#E07070]'}`}>
                              {deltaWaste > 0 ? 'Se salvaron ' : 'Se perdieron extras '}
                              ${Math.abs(deltaWaste).toLocaleString()}
                            </span>
                          </div>
                       </div>

                       <div className="bg-[#1C1917] border-2 border-[#F3C3B2]/30 shadow-[0_0_30px_rgba(243,195,178,0.05)] rounded-3xl p-8">
                         <p className="text-[10px] font-black text-[#F3C3B2] uppercase tracking-widest mb-6 bg-[#F3C3B2]/10 w-max px-3 py-1.5 rounded-lg border border-[#F3C3B2]/20">Foto Actual ({parseDate(auditB.created_at)})</p>
                         <div className="flex justify-between items-end">
                           <div><p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest">Score Actual</p><p className="text-5xl font-black text-[#F5F0EB]">{auditB.score}</p></div>
                           <div className="text-right"><p className="text-[10px] text-[#A8A29E] uppercase font-black tracking-widest">Desperdicio</p><p className="text-2xl font-black text-[#E07070]">-${wasteB}</p></div>
                         </div>
                       </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-black text-[#F5F0EB] mb-2 flex items-center gap-3">
                        <CheckSquare className="text-[#F3C3B2]" /> Evaluación de ejecución
                      </h3>
                      <ComparacionHallazgosBloque
                        tituloSeccion="Fugas críticas"
                        listaA={fugasA}
                        listaB={fugasB}
                        columnas={{
                          aplicadas: {
                            titulo: "Fugas tapadas",
                            subtitulo: "Buen trabajo",
                            Icon: CheckCircle2,
                            headerBg: "bg-[#10B981]/10",
                            headerBorder: "border-[#10B981]/20",
                            iconWrap: "bg-[#10B981]/20",
                            iconColor: "text-[#10B981]",
                            titleColor: "text-[#10B981]",
                            cardBorder: "border-[#10B981]/30",
                            cardBorderLeft: "border-l-[#10B981]",
                            lineThrough: true,
                            emptyText: "No se taparon fugas pasadas.",
                          },
                          persistentes: {
                            titulo: "Fugas ignoradas",
                            subtitulo: "Siguen drenando plata",
                            Icon: AlertTriangle,
                            headerBg: "bg-[#EAB308]/10",
                            headerBorder: "border-[#EAB308]/20",
                            iconWrap: "bg-[#EAB308]/20",
                            iconColor: "text-[#EAB308]",
                            titleColor: "text-[#EAB308]",
                            cardBorder: "border-[#EAB308]/30",
                            cardBorderLeft: "border-l-[#EAB308]",
                            emptyText: "Sin fugas arrastradas.",
                          },
                          nuevas: {
                            titulo: "Nuevos fuegos",
                            subtitulo: "Problemas nuevos",
                            Icon: Zap,
                            headerBg: "bg-[#E07070]/10",
                            headerBorder: "border-[#E07070]/20",
                            iconWrap: "bg-[#E07070]/20",
                            iconColor: "text-[#E07070]",
                            titleColor: "text-[#E07070]",
                            cardBorder: "border-[#E07070]/30",
                            cardBorderLeft: "border-l-[#E07070]",
                            emptyText: "No hay problemas nuevos.",
                          },
                        }}
                      />
                      <ComparacionHallazgosBloque
                        tituloSeccion="Oportunidades de mejora"
                        listaA={mejorasA}
                        listaB={mejorasB}
                        columnas={{
                          aplicadas: {
                            titulo: "Mejoras aplicadas",
                            subtitulo: "Avance real",
                            Icon: CheckCircle2,
                            headerBg: "bg-[#10B981]/10",
                            headerBorder: "border-[#10B981]/20",
                            iconWrap: "bg-[#10B981]/20",
                            iconColor: "text-[#10B981]",
                            titleColor: "text-[#10B981]",
                            cardBorder: "border-[#10B981]/30",
                            cardBorderLeft: "border-l-[#10B981]",
                            lineThrough: true,
                            emptyText: "No se cerraron mejoras pendientes.",
                          },
                          persistentes: {
                            titulo: "Mejoras pendientes",
                            subtitulo: "Siguen en la lista",
                            Icon: AlertTriangle,
                            headerBg: "bg-[#EAB308]/10",
                            headerBorder: "border-[#EAB308]/20",
                            iconWrap: "bg-[#EAB308]/20",
                            iconColor: "text-[#EAB308]",
                            titleColor: "text-[#EAB308]",
                            cardBorder: "border-[#EAB308]/30",
                            cardBorderLeft: "border-l-[#EAB308]",
                            emptyText: "Sin mejoras arrastradas.",
                          },
                          nuevas: {
                            titulo: "Nuevas oportunidades",
                            subtitulo: "Aparecieron después",
                            Icon: Zap,
                            headerBg: "bg-[#D4A843]/10",
                            headerBorder: "border-[#D4A843]/20",
                            iconWrap: "bg-[#D4A843]/10",
                            iconColor: "text-[#D4A843]",
                            titleColor: "text-[#D4A843]",
                            cardBorder: "border-[#D4A843]/30",
                            cardBorderLeft: "border-l-[#D4A843]",
                            emptyText: "No hay mejoras nuevas.",
                          },
                        }}
                      />
                    </div>
                  </div>
                 );
              })()}

              {/* VISTA: LECTURA DE REPORTE INDIVIDUAL */}
              {vista === "reporte_lectura" && reporte && auditoriaActiva && (
                <div className="animate-fade-custom relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-6">
                  <div className="mb-2 flex flex-wrap justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={volverAlHistorialReportes}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-[#292524] border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] font-bold transition-colors text-sm"
                    >
                      <ArrowLeft size={18} />
                    </button>

                     <button
                       type="button"
                       disabled={pdfExportDisabled || pdfDescargandoId !== null}
                       title={pdfExportDisabled ? "Límite mensual de PDFs alcanzado" : undefined}
                       onClick={() => void handleDescargarPdfHistorial(auditoriaActiva)}
                       className="bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] disabled:opacity-50 px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                     >
                      {pdfDescargandoId === auditoriaActivaId ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileText size={14} />
                      )}
                      Exportar PDF
                    </button>
                  </div>

                  <LecturaAuditoriaView
                    reporte={reporte}
                    score={auditoriaActiva.score}
                    fechaLabel={parseDate(auditoriaActiva.created_at ?? "")}
                    labels={{
                      score: t[idioma].score,
                      puntajeBasado: t[idioma].puntajeBasado,
                      problemas: t[idioma].problemas,
                      mejoras: t[idioma].mejoras,
                    }}
                    modoHistorico={esAuditoriaHistorica(
                      auditoriaActiva?.id,
                      ultimaAuditoria?.id
                    )}
                    locale={locale}
                    onAbrirResumenFacil={() => setResumenFacilAbierto(true)}
                  />
                </div>
              )}

              {vista === "perfil" && (
                <ConfiguracionView
                  session={session}
                  perfil={perfil}
                  usageSnapshot={usageSnapshot}
                  agenciaNombre={agenciaNombre}
                  setAgenciaNombre={setAgenciaNombre}
                  agenciaLogo={agenciaLogo}
                  agenciaWeb={agenciaWeb}
                  setAgenciaWeb={setAgenciaWeb}
                  agenciaPie={agenciaPie}
                  setAgenciaPie={setAgenciaPie}
                  uploading={uploading}
                  loading={loading}
                  onSubirLogo={subirLogo}
                  onGuardar={guardarAjustesAgencia}
                  onIrFacturacion={() => navegar("facturacion", "/facturacion")}
                  currencyCodeLabel={currencyCodeActiva}
                  googleAdsConnected={googleAdsConnected}
                  googleAdsChecking={googleAdsChecking}
                  onConectarGoogleAds={() => void conectarGoogleAds()}
                />
              )}

              {/* VISTA: FACTURACIÓN */}
              {vista === "facturacion" && (
                <div className="animate-fade-custom bg-[#FFFFFF] border border-[#E5E7EB] p-10 rounded-[2rem] shadow-sm max-w-3xl mx-auto print:hidden relative z-10 w-full">
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#F4F4F5]">
                     <div className="w-14 h-14 bg-[#F4F4F5] border border-[#E5E7EB] shadow-sm rounded-2xl flex items-center justify-center text-[#0a0a0a]"><CreditCard size={24} /></div>
                     <div>
                        <h2 className="text-3xl font-black text-[#0a0a0a]">{t[idioma].facturacionTitulo}</h2>
                        <p className="text-[#4B5563] text-sm mt-1 font-medium">{t[idioma].facturacionDesc}</p>
                     </div>
                  </div>
                  <div className="bg-[#F4F4F5] border border-[#E5E7EB] rounded-2xl p-8 mb-8 flex justify-between items-center shadow-inner">
                    <div>
                      <p className="text-[10px] font-bold text-[#8A968C] uppercase tracking-widest mb-3">{t[idioma].planActual}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-[#0a0a0a]">{perfil?.plan === 'pro' ? 'Mora Pro' : 'Mora Free'}</span>
                        <span className="px-3 py-1 rounded-md text-[10px] font-black bg-[#FAFAF9] border border-[#10B981] text-[#10B981] uppercase tracking-widest shadow-sm">{t[idioma].activa}</span>
                      </div>
                      <p className="text-sm text-[#4B5563] mt-3 font-medium">Renueva el 14 de Abril, 2026</p>
                    </div>
                  </div>
                  <button className="w-full text-[#4B5563] bg-[#FAFAF9] border border-[#E5E7EB] hover:bg-white px-6 py-4 rounded-xl text-sm font-black transition-colors mt-2 flex justify-center items-center gap-2 cursor-not-allowed shadow-sm uppercase tracking-widest"><CreditCard size={18} /> {t[idioma].gestionarSuscripcion} <span className="text-[#E0E7FF] text-[9px] uppercase tracking-widest ml-2 bg-[#E0E7FF]/10 px-2 py-0.5 rounded">{t[idioma].pronto}</span></button>
                </div>
              )}

              {vista === "campañas" && renderGestorCampañas()}

              </div>
            </main>
          </>
        )}
      </div>

      {/* CONFIRMACIÓN ACCIÓN PACING */}
      {pacingAccionPendiente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm cursor-pointer" onClick={() => setPacingAccionPendiente(null)}></div>
          <div className="bg-[#FAFAF9] border border-[#E5E7EB] shadow-2xl rounded-3xl w-full max-w-md relative z-10 animate-fade-custom overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#F3C3B2]"></div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F3C3B2]/10 border border-[#F3C3B2]/30 flex items-center justify-center text-[#F3C3B2] flex-shrink-0 shadow-sm">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0a0a0a] leading-tight">Confirmar ajuste de presupuesto</h3>
                  <p className="text-xs text-[#8A968C] mt-1 font-bold uppercase tracking-widest">{pacingAccionPendiente.campanaNombre}</p>
                </div>
              </div>

              <div className="bg-[#F4F4F5] border border-[#E5E7EB] rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-[#8A968C] font-black uppercase tracking-widest mb-2">Presupuesto mensual</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-[#8A968C] uppercase font-bold">Antes</p>
                    <p className="text-lg font-black text-[#4B5563]">
                      {pacingAccionPendiente.valorAnterior > 0
                        ? `$${pacingAccionPendiente.valorAnterior.toLocaleString()}`
                        : "Sin definir"}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#8A968C] shrink-0" />
                  <div className="text-right">
                    <p className="text-[10px] text-[#8A968C] uppercase font-bold">Después</p>
                    <p className="text-lg font-black text-[#0a0a0a]">${pacingAccionPendiente.valorPropuesto.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <p className="text-[#4B5563] text-sm leading-relaxed mb-2 font-medium">{pacingAccionPendiente.motivo}</p>
              <p className="text-[#8A968C] text-xs leading-relaxed mb-6">{pacingAccionPendiente.impacto}</p>
              <p className="text-[10px] text-[#8A968C] font-bold uppercase tracking-widest mb-6">
                Mora no aplicará este cambio hasta que lo confirmes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setPacingAccionPendiente(null)}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-[#4B5563] bg-[#F4F4F5] border border-[#E5E7EB] hover:bg-[#FFFFFF] transition-colors w-full uppercase tracking-widest shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAccionPacing}
                  className="px-5 py-3 rounded-xl font-black text-xs text-[#0a0a0a] bg-[#F3C3B2] hover:bg-[#eab3a1] transition-colors w-full flex justify-center items-center gap-2 uppercase tracking-widest shadow-md"
                >
                  <Sparkles size={16} /> Confirmar y aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN ROBIN HOOD */}
      {robinAccionPendiente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm cursor-pointer" onClick={() => setRobinAccionPendiente(null)}></div>
          <div className="bg-[#FAFAF9] border border-[#E5E7EB] shadow-2xl rounded-3xl w-full max-w-2xl relative z-10 animate-fade-custom overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4A843]"></div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#D4A843]/10 border border-[#D4A843]/30 flex items-center justify-center text-[#D4A843] flex-shrink-0 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0a0a0a] leading-tight">Aplicar Robin Hood con red de seguridad</h3>
                  <p className="text-xs text-[#8A968C] mt-1 font-bold uppercase tracking-widest">
                    Preview, confirmación, verificación y Undo
                  </p>
                </div>
              </div>

              <p className="text-[#4B5563] text-sm leading-relaxed mb-4 font-medium">{robinAccionPendiente.reason}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 max-h-72 overflow-y-auto pr-1">
                {robinAccionPendiente.changes.map(change => (
                  <div key={`${change.targetId}-${change.after}`} className="bg-[#F4F4F5] border border-[#E5E7EB] rounded-2xl p-4">
                    <p className="text-[10px] text-[#8A968C] font-black uppercase tracking-widest truncate">{change.targetName}</p>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div>
                        <p className="text-[10px] text-[#8A968C] uppercase font-bold">Antes</p>
                        <p className="text-lg font-black text-[#4B5563]">${change.before.toLocaleString()}</p>
                      </div>
                      <ArrowRight size={16} className="text-[#8A968C] shrink-0" />
                      <div className="text-right">
                        <p className="text-[10px] text-[#8A968C] uppercase font-bold">Después</p>
                        <p className={`text-lg font-black ${change.after > change.before ? "text-[#10B981]" : "text-[#E07070]"}`}>
                          ${change.after.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8A968C] mt-2 leading-snug">{change.reason}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 mb-6">
                <p className="text-[10px] text-[#10B981] font-black uppercase tracking-widest mb-1">Contrato de seguridad</p>
                <p className="text-xs text-[#4B5563] font-bold leading-relaxed">
                  Mora validará que los presupuestos no hayan cambiado, aplicará el plan, verificará el resultado y habilitará Undo. Si detecta inconsistencia, detendrá la operación y marcará revisión manual.
                </p>
                <p className="text-[9px] text-[#8A968C] font-bold uppercase tracking-widest mt-2">
                  Registros Safe Apply en sesión: {safeApplyAuditLog.length}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setRobinAccionPendiente(null)} className="px-5 py-3 rounded-xl font-bold text-xs text-[#4B5563] bg-[#F4F4F5] border border-[#E5E7EB] hover:bg-[#FFFFFF] transition-colors w-full uppercase tracking-widest shadow-sm">Cancelar</button>
                <button onClick={confirmarAccionRobin} className="px-5 py-3 rounded-xl font-black text-xs text-[#0a0a0a] bg-[#D4A843] hover:bg-[#e6bd55] transition-colors w-full flex justify-center items-center gap-2 uppercase tracking-widest shadow-md">
                  <Sparkles size={16} /> Confirmar y aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN AUTO-APPLY */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm cursor-pointer" onClick={() => setMostrarConfirmacion(false)}></div>
          <div className="bg-[#FAFAF9] border border-[#E5E7EB] shadow-2xl rounded-3xl w-full max-w-md relative z-10 animate-fade-custom overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#EAB308]"></div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] flex-shrink-0 shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0a0a0a] leading-tight">Confirmar Acción</h3>
                  <p className="text-xs text-[#8A968C] mt-1 font-bold uppercase tracking-widest">Atención requerida</p>
                </div>
              </div>
              <p className="text-[#4B5563] text-sm leading-relaxed mb-8 font-medium">
                Estás por marcar esta tarea como lista. ¿Confirmás que ya aplicaste estos cambios en tu cuenta de Google Ads?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setMostrarConfirmacion(false)} className="px-5 py-3 rounded-xl font-bold text-xs text-[#4B5563] bg-[#F4F4F5] border border-[#E5E7EB] hover:bg-[#FFFFFF] transition-colors w-full uppercase tracking-widest shadow-sm">Cancelar</button>
                <button onClick={aplicarCambios} className="px-5 py-3 rounded-xl font-black text-xs text-[#0a0a0a] bg-[#E0E7FF] hover:bg-[#eab3a1] transition-colors w-full flex justify-center items-center gap-2 uppercase tracking-widest shadow-md"><Sparkles size={16} /> Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST PACING CON UNDO */}
      {pacingToast.show && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[125] bg-[#FAFAF9] border border-[#E5E7EB] shadow-2xl rounded-2xl overflow-hidden flex flex-col w-96 animate-fade-custom print:hidden">
          <div className="p-5 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {pacingToast.status === "success" && <CheckCircle2 className="text-[#10B981] shrink-0" size={24} />}
              {pacingToast.status === "undoing" && <RefreshCcw className="text-[#EAB308] animate-spin shrink-0" size={24} />}
              {pacingToast.status === "reverted" && <Undo2 className="text-[#4B5563] shrink-0" size={24} />}
              {pacingToast.status === "review" && <AlertTriangle className="text-[#E07070] shrink-0" size={24} />}
              <div className="min-w-0">
                <p className="text-sm font-black text-[#0a0a0a] truncate">{pacingToast.message}</p>
                {pacingToast.status === "success" && (
                  <p className="text-[10px] text-[#8A968C] font-bold uppercase tracking-widest mt-0.5">
                    Deshacer disponible por {pacingToast.timeLeft}s
                  </p>
                )}
              </div>
            </div>
            {pacingToast.status === "success" && pacingUndo && (
              <button
                onClick={deshacerAccionPacing}
                className="shrink-0 text-[#0a0a0a] font-black text-[9px] uppercase tracking-widest transition-colors px-3 py-2 bg-[#FDE8D3] hover:bg-[#E0E7FF] rounded-lg shadow-sm border border-[#E0E7FF]/50"
              >
                Deshacer
              </button>
            )}
          </div>
          {pacingToast.status === "success" && (
            <div className="w-full bg-[#F4F4F5] h-1.5 border-t border-[#E5E7EB]">
              <div
                className="bg-[#10B981] h-1.5 transition-all duration-1000 ease-linear"
                style={{ width: `${(pacingToast.timeLeft / 10) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* TOAST DE ÉXITO */}
      {toastState.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[120] bg-[#FAFAF9] border border-[#E5E7EB] shadow-2xl rounded-2xl overflow-hidden flex flex-col w-80 animate-fade-custom">
           <div className="p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 {toastState.status === 'success' && <CheckCircle2 className="text-[#10B981]" size={24} />}
                 {toastState.status === 'undoing' && <RefreshCcw className="text-[#EAB308] animate-spin" size={24} />}
                 {toastState.status === 'reverted' && <Undo2 className="text-[#4B5563]" size={24} />}
                 <div>
                    <p className="text-sm font-black text-[#0a0a0a]">
                      {toastState.status === 'success' ? 'Tarea completada.' : 
                       toastState.status === 'undoing' ? 'Deshaciendo...' : 'Revertido.'}
                    </p>
                    {toastState.status === 'success' && <p className="text-[10px] text-[#8A968C] font-bold uppercase tracking-widest mt-0.5">Se cierra en {toastState.timeLeft}s</p>}
                 </div>
              </div>
              {toastState.status === 'success' && (
                <button onClick={deshacerCambios} className="text-[#0a0a0a] font-black text-[9px] uppercase tracking-widest transition-colors px-3 py-2 bg-[#FDE8D3] hover:bg-[#E0E7FF] rounded-lg shadow-sm border border-[#E0E7FF]/50">Deshacer</button>
              )}
           </div>
           {toastState.status === 'success' && (
              <div className="w-full bg-[#F4F4F5] h-1.5 border-t border-[#E5E7EB]">
                 <div className="bg-[#10B981] h-1.5 transition-all duration-1000 ease-linear" style={{ width: `${(toastState.timeLeft / 15) * 100}%` }}></div>
              </div>
           )}
        </div>
      )}

      <FeedbackFab active={status === "authenticated"} />
    </>
  );
}

export default function AuditorPageWrapper({
  initialVista = "dashboard",
  initialCampanasQuery,
}: {
  initialVista?: AuditorVista | "feedback";
  initialCampanasQuery?: CampanasQueryInicial;
} = {}) {
  const vistaInicial =
    initialVista === "feedback" ? "dashboard" : initialVista;
  return (
    <LocaleProvider>
      <AuditorDashboard
        initialVista={vistaInicial}
        initialCampanasQuery={initialCampanasQuery}
      />
    </LocaleProvider>
  );
}