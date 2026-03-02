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
  
  // 💳 ESTADOS DE PAGO Y PERFIL
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

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
      nueva: "➕ Nueva Auditoría",
      historial: "🗂️ Mis Clientes",
      agencia: "⚙️ Mi Agencia",
      feedback: "💬 Feedback",
      salir: "Cerrar Sesión",
      placeholderNombre: "Nombre del Cliente o Cuenta",
      placeholderDatos: "Pegá acá los datos de la campaña...",
      btnAnalizar: "Ejecutar Auditoría",
      btnAnalizando: "Analizando métricas...",
      exportar: "📄 Exportar a PDF",
      problemas: "🔴 Problemas Graves",
      mejoras: "🟡 Áreas Débiles",
      aciertos: "🟢 Puntos Fuertes",
      score: "Score General",
      enviarFeedback: "Enviar Mensaje",
      feedbackExito: "¡Gracias por tu feedback! Nos ayuda a mejorar.",
    },
    en: {
      nueva: "➕ New Audit",
      historial: "🗂️ My Clients",
      agencia: "⚙️ My Agency",
      feedback: "💬 Feedback",
      salir: "Sign Out",
      placeholderNombre: "Client or Account Name",
      placeholderDatos: "Paste campaign data here...",
      btnAnalizar: "Run Audit",
      btnAnalizando: "Analyzing metrics...",
      exportar: "📄 Export to PDF",
      problemas: "🔴 Critical Issues",
      mejoras: "🟡 Weak Areas",
      aciertos: "🟢 Strengths",
      score: "Overall Score",
      enviarFeedback: "Send Message",
      feedbackExito: "Thanks for your feedback! It helps us improve.",
    }
  };

  const descargarPDF = () => {
    window.print();
  };

  const obtenerPerfil = async () => {
    if (!session?.user?.email) return;
    const { data: userProfile } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('email', session.user.email)
      .single();
    
    setPerfil(userProfile);
    if (userProfile?.agencia_nombre) setAgenciaNombre(userProfile.agencia_nombre);
    if (userProfile?.agencia_logo) setAgenciaLogo(userProfile.agencia_logo);
  };

  const cargarHistorial = async () => {
    if (!session?.user?.email) return;
    setCargandoHistorial(true);
    const { data: registros, error } = await supabase
      .from('historial_auditorias')
      .select('*')
      .eq('usuario_email', session.user.email);
      
    if (!error && registros) {
      setHistorial(registros.reverse()); 
    }
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
    
    const { error } = await supabase
      .from('feedback')
      .insert([{ usuario_email: session.user.email, mensaje: mensajeFeedback }]);
      
    if (!error) {
      alert(t[idioma].feedbackExito);
      setMensajeFeedback("");
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
      
      // LA MAGIA DEL IDIOMA: Le decimos a Gemini en qué idioma redactar
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

  if (status === "loading") return <div className="flex-grow flex justify-center items-center text-xl font-bold text-slate-500">Cargando...</div>;

  if (!session) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-slate-100 text-center max-w-md w-full mx-4">
          <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"><span className="text-3xl">🐾</span></div>
          <h1 className="text-3xl font-black mb-2 text-slate-800">Mora</h1>
          <p className="text-slate-500 mb-8 font-medium">Iniciá sesión de forma segura para auditar tus campañas.</p>
          <button onClick={() => signIn("google")} className="w-full bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm">
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans print:p-0 print:m-0 print:max-w-none">
      
      {/* HEADER DE USUARIO Y SELECTOR DE IDIOMA */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-4">
          {session.user?.image && <img src={session.user.image} alt="Perfil" className="w-10 h-10 rounded-full" />}
          <div>
            <p className="font-bold text-slate-800 leading-tight">{session.user?.name}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${perfil?.plan === 'pro' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                Plan: {perfil?.plan || 'free'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* SWITCH DE IDIOMA */}
          <button 
            onClick={() => setIdioma(idioma === "es" ? "en" : "es")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            {idioma === "es" ? "🇺🇸 EN" : "🇪🇸 ES"}
          </button>
          
          <button onClick={() => signOut()} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-all">
            {t[idioma].salir}
          </button>
        </div>
      </div>

      {/* BOTONERA PRINCIPAL */}
      <div className="flex flex-wrap gap-4 mb-8 print:hidden">
        <button onClick={() => { setVista("nueva"); setMostrarPagos(false); setReporte(null); }} className={`flex-1 min-w-[150px] py-3 rounded-xl font-bold text-sm md:text-lg transition-all ${vista === "nueva" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}>
          {t[idioma].nueva}
        </button>
        <button onClick={() => { setVista("historial"); setMostrarPagos(false); }} className={`flex-1 min-w-[150px] py-3 rounded-xl font-bold text-sm md:text-lg transition-all ${vista === "historial" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}>
          {t[idioma].historial}
        </button>
        <button onClick={() => { setVista("perfil"); setMostrarPagos(false); }} className={`flex-1 min-w-[150px] py-3 rounded-xl font-bold text-sm md:text-lg transition-all ${vista === "perfil" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}>
          {t[idioma].agencia}
        </button>
        <button onClick={() => { setVista("feedback"); setMostrarPagos(false); }} className={`flex-1 min-w-[150px] py-3 rounded-xl font-bold text-sm md:text-lg transition-all ${vista === "feedback" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}>
          {t[idioma].feedback}
        </button>
      </div>

      {/* VISTA: FEEDBACK */}
      {vista === "feedback" && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 print:hidden max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">💡</div>
          <h2 className="text-3xl font-black mb-2 text-slate-800">{idioma === 'es' ? 'Ayudanos a mejorar Mora' : 'Help us improve Mora'}</h2>
          <p className="text-slate-500 mb-8">{idioma === 'es' ? '¿Qué función te gustaría ver en el futuro? ¿Encontraste algún error?' : 'What feature would you like to see? Did you find any bugs?'}</p>
          
          <textarea 
            className="w-full h-32 p-4 border-2 border-slate-200 rounded-xl mb-6 text-black focus:border-indigo-500 outline-none transition-all"
            placeholder={idioma === 'es' ? 'Escribí tu sugerencia acá...' : 'Write your suggestion here...'}
            value={mensajeFeedback}
            onChange={(e) => setMensajeFeedback(e.target.value)}
          />
          <button 
            onClick={mandarFeedback} 
            disabled={enviandoFeedback || !mensajeFeedback}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-md w-full"
          >
            {enviandoFeedback ? "..." : t[idioma].enviarFeedback}
          </button>
        </div>
      )}

      {/* VISTA: MI AGENCIA */}
      {vista === "perfil" && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 print:hidden max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-2 text-slate-800">{t[idioma].agencia} 🏢</h2>
          
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre / Name</label>
              <input type="text" className="w-full p-4 border-2 border-slate-200 rounded-xl text-black" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Logo</label>
              <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                {agenciaLogo ? <img src={agenciaLogo} alt="Logo" className="w-20 h-20 object-contain" /> : <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-2">Sin logo</div>}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={subirLogo} disabled={uploading} className="w-full text-sm text-slate-500 cursor-pointer" />
                </div>
              </div>
            </div>
            <button onClick={guardarAjustesAgencia} disabled={loading || uploading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 w-full mt-4">
              {loading ? "..." : "Guardar / Save"}
            </button>
          </div>
        </div>
      )}

      {/* VISTA: NUEVA AUDITORÍA */}
      {vista === "nueva" && (
        <div className="print:hidden">
          {mostrarPagos ? (
             <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center animate-fade-in">
             <div className="text-5xl mb-4">🛑</div>
             <h2 className="text-3xl font-black mb-4 text-slate-800">¡Límite Gratuito Alcanzado!</h2>
             {/* ... Bloque de pagos omitido por brevedad visual, sigue existiendo su logica ... */}
             <div className="flex gap-4 justify-center mt-6">
                <button onClick={() => procesarPago('credito')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Comprar 1 Reporte ($5)</button>
                <button onClick={() => procesarPago('pro')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">Pase Pro ($29/mes)</button>
             </div>
             <button onClick={() => setMostrarPagos(false)} className="mt-8 text-slate-400 hover:text-slate-600 font-medium underline">Volver atrás</button>
           </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
              <h1 className="text-4xl font-black mb-2 text-slate-800">Auditor Inteligente 🔍</h1>
              <input type="text" placeholder={t[idioma].placeholderNombre} className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 text-black" value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} />
              <textarea className="w-full h-48 p-4 border-2 border-slate-200 rounded-xl mb-6 text-black" placeholder={t[idioma].placeholderDatos} value={data} onChange={(e) => setData(e.target.value)} />
              <button onClick={analizarCampaña} disabled={loading || !data} className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-xl hover:bg-indigo-700 disabled:bg-slate-300 shadow-lg">
                {loading ? t[idioma].btnAnalizando : t[idioma].btnAnalizar}
              </button>
            </div>
          )}
        </div>
      )}

      {/* REPORTE Y PDF (Traducciones aplicadas a los títulos y puntajes) */}
      {reporte && !mostrarPagos && (
        <div className="mt-10 bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:mt-0 print:p-0">
          
          <div className="hidden print:flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-6">
            <div>
              {perfil?.agencia_logo ? <img src={perfil.agencia_logo} alt="Logo" className="h-16 object-contain" /> : <div className="flex items-center gap-2"><span className="text-3xl">🐾</span><span className="text-3xl font-black text-slate-800">Mora</span></div>}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800">{perfil?.agencia_nombre ? perfil.agencia_nombre : "Reporte / Report"}</h2>
              <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 print:mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-500 uppercase tracking-wider mb-1 print:text-sm">{nombreCuenta || '---'}</h2>
              <h3 className="text-4xl font-black text-slate-800">{t[idioma].score}: {reporte.score_general}/100</h3>
            </div>
            <button onClick={descargarPDF} className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition-all shadow-md print:hidden flex items-center gap-2">
              {t[idioma].exportar}
            </button>
          </div>
          
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Estructura</b> <br/> {reporte.sub_scores?.estructura}/100</div>
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Conversiones</b> <br/> {reporte.sub_scores?.conversiones}/100</div>
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Presupuesto</b> <br/> {reporte.sub_scores?.presupuesto}/100</div>
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Keywords</b> <br/> {reporte.sub_scores?.keywords}/100</div>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-xl print:bg-white print:border-l-2 print:border-slate-300">
              <h3 className="text-xl font-bold text-red-700 mb-2 print:text-slate-800">{t[idioma].problemas}</h3>
              {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => <p key={i} className="mb-2 text-red-900 print:text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4 rounded-r-xl print:bg-white print:border-l-2 print:border-slate-300">
              <h3 className="text-xl font-bold text-yellow-700 mb-2 print:text-slate-800">{t[idioma].mejoras}</h3>
              {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => <p key={i} className="mb-2 text-yellow-900 print:text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
            </div>
            <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-xl print:bg-white print:border-l-2 print:border-slate-300">
              <h3 className="text-xl font-bold text-green-700 mb-2 print:text-slate-800">{t[idioma].aciertos}</h3>
              {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => <p key={i} className="mb-2 text-green-900 print:text-slate-700"><b>{item.titulo}:</b> {item.descripcion}</p>)}
            </div>
          </div>
        </div>
      )}

      {/* VISTA: HISTORIAL */}
      {vista === "historial" && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 print:hidden">
          <h2 className="text-3xl font-black mb-6 text-slate-800">{t[idioma].historial} 💼</h2>
          {cargandoHistorial ? <p className="text-slate-500 font-medium text-center py-10">...</p> : historial.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <button onClick={() => setVista("nueva")} className="text-indigo-600 font-bold hover:underline">Vacio / Empty</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historial.map((item, index) => (
                <div key={index} className="border-2 border-slate-100 p-6 rounded-xl hover:border-indigo-300 transition-all cursor-pointer" onClick={() => { setReporte(item.reporte_json); setNombreCuenta(item.nombre_cuenta); setVista("nueva"); }}>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{item.nombre_cuenta}</h3>
                  <p className="text-sm text-slate-500">{t[idioma].score}: <span className="text-slate-700 font-bold">{item.score}/100</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditorPageWrapper() {
  return <SessionProvider><AuditorDashboard /></SessionProvider>;
}