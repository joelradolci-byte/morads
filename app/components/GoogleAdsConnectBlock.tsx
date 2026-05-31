"use client";

import { Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { isGoogleAdsDemoMode } from "../../lib/googleAdsMode";

type Locale = "es" | "en";

const copy = {
  es: {
    title: "Google Ads",
    connected: "Cuenta autorizada",
    notConnected: "Sin autorizar",
    connect: "Conectar Google Ads",
    reconnect: "Volver a autorizar",
    demoNote:
      "El análisis usa datos de demostración hasta activar la API en vivo. Los montos respetan la moneda de tu cuenta cuando esté activa.",
    readOnly:
      "Solo lectura: Mora no puede crear, pausar ni modificar campañas sin tu acción.",
    heroTitle: "Conectá tu cuenta de Google Ads",
    heroBody:
      "Autorizá el acceso de solo lectura para que Mora analice tus campañas. Es el primer paso antes de tu primera auditoría.",
  },
  en: {
    title: "Google Ads",
    connected: "Account authorized",
    notConnected: "Not authorized",
    connect: "Connect Google Ads",
    reconnect: "Re-authorize",
    demoNote:
      "Audits use demo data until the live API is enabled. Amounts will follow your account currency once live.",
    readOnly:
      "Read-only: Mora cannot create, pause, or change campaigns without you.",
    heroTitle: "Connect your Google Ads account",
    heroBody:
      "Grant read-only access so Mora can analyze your campaigns. This is the first step before your first audit.",
  },
} as const;

export interface GoogleAdsConnectBlockProps {
  locale: Locale;
  connected: boolean;
  checking?: boolean;
  onConnect: () => void;
  variant?: "settings" | "hero" | "inline";
}

export default function GoogleAdsConnectBlock({
  locale,
  connected,
  checking = false,
  onConnect,
  variant = "settings",
}: GoogleAdsConnectBlockProps) {
  const c = copy[locale];
  const demo = isGoogleAdsDemoMode();

  if (variant === "hero") {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center mx-auto">
          <Link2 size={28} className="text-[#93C5FD]" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-black text-[#F5F0EB]">{c.heroTitle}</h3>
          <p className="text-[#A8A29E] text-sm font-medium leading-relaxed">{c.heroBody}</p>
          <p className="text-[#78716C] text-xs font-medium leading-relaxed">{c.readOnly}</p>
          {demo && (
            <p className="text-[#78716C] text-xs font-medium leading-relaxed border border-[#44403C] rounded-xl px-4 py-3 bg-[#1C1917]/80">
              {c.demoNote}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={checking}
          className="w-full px-8 py-4 rounded-2xl text-sm uppercase tracking-widest font-black bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors shadow-lg disabled:opacity-50"
        >
          {checking ? "…" : connected ? c.reconnect : c.connect}
        </button>
        {connected && (
          <p className="flex items-center justify-center gap-2 text-[#10B981] text-xs font-bold">
            <CheckCircle2 size={16} />
            {c.connected}
          </p>
        )}
      </div>
    );
  }

  const cardClass =
    variant === "inline"
      ? "rounded-xl border border-[#44403C] bg-[#1C1917]/80 p-4"
      : "rounded-2xl border border-[#E5E7EB] bg-[#F4F4F5] p-6 md:p-8";

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connected
                ? "bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]"
                : "bg-[#E0E7FF]/30 border border-[#E0E7FF] text-[#6366F1]"
            }`}
          >
            {connected ? <CheckCircle2 size={20} /> : <Link2 size={20} />}
          </div>
          <div>
            <p
              className={`text-lg font-black ${
                variant === "inline" ? "text-[#F5F0EB]" : "text-[#0a0a0a]"
              }`}
            >
              {c.title}
            </p>
            <p
              className={`text-sm mt-1 font-medium ${
                variant === "inline" ? "text-[#A8A29E]" : "text-[#4B5563]"
              }`}
            >
              {connected ? c.connected : c.notConnected}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={checking}
          className={`text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${
            variant === "inline"
              ? "border border-[#44403C] text-[#F3C3B2] hover:bg-[#F3C3B2]/10"
              : "bg-[#E0E7FF] text-[#0a0a0a] hover:bg-[#eab3a1] border border-[#E0E7FF]"
          }`}
        >
          {connected ? c.reconnect : c.connect}
        </button>
      </div>
      {demo && (
        <p
          className={`text-xs mt-4 font-medium leading-relaxed flex gap-2 ${
            variant === "inline" ? "text-[#78716C]" : "text-[#4B5563]"
          }`}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {c.demoNote}
        </p>
      )}
      <p
        className={`text-[10px] mt-3 font-medium ${
          variant === "inline" ? "text-[#57534E]" : "text-[#8A968C]"
        }`}
      >
        {c.readOnly}
      </p>
    </div>
  );
}
