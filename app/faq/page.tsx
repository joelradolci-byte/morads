export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#FDE8D3] text-[#262B27] font-sans selection:bg-[#F3C3B2]">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <a href="/" className="inline-block mb-12 text-[#657166] hover:text-[#262B27] font-bold text-sm transition-colors border border-[#CFD6C4]/50 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-sm">← Volver al inicio</a>
        <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Centro de Ayuda</h1>
        <p className="text-xl text-[#657166] mb-12 font-medium">Todo lo que necesitás saber sobre cómo protegemos y optimizamos tus cuentas.</p>
        
        <div className="bg-white/60 backdrop-blur-xl border border-[#CFD6C4]/60 rounded-3xl p-12 text-left shadow-lg">
          <p className="text-lg text-[#657166] font-medium italic text-center">Base de conocimiento expandida en construcción...</p>
        </div>
      </div>
    </div>
  );
}