import { stripHallazgoParaRedactor } from "./auditPayload";
import {
  SYSTEM_ANUNCIOS_RSA,
  SYSTEM_ESTRATEGA_AUDITORIA,
  SYSTEM_REDACTOR_HALLAZGOS,
} from "./prompts";
import { callMoraAI } from "./provider";
import type {
  AnunciosRsaResponse,
  EstrategaAuditoriaResponse,
  HallazgosBuckets,
  RedactorHallazgosResponse,
} from "./types";

const REDACTOR_BATCH_SIZE = 10;

function buildHallazgosPayload(esqueleto: { hallazgos?: HallazgosBuckets }): HallazgosBuckets {
  const h = esqueleto.hallazgos;
  return {
    graves_rojo: (h?.graves_rojo || []).map(item =>
      stripHallazgoParaRedactor(item as unknown as Record<string, unknown>)
    ),
    debiles_amarillo: (h?.debiles_amarillo || []).map(item =>
      stripHallazgoParaRedactor(item as unknown as Record<string, unknown>)
    ),
    bien_verde: (h?.bien_verde || []).map(item =>
      stripHallazgoParaRedactor(item as unknown as Record<string, unknown>)
    ),
  };
}

async function redactorBucket(
  bucket: keyof HallazgosBuckets,
  items: HallazgosBuckets[keyof HallazgosBuckets],
  idioma: string
): Promise<HallazgosBuckets[keyof HallazgosBuckets]> {
  if (items.length === 0) return items;

  const merged: HallazgosBuckets[keyof HallazgosBuckets] = [];

  for (let i = 0; i < items.length; i += REDACTOR_BATCH_SIZE) {
    const slice = items.slice(i, i + REDACTOR_BATCH_SIZE);
    const parsed = await callMoraAI<RedactorHallazgosResponse>({
      task: "redactor_hallazgos",
      system: SYSTEM_REDACTOR_HALLAZGOS,
      user: `Idioma: ${idioma}\n\n${JSON.stringify({ hallazgos: { [bucket]: slice } })}`,
      temperature: 0.1,
    });
    merged.push(...(parsed?.hallazgos?.[bucket] ?? slice));
  }

  return merged;
}

export async function ejecutarRedactorHallazgos(
  esqueleto: { hallazgos?: HallazgosBuckets },
  idioma: string
): Promise<HallazgosBuckets> {
  const payload = buildHallazgosPayload(esqueleto);
  const total =
    payload.graves_rojo.length + payload.debiles_amarillo.length + payload.bien_verde.length;
  if (total === 0) return payload;

  const [graves_rojo, debiles_amarillo, bien_verde] = await Promise.all([
    redactorBucket("graves_rojo", payload.graves_rojo, idioma),
    redactorBucket("debiles_amarillo", payload.debiles_amarillo, idioma),
    redactorBucket("bien_verde", payload.bien_verde, idioma),
  ]);

  return { graves_rojo, debiles_amarillo, bien_verde };
}

export async function ejecutarEstrategaAuditoria(
  payloadCompacto: Record<string, unknown>,
  idioma: string
): Promise<EstrategaAuditoriaResponse | null> {
  try {
    return await callMoraAI<EstrategaAuditoriaResponse>({
      task: "estratega_auditoria",
      system: SYSTEM_ESTRATEGA_AUDITORIA,
      user: `Idioma: ${idioma}\n\nInput del motor Mora:\n${JSON.stringify(payloadCompacto)}`,
      temperature: 0.35,
    });
  } catch (error) {
    console.error("[mora-ai] estratega_auditoria falló (degradación):", error);
    return null;
  }
}

export async function ejecutarAnunciosRsa(
  promptUsuario: string
): Promise<AnunciosRsaResponse> {
  return callMoraAI<AnunciosRsaResponse>({
    task: "anuncios_rsa",
    system: SYSTEM_ANUNCIOS_RSA,
    user: promptUsuario,
    temperature: 0.35,
  });
}
