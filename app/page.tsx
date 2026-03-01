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

  const [vista, setVista] = useState<"nueva" | "historial">("nueva");
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // 💳 ESTADOS DE PAGO Y PERFIL
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  const descargarPDF = () => {
    window.print();
  };

  // 🔄 NUEVA FUNCIÓN: Obtiene el plan y créditos del usuario
  const obtenerPerfil = async () => {
    if (!session?.user?.email) return;
    const { data: userProfile } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('email', session.user.email)
      .single();
    
    setPerfil(userProfile);
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

  // Sincronizamos el perfil al cargar o al cambiar de reporte
  useEffect(() => {
    if (session) {
      obtenerPerfil();
    }
    if (vista === "historial") {
      cargarHistorial();
    }
  }, [vista, session, reporte]);

  const procesarPago = async (tipo: 'credito' | 'pro') => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, tipo })
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error al ir a pagar:", error);
      alert("Hubo un problema al conectar con el banco.");
    }
  };

  const analizarCampaña = async () => {
    if (!session?.user?.email) return;
    setLoading(true);

    try {
      const { count } = await supabase
        .from('historial_auditorias')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_email', session.user.email);

      const esPro = perfil?.plan === 'pro';
      const tieneCreditos = (perfil?.creditos_extra || 0) > 0;
      const limiteGratisAlcanzado = (count || 0) >= 3;

      if (!esPro && !tieneCreditos && limiteGratisAlcanzado) {
        setMostrarPagos(true);
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Actúa como un auditor experto en Google Ads. Analiza estos datos y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
      {
        "score_general": 45,
        "sub_scores": {"estructura": 50, "conversiones": 20, "presupuesto": 60, "keywords": 40},
        "hallazgos": {
          "graves_rojo": [{"titulo": "Fuga", "descripcion": "Detalle"}],
          "debiles_amarillo": [{"titulo": "Mejora", "descripcion": "Detalle"}],
          "bien_verde": [{"titulo": "Acierto", "descripcion": "Detalle"}]
        },
        "recomendaciones": ["Usa palabras clave negativas"]
      }
      Datos de la campaña a analizar: ${data}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "");
      const parsedReporte = JSON.parse(text);
      
      setReporte(parsedReporte);

      await supabase
        .from('historial_auditorias')
        .insert([
          {
            usuario_email: session.user.email,
            score: parsedReporte.score_general,
            reporte_json: parsedReporte,
            nombre_cuenta: nombreCuenta || "Cuenta sin nombre"
          }
        ]);

      if (!esPro && tieneCreditos && perfil) {
        await supabase
          .from('suscripciones')
          .update({ creditos_extra: perfil.creditos_extra - 1 })
          .eq('email', session.user.email);
        
        // Actualizamos el estado local para que se vea el cambio de créditos de inmediato
        obtenerPerfil();
      }

    } catch (error) {
      console.error("Error completo:", error);
      alert("Error al analizar los datos. Revisá la consola.");
    }
    setLoading(false);
  };

  if (status === "loading") return <div className="flex justify-center items-center min-h-screen text-xl font-bold text-slate-500">Conectando con Google...</div>;

  if (!session) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-slate-100 text-center max-w-md w-full mx-4">
          <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-black mb-2 text-slate-800">MorAds</h1>
          <p className="text-slate-500 mb-8 font-medium">Iniciá sesión de forma segura para conectar tus campañas.</p>
          <button onClick={() => signIn("google")} className="w-full bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm">
            Continuar con Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto font-sans bg-gray-50 min-h-screen print:bg-white print:p-0 print:m-0">
      
      {/* HEADER ACTUALIZADO CON STATUS DE PLAN */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-4">
          {session.user?.image && <img src={session.user.image} alt="Perfil" className="w-10 h-10 rounded-full" />}
          <div>
            <p className="font-bold text-slate-800 leading-tight">{session.user?.name}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${perfil?.plan === 'pro' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                Plan: {perfil?.plan || 'free'}
              </span>
              {(perfil?.creditos_extra > 0) && (
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                  {perfil.creditos_extra} Créditos Extra
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => signOut()} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-all">
          Cerrar Sesión
        </button>
      </div>

      <div className="flex gap-4 mb-8 print:hidden">
        <button 
          onClick={() => { setVista("nueva"); setMostrarPagos(false); setReporte(null); }} 
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${vista === "nueva" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}
        >
          ➕ Nueva Auditoría
        </button>
        <button 
          onClick={() => { setVista("historial"); setMostrarPagos(false); }} 
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${vista === "historial" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"}`}
        >
          🗂️ Mis Clientes
        </button>
      </div>

      {vista === "nueva" && (
        <div className="print:hidden">
          {mostrarPagos ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center animate-fade-in">
              <div className="text-5xl mb-4">🛑</div>
              <h2 className="text-3xl font-black mb-4 text-slate-800">¡Límite Gratuito Alcanzado!</h2>
              <p className="text-slate-500 mb-8 text-lg">Ya probaste el poder de la IA. Para seguir detectando fugas de dinero, elegí un plan:</p>
              
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <div className="border-2 border-slate-200 p-6 rounded-xl flex-1 hover:border-blue-500 transition-all bg-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">1 Reporte Extra</h3>
                    <p className="text-4xl font-black mb-4">$5 <span className="text-lg text-slate-400 font-normal">USD</span></p>
                    <p className="text-slate-500 mb-6">Ideal para una auditoría rápida y puntual.</p>
                  </div>
                  <button onClick={() => procesarPago('credito')} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 shadow-md">
                    Comprar 1 Reporte
                  </button>
                </div>
                
                <div className="border-2 border-blue-500 p-6 rounded-xl flex-1 bg-gradient-to-b from-blue-50 to-white relative shadow-xl flex flex-col justify-between scale-105">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-sm">
                    Recomendado para Agencias
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-blue-900">Pase Pro</h3>
                    <p className="text-4xl font-black mb-4 text-blue-900">$29 <span className="text-lg text-blue-600 font-normal">USD/mes</span></p>
                    <p className="text-slate-600 mb-6 font-medium">Auditorías ilimitadas. Descargá todos los PDF que necesites todo el mes.</p>
                  </div>
                  <button onClick={() => procesarPago('pro')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200">
                    Suscribirse a Pro
                  </button>
                </div>
              </div>
              
              <button onClick={() => setMostrarPagos(false)} className="mt-8 text-slate-400 hover:text-slate-600 font-medium underline">
                Volver atrás
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
              <h1 className="text-4xl font-black mb-2 text-slate-800">Auditor Inteligente 🔍</h1>
              <p className="text-slate-500 mb-8">Detectá fugas de dinero en segundos con IA.</p>
              
              <input 
                type="text"
                placeholder="Nombre del Cliente o Cuenta"
                className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 text-black focus:border-blue-500 outline-none transition-all font-medium"
                value={nombreCuenta}
                onChange={(e) => setNombreCuenta(e.target.value)}
              />
              
              <textarea 
                className="w-full h-48 p-4 border-2 border-slate-200 rounded-xl mb-6 text-black focus:border-blue-500 outline-none transition-all"
                placeholder="Pegá acá los datos de la campaña..."
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
              <button onClick={analizarCampaña} disabled={loading || !data} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-200">
                {loading ? "Analizando métricas..." : "Ejecutar Auditoría"}
              </button>
            </div>
          )}

          {reporte && !mostrarPagos && (
            <div className="mt-10 bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:mt-0 print:p-0">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {nombreCuenta ? `Reporte: ${nombreCuenta}` : 'Reporte de Auditoría'}
                  </h2>
                  <h3 className="text-4xl font-black text-slate-800">Score General: {reporte.score_general}/100</h3>
                </div>
                <button onClick={descargarPDF} className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 transition-all shadow-md print:hidden flex items-center gap-2">
                  📄 Guardar como PDF
                </button>
              </div>
              
              <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Estructura</b> <br/> {reporte.sub_scores?.estructura}/100</div>
                 <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Conversiones</b> <br/> {reporte.sub_scores?.conversiones}/100</div>
                 <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Presupuesto</b> <br/> {reporte.sub_scores?.presupuesto}/100</div>
                 <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100"><b>Keywords</b> <br/> {reporte.sub_scores?.keywords}/100</div>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-xl">
                  <h3 className="text-xl font-bold text-red-700 mb-2">🔴 Problemas Graves</h3>
                  {reporte.hallazgos?.graves_rojo?.map((item: any, i: number) => (
                    <p key={i} className="mb-2 text-red-900"><b>{item.titulo}:</b> {item.descripcion}</p>
                  ))}
                </div>
                <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4 rounded-r-xl">
                  <h3 className="text-xl font-bold text-yellow-700 mb-2">🟡 Áreas Débiles</h3>
                  {reporte.hallazgos?.debiles_amarillo?.map((item: any, i: number) => (
                    <p key={i} className="mb-2 text-yellow-900"><b>{item.titulo}:</b> {item.descripcion}</p>
                  ))}
                </div>
                <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-xl">
                  <h3 className="text-xl font-bold text-green-700 mb-2">🟢 Puntos Fuertes</h3>
                  {reporte.hallazgos?.bien_verde?.map((item: any, i: number) => (
                    <p key={i} className="mb-2 text-green-900"><b>{item.titulo}:</b> {item.descripcion}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === "historial" && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 print:hidden">
          <h2 className="text-3xl font-black mb-6 text-slate-800">Cartera de Clientes 💼</h2>
          
          {cargandoHistorial ? (
            <p className="text-slate-500 font-medium text-center py-10">Cargando base de datos...</p>
          ) : historial.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 text-lg mb-2">Todavía no tenés auditorías guardadas.</p>
              <button onClick={() => setVista("nueva")} className="text-blue-600 font-bold hover:underline">¡Hacé tu primera auditoría acá!</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historial.map((item, index) => (
                <div key={index} className="border-2 border-slate-100 p-6 rounded-xl hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group cursor-pointer"
                     onClick={() => {
                        setReporte(item.reporte_json);
                        setNombreCuenta(item.nombre_cuenta);
                        setVista("nueva");
                     }}>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{item.nombre_cuenta}</h3>
                    <p className="text-sm text-slate-500 font-medium">Score General: <span className="text-slate-700 font-bold">{item.score}/100</span></p>
                  </div>
                  <div className="text-2xl opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    👉
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function AuditorPageWrapper() {
  return (
    <SessionProvider>
      <AuditorDashboard />
    </SessionProvider>
  );
}