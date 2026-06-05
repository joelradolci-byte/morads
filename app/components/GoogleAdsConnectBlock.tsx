"use client";

import { Link2, CheckCircle2 } from "lucide-react";

type Locale = "es" | "en";

const copy = {
  es: {
    title: "Google Ads",
    connected: "Cuenta autorizada",
    notConnected: "Sin autorizar",
    connect: "Conectar Google Ads",
    reconnect: "Volver a autorizar",
    dataNote:
      "Mora usa datos reales de tu cuenta conectada. Sin tráfico reciente, las métricas pueden aparecer en cero.",
    readOnly:
      "Mora solo aplica cambios en Google Ads cuando vos los confirmás en la app.",
    heroTitle: "Conectá tu cuenta de Google Ads",
    heroBody:
      "Autorizá el acceso para que Mora analice y aplique cambios que confirmes. Es el primer paso antes de tu primera auditoría.",
  },
  en: {
    title: "Google Ads",
    connected: "Account authorized",
    notConnected: "Not authorized",
    connect: "Connect Google Ads",
    reconnect: "Re-authorize",
    dataNote:
      "Mora uses real data from your connected account. Without recent traffic, metrics may show as zero.",
    readOnly:
      "Mora only applies changes in Google Ads when you confirm them in the app.",
    heroTitle: "Connect your Google Ads account",
    heroBody:
      "Authorize access so Mora can analyze your account and apply changes you confirm. This is the first step before your first audit.",
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

  if (variant === "hero") {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center mx-auto">
          <Link2 size={28} className="text-[#93C5FD]" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-black text-[#262B27]">{c.heroTitle}</h3>
          <p className="text-[#657166] text-base font-medium leading-relaxed">{c.heroBody}</p>
          <p className="text-[#8A968C] text-sm font-medium leading-relaxed">{c.readOnly}</p>
          <p className="text-[#657166] text-sm font-medium leading-relaxed border border-[#E5C9A8]/45 rounded-xl px-4 py-3 bg-white/80">
            {c.dataNote}
          </p>
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={checking}
          className="w-full px-8 py-4 rounded-2xl text-xs uppercase tracking-widest font-black bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors shadow-lg disabled:opacity-50"
        >
          {checking ? "…" : connected ? c.reconnect : c.connect}
        </button>
        {connected && (
          <p className="flex items-center justify-center gap-2 text-[#5B9A8B] text-sm font-bold">
            <CheckCircle2 size={16} />
            {c.connected}
          </p>
        )}
      </div>
    );
  }

  const cardClass =
    variant === "inline"
      ? "rounded-xl border border-[#E5C9A8]/45 bg-white/85 p-4"
      : "rounded-2xl border border-[#E5E7EB] bg-[#F4F4F5] p-6 md:p-8";

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connected
                ? "bg-[#5B9A8B]/12 border border-[#5B9A8B]/30 text-[#5B9A8B]"
                : "bg-[#4285F4]/12 border border-[#4285F4]/25 text-[#4285F4]"
            }`}
          >
            {connected ? <CheckCircle2 size={20} /> : <Link2 size={20} />}
          </div>
          <div>
            <p
              className={`text-lg font-black ${
                variant === "inline" ? "text-[#262B27]" : "text-[#0a0a0a]"
              }`}
            >
              {c.title}
            </p>
            <p
              className={`text-base mt-1 font-medium ${
                variant === "inline" ? "text-[#657166]" : "text-[#4B5563]"
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
          className={`text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-colors disabled:opacity-50 ${
            variant === "inline"
              ? "border border-[#E5C9A8]/50 bg-[#0a0a0a] text-[#FDE8D3] hover:bg-[#262B27]"
              : "bg-[#E0E7FF] text-[#0a0a0a] hover:bg-[#eab3a1] border border-[#E0E7FF]"
          }`}
        >
          {connected ? c.reconnect : c.connect}
        </button>
      </div>
      <p
        className={`text-sm mt-4 font-medium leading-relaxed ${
          variant === "inline" ? "text-[#657166]" : "text-[#4B5563]"
        }`}
      >
        {c.dataNote}
      </p>
      <p
        className={`text-sm mt-3 font-medium ${
          variant === "inline" ? "text-[#8A968C]" : "text-[#8A968C]"
        }`}
      >
        {c.readOnly}
      </p>
    </div>
  );
}
