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
      {/* El nuevo fondo oscuro profundo */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-screen overflow-x-hidden bg-[#0a0a0c] text-slate-200 flex flex-col relative`}
      >
        {/* MAGIA GLASS: Esferas de luz sutiles en tonos rosa/durazno de tu diseño */}
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-[#ff7eb3]/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#ffb199]/5 blur-[120px] pointer-events-none -z-10" />

        <main className="w-full flex-grow flex flex-col z-10">
          {children}
        </main>
      </body>
    </html>
  );
}