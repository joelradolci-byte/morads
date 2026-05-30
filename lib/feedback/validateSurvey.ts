import { FEEDBACK_COMMENT_MAX } from "./config";
import {
  FEATURE_BLOCK_KEYS,
  INTERES_KEYS,
  type FeatureBlockKey,
  type FeatureUsage,
  type InteresKey,
} from "./features";

export type SurveyPayload = {
  nps: number;
  feature_ratings: Record<FeatureBlockKey, FeatureUsage>;
  intereses: InteresKey[];
  comentario?: string;
};

const USAGE_SET = new Set<FeatureUsage>(["mucho", "algo", "poco", "no_usado"]);

export function parseSurveyBody(body: unknown):
  | { ok: true; data: SurveyPayload }
  | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Cuerpo inválido." };
  }

  const raw = body as Record<string, unknown>;

  const nps = raw.nps;
  if (typeof nps !== "number" || !Number.isInteger(nps) || nps < 0 || nps > 10) {
    return { ok: false, message: "NPS debe ser un número entero entre 0 y 10." };
  }

  const ratingsRaw = raw.feature_ratings;
  if (!ratingsRaw || typeof ratingsRaw !== "object") {
    return { ok: false, message: "Faltan las valoraciones por bloque." };
  }

  const feature_ratings = {} as Record<FeatureBlockKey, FeatureUsage>;
  for (const key of FEATURE_BLOCK_KEYS) {
    const v = (ratingsRaw as Record<string, unknown>)[key];
    if (typeof v !== "string" || !USAGE_SET.has(v as FeatureUsage)) {
      return { ok: false, message: `Valoración inválida para ${key}.` };
    }
    feature_ratings[key] = v as FeatureUsage;
  }

  let intereses: InteresKey[] = [];
  if (raw.intereses !== undefined) {
    if (!Array.isArray(raw.intereses)) {
      return { ok: false, message: "intereses debe ser un array." };
    }
    const set = new Set<InteresKey>();
    for (const item of raw.intereses) {
      if (typeof item !== "string" || !INTERES_KEYS.includes(item as InteresKey)) {
        return { ok: false, message: "Interés inválido." };
      }
      set.add(item as InteresKey);
    }
    intereses = [...set];
  }

  let comentario: string | undefined;
  if (raw.comentario !== undefined && raw.comentario !== null) {
    if (typeof raw.comentario !== "string") {
      return { ok: false, message: "Comentario inválido." };
    }
    const trimmed = raw.comentario.trim();
    if (trimmed.length > FEEDBACK_COMMENT_MAX) {
      return {
        ok: false,
        message: `El comentario no puede superar ${FEEDBACK_COMMENT_MAX} caracteres.`,
      };
    }
    comentario = trimmed.length > 0 ? trimmed : undefined;
  }

  return {
    ok: true,
    data: { nps, feature_ratings, intereses, comentario },
  };
}
