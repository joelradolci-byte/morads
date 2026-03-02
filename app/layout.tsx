import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mora | Tu copiloto para Google Ads",
  description: "Auditorías inteligentes de Google Ads en segundos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 text-gray-900`}
      >
        {/* BARRA DE NAVEGACIÓN (NAVBAR) */}
        <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo y Nombre a la izquierda */}
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
              <span className="text-2xl">🫐</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Mora
              </span>
            </Link>

            {/* Botón Go Pro a la derecha */}
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Mi Panel
              </Link>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2 rounded-full font-medium text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Go Pro 🚀
              </button>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL (Acá adentro va a ir tu page.tsx) */}
        <main className="flex-grow w-full flex flex-col">
          {children}
        </main>

        {/* PIE DE PÁGINA (FOOTER) */}
        <footer className="w-full bg-white border-t border-gray-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Mora. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-indigo-600 transition-colors">About</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Feedback</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Términos</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Contacto</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}