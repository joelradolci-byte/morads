"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PANEL_DIMENSIONS } from "../../lib/panelDimensions";

export type MoraOverlayVariant = "modal" | "split" | "resumen";

interface MoraOverlayProps {
  open: boolean;
  isClosing?: boolean;
  variant: MoraOverlayVariant;
  onClose: () => void;
  zIndex?: number;
  children: ReactNode;
}

export default function MoraOverlay({
  open,
  isClosing = false,
  variant,
  onClose,
  zIndex = 130,
  children,
}: MoraOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (!open && !isClosing)) return null;

  const backdropClass = isClosing ? "mora-overlay-fade-out" : "mora-overlay-fade-in";
  const panelEnter = isClosing ? "animate-mora-panel-out" : "animate-mora-panel-in";
  const size =
    variant === "modal"
      ? PANEL_DIMENSIONS.modal
      : variant === "resumen"
        ? PANEL_DIMENSIONS.resumen
        : PANEL_DIMENSIONS.split;

  const content = (
    <div
      className="fixed inset-0 grid print:hidden place-items-center p-4 md:p-6"
      style={{ zIndex }}
    >
      <div
        className={`absolute inset-0 bg-[#0a0a0a]/75 backdrop-blur-sm cursor-pointer ${backdropClass}`}
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative flex flex-col overflow-hidden shadow-2xl rounded-3xl border border-[#E5E7EB] bg-[#FAFAFA] shrink-0 ${
          variant === "resumen" ? "max-h-[min(85dvh,85vh)] h-[min(85dvh,85vh)]" : "max-h-[82vh]"
        } ${panelEnter}`}
        style={{
          width: size.width,
          maxWidth: size.maxWidth,
          maxHeight: size.maxHeight,
          height: variant === "resumen" ? size.maxHeight : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes moraOverlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes moraOverlayFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes moraPanelIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes moraPanelOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.98) translateY(8px);
          }
        }
        .mora-overlay-fade-in {
          animation: moraOverlayFadeIn 0.35s ease-out forwards;
        }
        .mora-overlay-fade-out {
          animation: moraOverlayFadeOut 0.3s ease-out forwards;
        }
        .animate-mora-panel-in {
          animation: moraPanelIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-mora-panel-out {
          animation: moraPanelOut 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
