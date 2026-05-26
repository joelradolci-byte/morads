"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PANEL_DIMENSIONS } from "../../lib/panelDimensions";

interface ToolPanelShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
}

export default function ToolPanelShell({
  open,
  onClose,
  children,
  zIndex = 120,
}: ToolPanelShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const { width, maxWidth, maxHeight } = PANEL_DIMENSIONS.drawer;

  return createPortal(
    <div
      className="fixed inset-0 flex justify-end items-center p-4 md:p-6 print:hidden"
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative flex flex-col overflow-hidden bg-[#1C1917] border-l border-[#44403C] shadow-[0_0_50px_rgba(0,0,0,0.4)] shrink-0"
        style={{
          width,
          maxWidth,
          maxHeight,
          height: maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
