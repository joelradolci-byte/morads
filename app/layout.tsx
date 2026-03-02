import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      {/* El fondo base: un gradiente muy suave de tonos crema/gris claro */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen w-screen overflow-hidden bg-gradient-to-br from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] text-slate-800 flex relative`}
      >
        {/* MAGIA GLASS: Esferas de luz desenfocadas de fondo */}
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-300/10 blur-[100px] pointer-events-none -z-10" />

        {/* El contenedor principal donde va a ir tu Sidebar y el Panel Central */}
        <main className="w-full h-full flex">
          {children}
        </main>
      </body>
    </html>
  );
}