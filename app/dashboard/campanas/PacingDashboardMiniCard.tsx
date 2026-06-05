"use client";

import {
  desvioPacingVsMes,
  etiquetaScoreCampana,
  type CampanaEvaluada,
} from "../../../lib/campanasEvaluacion";
import {
  PACING_MINI_CARD_NEUTRAL_TEXT,
  PACING_MINI_CARD_SHELL,
} from "./pacingDashboardCardTheme";

type Props = {
  item: CampanaEvaluada;
};

export default function PacingDashboardMiniCard({ item }: Props) {
  const { campana, pacing, evaluacion } = item;
  const pct = Math.round(pacing.porcentajeGasto);
  const desvio = desvioPacingVsMes(pacing);
  const desvioLabel =
    desvio > 0 ? `+${desvio}` : desvio < 0 ? `${desvio}` : "0";

  return (
    <article className={PACING_MINI_CARD_SHELL}>
      <p
        className={`truncate ${PACING_MINI_CARD_NEUTRAL_TEXT.nombre}`}
        title={campana.nombre}
      >
        {campana.nombre}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${pacing.bar}`}
          aria-hidden
        />
        <p
          className={`text-[11px] font-black uppercase tracking-wide ${pacing.color}`}
        >
          {pacing.estado}
        </p>
      </div>

      <div className="mt-4 space-y-1">
        <p className={PACING_MINI_CARD_NEUTRAL_TEXT.label}>Del presupuesto</p>
        <p className={PACING_MINI_CARD_NEUTRAL_TEXT.pct}>{pct}%</p>
        <p className={PACING_MINI_CARD_NEUTRAL_TEXT.secundario}>
          Desvío {desvioLabel} pts vs mes
        </p>
      </div>

      <div className="mt-4">
        <div
          className={`h-2 overflow-hidden rounded-full ${PACING_MINI_CARD_NEUTRAL_TEXT.barTrack}`}
        >
          <div
            className={`h-full ${pacing.bar} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(pacing.porcentajeGasto, 100)}%` }}
          />
        </div>
        <p
          className={`mt-1.5 text-[9px] font-bold uppercase tracking-wide ${PACING_MINI_CARD_NEUTRAL_TEXT.secundario}`}
        >
          {pct}% consumido
        </p>
      </div>

      <div className="mt-auto pt-4">
        <span
          className={`inline-block rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${pacing.bg} ${pacing.color}`}
        >
          Score {etiquetaScoreCampana(evaluacion)}
        </span>
      </div>
    </article>
  );
}
