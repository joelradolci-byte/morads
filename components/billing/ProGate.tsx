"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

type ProGateProps = {
  locked: boolean;
  children: ReactNode;
  blur?: boolean;
  featureLabel?: string;
  onUpgrade?: () => void;
  className?: string;
};

export function ProGate({
  locked,
  children,
  blur = true,
  featureLabel = "Esta función",
  onUpgrade,
  className = "",
}: ProGateProps) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={blur ? "pointer-events-none select-none blur-[2px] opacity-70" : "pointer-events-none opacity-50"}
        aria-hidden
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-white/75 backdrop-blur-sm rounded-xl border border-[#E5E7EB]">
        <Lock size={22} className="text-[#0a0a0a]" strokeWidth={2.5} />
        <p className="text-sm font-bold text-[#0a0a0a] text-center max-w-xs">
          {featureLabel} está disponible en Mora Watchdog
        </p>
        <p className="text-xs text-[#4B5563] font-medium text-center">$27/mes · sin permanencia</p>
        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="px-5 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#262B27] transition-colors"
          >
            Activar Watchdog
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TrialEvalBanner({
  planKind,
  trialDaysLeft,
  auditsLeft,
  pdfLeft,
  onUpgrade,
}: {
  planKind: string;
  trialDaysLeft?: number | null;
  auditsLeft?: number;
  pdfLeft?: number;
  onUpgrade?: () => void;
}) {
  if (planKind === "paid") return null;

  if (planKind === "trial_expired") {
    return (
      <div className="mb-6 p-4 rounded-2xl border border-[#E66767]/40 bg-[#FDE8D3]/80 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-bold text-[#0a0a0a]">
          Tu evaluación terminó. Activá Watchdog para seguir auditando y exportar reportes.
        </p>
        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="px-4 py-2 rounded-xl bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-widest"
          >
            Watchdog — $27/mes
          </button>
        ) : null}
      </div>
    );
  }

  if (planKind === "trial_not_started") {
    return (
      <div className="mb-6 p-4 rounded-2xl border border-[#CFD6C4] bg-[#DAEBE3]/50">
        <p className="text-base font-bold text-[#0a0a0a]">
          Conectá tu cuenta de Google Ads para activar 14 días de evaluación gratuita.
        </p>
      </div>
    );
  }

  if (planKind === "trial_active") {
    return (
      <div className="mb-6 p-4 rounded-2xl border border-[#CFD6C4] bg-white/90 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-medium text-[#4B5563]">
          <span className="font-black text-[#0a0a0a]">Evaluación:</span>{" "}
          {trialDaysLeft ?? "—"} día(s) restantes · {auditsLeft ?? "—"} auditoría(s) ·{" "}
          {pdfLeft ?? "—"} PDF
        </p>
        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="text-xs font-black uppercase tracking-widest text-[#0a0a0a] underline"
          >
            Pasar a Watchdog
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}
