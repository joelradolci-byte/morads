"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuditorPageWrapper from "../dashboard/DashboardClient";
import type { CampanasSubVista, FiltroCampanaTag } from "../../lib/campanasEvaluacion";

function CampanasRouteInner() {
  const sp = useSearchParams();
  const vista = sp.get("vista");
  const subVista: CampanasSubVista =
    vista === "matriz" || vista === "pacing" || vista === "lista" ? vista : "lista";
  const tagRaw = sp.get("tag");
  const tag: FiltroCampanaTag =
    tagRaw === "ESTRELLA" || tagRaw === "POTENCIAL" || tagRaw === "DUDOSO" || tagRaw === "BASURA"
      ? tagRaw
      : "todos";

  return (
    <AuditorPageWrapper
      initialVista="campañas"
      initialCampanasQuery={{
        subVista,
        q: sp.get("q") ?? "",
        tag,
        campanaId: sp.get("campana") ?? "",
      }}
    />
  );
}

export default function CampanasRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C3B2]" />
        </div>
      }
    >
      <CampanasRouteInner />
    </Suspense>
  );
}
