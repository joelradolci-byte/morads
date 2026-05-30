"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { moraAuthHeaders } from "@/lib/auth/client-headers";
import type { FeedbackEligibility } from "@/lib/feedback/eligibility";
import EncuestaFeedbackModal from "./EncuestaFeedbackModal";

type Props = {
  active: boolean;
};

export default function FeedbackFab({ active }: Props) {
  const [eligibility, setEligibility] = useState<FeedbackEligibility | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [thanksFlash, setThanksFlash] = useState(false);

  const loadEligibility = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/eligibility", {
        headers: await moraAuthHeaders(),
      });
      if (res.ok) {
        const data = (await res.json()) as FeedbackEligibility;
        setEligibility(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  const handleSuccess = () => {
    setThanksFlash(true);
    void loadEligibility();
    setTimeout(() => setThanksFlash(false), 4000);
  };

  if (!active || loading) return null;
  if (!eligibility?.showFab) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title="Ayudanos a mejorar Mora"
        className="fixed z-[90] bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-2xl bg-[#F3C3B2] text-[#0a0a0a] shadow-lg border border-[#eab3a1]/80 flex items-center justify-center hover:scale-105 hover:bg-[#eab3a1] transition-all print:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Abrir encuesta de feedback"
      >
        <MessageSquare size={22} strokeWidth={2.5} />
      </button>

      {thanksFlash && (
        <div
          className="fixed z-[91] bottom-24 right-6 md:right-8 max-w-[220px] bg-[#0a0a0a] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-[#44403C] print:hidden"
          role="status"
        >
          ¡Gracias! Tu opinión nos ayuda un montón.
        </div>
      )}

      <EncuestaFeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
