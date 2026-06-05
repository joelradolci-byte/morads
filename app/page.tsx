"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, FileText, LayoutGrid, Search, TrendingUp, Upload
} from 'lucide-react';
import { supabase } from "../lib/supabase/browser";
import { PRO_PRICE_LABEL, PRO_PRICE_PER_MONTH } from "../lib/usage/config";

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

export default function LandingPage() {
  const router = useRouter();
  const [session] = useState<any>(null);
  const [status, setStatus] = useState("loading");
  const [idioma, setIdioma] = useState<"es" | "en">("es");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
        return;
      }
      setStatus("unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (supaSession) {
        router.replace("/dashboard");
      } else {
        setStatus("unauthenticated");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const iniciarSesion = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: 'https://www.googleapis.com/auth/adwords',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
  };

  const iniciarEvaluacion = iniciarSesion;

  const activarWatchdog = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = "/facturacion?pay=1";
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/facturacion?pay=1`,
        scopes: "https://www.googleapis.com/auth/adwords",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const t: Record<"es" | "en", { login: string }> = {
    es: { login: "Iniciar sesión" },
    en: { login: "Log In" },
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
        
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOutBg { from { opacity: 1; } to { opacity: 0; } }
        
        .animate-slide-in-right { animation: slideInRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-out-right { animation: slideOutRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-fade-in-bg { animation: fadeInBg 0.5s ease-out forwards; }
        .animate-fade-out-bg { animation: fadeOutBg 0.5s ease-out forwards; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #44403C; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #A8A29E; }

        @keyframes shrinkBar { from { width: '100%'; } to { width: '0%'; } }
        .animate-shrink-bar { animation: shrinkBar 9.5s linear forwards; }

        @keyframes shrinkBar { from { width: '100%'; } to { width: '0%'; } }
        .animate-shrink-bar { animation: shrinkBar 9.5s linear forwards; }

        @keyframes vaciarBarra { from { width: 100%; } to { width: 0%; } }
        .animate-barra-tiempo { animation: vaciarBarra 9.5s linear forwards; }
        
        @keyframes deslizarAfuera { to { transform: translateX(150%); opacity: 0; } }
        .animate-salida-total { animation: deslizarAfuera 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
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
                <button onClick={() => setIdioma(idioma === "es" ? "en" : "es")} className="text-sm font-bold text-[#4B5563] hover:text-[#0a0a0a] transition-colors uppercase hidden sm:block">
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
                <div className="text-center mb-12">
                  <p className="inline-block px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase text-[#0a0a0a] bg-[#DAEBE3] mb-4">Precios Simples</p>
                  <h2 className="text-4xl md:text-5xl font-serif font-black text-[#0a0a0a] mb-4">Elegí tu camino.</h2>
                  <p className="text-[#4B5563] font-medium max-w-xl mx-auto">
                    14 días de evaluación sin tarjeta al conectar Google Ads.
                  </p>
                </div>

                <div className="max-w-lg mx-auto">
                  <TiltWrapper>
                    <div className="bg-white/60 backdrop-blur-sm border-2 border-[#10B981]/40 p-10 rounded-[2rem] flex flex-col justify-between hover:bg-white transition-colors shadow-sm h-full">
                      <div>
                        <h3 className="text-2xl font-bold text-[#0a0a0a] mb-2">Mora Watchdog</h3>
                        <p className="text-[#4B5563] mb-8 text-sm font-medium">Para auditar y optimizar tu cuenta cada semana.</p>
                        <div className="text-5xl font-black text-[#0a0a0a] mb-8">
                          {PRO_PRICE_LABEL}
                          <span className="text-lg text-[#4B5563] font-medium">/mes</span>
                        </div>
                        <ul className="space-y-4 mb-10 text-sm font-medium text-[#0a0a0a]">
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Hasta 30 auditorías con IA / mes</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Hasta 20 generaciones de anuncios RSA / mes</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Hasta 60 PDFs / mes · marca blanca</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> PDF de comparación entre auditorías</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Aplicar cambios en Google Ads (con tu confirmación)</li>
                          <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#10B981]" strokeWidth={3} /> Historial y comparación completos</li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-3 mt-auto">
                        <button
                          type="button"
                          onClick={() => void iniciarEvaluacion()}
                          className="w-full bg-[#0a0a0a] hover:bg-[#262B27] text-white font-bold py-4 rounded-xl transition-colors shadow-md"
                        >
                          Empezar evaluación
                        </button>
                        <button
                          type="button"
                          onClick={() => void activarWatchdog()}
                          className="w-full bg-white hover:bg-[#E0E7FF] text-[#0a0a0a] font-bold py-3.5 rounded-xl transition-colors border border-[#E5E7EB] text-sm"
                        >
                          Activar Watchdog — {PRO_PRICE_PER_MONTH}
                        </button>
                      </div>
                    </div>
                  </TiltWrapper>
                </div>
              </section>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <section className="max-w-5xl mx-auto px-8 md:px-10 py-24 mb-12 border-t border-[#CFD6C4]/40">
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
        ) : null}
      </div>
    </>
  );
}
